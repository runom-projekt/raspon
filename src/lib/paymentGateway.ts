import { createHmac, timingSafeEqual } from "crypto";

export const PAYMENT_GATEWAY_TOKEN_TTL_SECONDS = 15 * 60;

export interface PaymentGatewayClaims {
  version: 1;
  paymentId: string;
  bookingCode: string;
  amountMinor: number;
  currency: string;
  returnUrl: string;
  issuedAt: number;
  expiresAt: number;
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createPaymentGatewayToken(
  claims: Omit<PaymentGatewayClaims, "version" | "issuedAt" | "expiresAt">,
  secret: string,
  nowMs = Date.now()
): string {
  if (secret.length < 32) throw new Error("PAYMENT_GATEWAY_SECRET must contain at least 32 characters");
  const issuedAt = Math.floor(nowMs / 1000);
  const payload = base64url(JSON.stringify({
    version: 1,
    ...claims,
    issuedAt,
    expiresAt: issuedAt + PAYMENT_GATEWAY_TOKEN_TTL_SECONDS,
  } satisfies PaymentGatewayClaims));
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyPaymentGatewayToken(
  token: string,
  secret: string,
  nowMs = Date.now()
): PaymentGatewayClaims | null {
  const [payload, supplied, extra] = token.split(".");
  if (!payload || !supplied || extra) return null;
  const expected = signature(payload, secret);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PaymentGatewayClaims;
    if (claims.version !== 1 || claims.expiresAt <= Math.floor(nowMs / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function getPaymentGatewayUrl(env: Record<string, string | undefined> = process.env): URL {
  const url = new URL(env.PAYMENT_GATEWAY_URL ?? "");
  if (url.protocol !== "https:" || url.hostname !== "hms-runo.de") {
    throw new Error("PAYMENT_GATEWAY_URL must use https://hms-runo.de");
  }
  return url;
}

export function signGatewayCallback(rawBody: string, timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function verifyGatewayCallback({
  rawBody,
  timestamp,
  suppliedSignature,
  secret,
  nowMs = Date.now(),
}: {
  rawBody: string;
  timestamp: string | null;
  suppliedSignature: string | null;
  secret: string;
  nowMs?: number;
}): boolean {
  if (!timestamp || !suppliedSignature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(nowMs - Number(timestamp)) > 5 * 60 * 1000) return false;
  const expected = signGatewayCallback(rawBody, timestamp, secret);
  const a = Buffer.from(suppliedSignature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface GatewayReversalResponse {
  providerOperationId: string;
  state: "SUBMITTED" | "COMPLETED";
}

export async function submitGatewayReversal({
  reversalId,
  type,
  providerOrderId,
  amountMinor,
  currency,
}: {
  reversalId: string;
  type: "CANCEL_ORDER" | "FULL_REFUND";
  providerOrderId: string;
  amountMinor: number;
  currency: string;
}): Promise<GatewayReversalResponse> {
  const secret = process.env.PAYMENT_GATEWAY_SECRET;
  if (!secret || secret.length < 32) throw new Error("Payment gateway is not configured");
  const endpoint = new URL("reversal.php", getPaymentGatewayUrl());
  const rawBody = JSON.stringify({ reversalId, type, providerOrderId, amountMinor, currency });
  const timestamp = String(Date.now());
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-gateway-timestamp": timestamp,
      "x-gateway-signature": signGatewayCallback(rawBody, timestamp, secret),
    },
    body: rawBody,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HMS reversal failed (${response.status})`);
  const result = await response.json() as Partial<GatewayReversalResponse>;
  if (!result.providerOperationId || !["SUBMITTED", "COMPLETED"].includes(result.state ?? "")) {
    throw new Error("Invalid HMS reversal response");
  }
  return result as GatewayReversalResponse;
}
