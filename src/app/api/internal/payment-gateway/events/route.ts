import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyGatewayCallback } from "@/lib/paymentGateway";
import {
  PaymentGatewayEventError,
  processPaymentGatewayEvent,
} from "@/server/services/paymentGatewayEventService";

export const runtime = "nodejs";

const schema = z.object({
  eventId: z.string().min(8).max(128),
  event: z.enum(["PAYMENT_COMPLETED", "PAYMENT_FAILED"]),
  source: z.literal("RASPON"),
  paymentId: z.string().min(8).max(64),
  providerOrderId: z.string().uuid(),
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

export async function POST(req: NextRequest) {
  const secret = process.env.PAYMENT_GATEWAY_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: "Gateway not configured" }, { status: 503 });
  const rawBody = await req.text();
  if (!verifyGatewayCallback({ rawBody, timestamp: req.headers.get("x-gateway-timestamp"), suppliedSignature: req.headers.get("x-gateway-signature"), secret })) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse((() => { try { return JSON.parse(rawBody); } catch { return null; } })());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    const result = await processPaymentGatewayEvent({
      event: parsed.data,
      payloadHash: createHash("sha256").update(rawBody).digest("hex"),
      requestId: req.headers.get("x-request-id"),
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof PaymentGatewayEventError) {
      if (error.code === "NOT_FOUND") return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      return NextResponse.json({ error: error.code === "PAYMENT_MISMATCH" ? "Payment mismatch" : "Provider order mismatch" }, { status: 409 });
    }
    throw error;
  }
}
