import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyGatewayCallback } from "@/lib/paymentGateway";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z.object({
  event: z.enum(["REFUND_COMPLETED", "REFUND_FAILED"]),
  reversalId: z.string().min(8).max(64),
  providerOperationId: z.string().uuid(),
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
  const event = parsed.data;
  const reversal = await prisma.paymentReversal.findUnique({ where: { id: event.reversalId }, include: { payment: true, booking: true } });
  if (!reversal || reversal.type !== "FULL_REFUND") return NextResponse.json({ error: "Reversal not found" }, { status: 404 });
  const expected = reversal.amount.mul(100).toDecimalPlaces(0).toNumber();
  if (expected !== event.amountMinor || reversal.currency.toUpperCase() !== event.currency.toUpperCase()) return NextResponse.json({ error: "Refund mismatch" }, { status: 409 });
  if (reversal.providerOperationId && reversal.providerOperationId !== event.providerOperationId) return NextResponse.json({ error: "Refund order mismatch" }, { status: 409 });

  const completed = event.event === "REFUND_COMPLETED";
  const changed = await prisma.$transaction(async (tx) => {
    const update = await tx.paymentReversal.updateMany({
      where: { id: reversal.id, status: { in: ["SUBMITTING", "SUBMITTED"] }, OR: [{ providerOperationId: null }, { providerOperationId: event.providerOperationId }] },
      data: { status: completed ? "COMPLETED" : "FAILED", providerOperationId: event.providerOperationId, completedAt: completed ? new Date() : null, lastError: completed ? null : "Provider reported refund failure" },
    });
    if (update.count !== 1) return false;
    if (completed) {
      await tx.payment.update({ where: { id: reversal.paymentId }, data: { status: "REFUNDED", refundedAmount: reversal.amount, depositHeld: false } });
    }
    await tx.notification.createMany({ data: [
      { userId: reversal.booking.renterId, channel: "IN_APP", title: completed ? "Rückzahlung abgeschlossen" : "Rückzahlung wird geprüft", body: completed ? `Die Rückzahlung für Buchung ${reversal.booking.code} wurde abgeschlossen.` : `Die Rückzahlung für Buchung ${reversal.booking.code} konnte nicht automatisch abgeschlossen werden und wurde zur Prüfung markiert.` },
      { userId: reversal.booking.renterId, channel: "EMAIL", title: completed ? "Rückzahlung abgeschlossen" : "Rückzahlung wird geprüft", body: completed ? `Die Rückzahlung für Buchung ${reversal.booking.code} wurde abgeschlossen.` : `Die Rückzahlung für Buchung ${reversal.booking.code} konnte nicht automatisch abgeschlossen werden und wurde zur Prüfung markiert.` },
    ] });
    await appendAuditLog(tx, { actor: { sub: "SYSTEM", email: null, role: "ADMIN" }, requestId: req.headers.get("x-request-id"), action: completed ? "REFUND_COMPLETED" : "REFUND_FAILED", entityType: "PaymentReversal", entityId: reversal.id, changes: { providerOperationId: event.providerOperationId, amount: reversal.amount.toString(), currency: reversal.currency } });
    return true;
  });
  return NextResponse.json({ received: true, changed });
}
