import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";
import { capturePayPalOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { verifyPaymentGatewayToken } from "@/lib/paymentGateway";
import { processPaymentGatewayEvent } from "@/server/services/paymentGatewayEventService";

export async function GET(req: NextRequest) {
  const fallback = new URL("/buchungen", SITE_URL);
  const secret = process.env.PAYMENT_GATEWAY_SECRET;
  const state = req.nextUrl.searchParams.get("state") ?? "";
  const orderId = req.nextUrl.searchParams.get("token") ?? "";
  const claims = secret ? verifyPaymentGatewayToken(state, secret) : null;
  if (!claims || !orderId) return NextResponse.redirect(fallback);
  const destination = new URL(claims.returnUrl);
  if (destination.origin !== new URL(SITE_URL).origin) return NextResponse.redirect(fallback);
  try {
    const payment = await prisma.payment.findUnique({ where: { id: claims.paymentId } });
    if (!payment || payment.provider !== "PAYPAL" || payment.providerPaymentId !== orderId) throw new Error("Payment mismatch");
    if (payment.status === "PAID" && payment.providerCaptureId) {
      destination.searchParams.set("payment", "completed");
      return NextResponse.redirect(destination);
    }
    const captured = await capturePayPalOrder(orderId, `capture-${payment.id}`);
    if (captured.customId !== payment.id || captured.currency !== payment.currency.toUpperCase() || captured.amount !== payment.amount.toFixed(2)) throw new Error("Captured payment mismatch");
    await processPaymentGatewayEvent({ provider: "PAYPAL", event: { eventId: captured.captureId, event: "PAYMENT_COMPLETED", paymentId: payment.id, providerOrderId: orderId, amountMinor: claims.amountMinor, currency: claims.currency }, payloadHash: createHash("sha256").update(`${orderId}:${captured.captureId}`).digest("hex"), requestId: req.headers.get("x-request-id"), providerCaptureId: captured.captureId });
    destination.searchParams.set("payment", "completed");
  } catch {
    destination.searchParams.set("payment", "verification-error");
  }
  return NextResponse.redirect(destination);
}
