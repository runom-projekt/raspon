import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processPaymentGatewayEvent } from "@/server/services/paymentGatewayEventService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN" || !session.mfa) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { payment: true } });
  if (!booking?.payment || booking.payment.provider !== "BANK_TRANSFER" || booking.payment.status === "PAID") return NextResponse.json({ error: "Keine offene Banküberweisung" }, { status: 409 });
  const providerOrderId = `bank-${booking.code}`;
  const result = await processPaymentGatewayEvent({ provider: "BANK_TRANSFER", event: { eventId: providerOrderId, event: "PAYMENT_COMPLETED", paymentId: booking.payment.id, providerOrderId, amountMinor: booking.payment.amount.mul(100).toDecimalPlaces(0).toNumber(), currency: booking.payment.currency }, payloadHash: createHash("sha256").update(providerOrderId).digest("hex"), requestId: req.headers.get("x-request-id") });
  return NextResponse.json(result);
}
