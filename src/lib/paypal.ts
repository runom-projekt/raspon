import "server-only";

type PayPalEnvironment = "sandbox" | "live";

function config() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = (process.env.PAYPAL_ENVIRONMENT ?? "sandbox") as PayPalEnvironment;
  if (!clientId || !clientSecret || !["sandbox", "live"].includes(environment)) {
    throw new Error("PayPal is not configured");
  }
  return {
    clientId,
    clientSecret,
    baseUrl: environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  };
}

async function accessToken(): Promise<{ token: string; baseUrl: string }> {
  const { clientId, clientSecret, baseUrl } = config();
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`PayPal authentication failed (${response.status})`);
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("PayPal returned no access token");
  return { token: body.access_token, baseUrl };
}

async function paypalRequest(path: string, init: RequestInit, requestId?: string) {
  const { token, baseUrl } = await accessToken();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) throw new Error(`PayPal request failed (${response.status})`);
  return body ?? {};
}

export async function createPayPalOrder(input: {
  paymentId: string;
  bookingCode: string;
  amount: string;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const order = await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: input.paymentId,
        custom_id: input.paymentId,
        invoice_id: input.bookingCode,
        amount: { currency_code: input.currency, value: input.amount },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Raspon",
            user_action: "PAY_NOW",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  }, `create-${input.paymentId}`);
  const id = typeof order.id === "string" ? order.id : null;
  const links = Array.isArray(order.links) ? order.links as Array<{ rel?: string; href?: string }> : [];
  const approveUrl = links.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
  if (!id || !approveUrl) throw new Error("PayPal returned an invalid order");
  return { id, approveUrl };
}

export async function capturePayPalOrder(orderId: string, requestId: string) {
  const order = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    body: "{}",
  }, requestId);
  const units = Array.isArray(order.purchase_units) ? order.purchase_units as Array<Record<string, unknown>> : [];
  const unit = units[0] ?? {};
  const payments = unit.payments as { captures?: Array<Record<string, unknown>> } | undefined;
  const capture = payments?.captures?.[0];
  const amount = capture?.amount as { value?: string; currency_code?: string } | undefined;
  if (order.status !== "COMPLETED" || capture?.status !== "COMPLETED" || typeof capture.id !== "string") {
    throw new Error("PayPal payment was not completed");
  }
  return {
    captureId: capture.id,
    customId: typeof unit.custom_id === "string" ? unit.custom_id : "",
    amount: amount?.value ?? "",
    currency: amount?.currency_code ?? "",
  };
}

export async function refundPayPalCapture(captureId: string, amount: string, currency: string, requestId: string) {
  const refund = await paypalRequest(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: "POST",
    body: JSON.stringify({ amount: { value: amount, currency_code: currency } }),
  }, requestId);
  if (typeof refund.id !== "string" || refund.status !== "COMPLETED") throw new Error("PayPal refund was not completed");
  return refund.id;
}
