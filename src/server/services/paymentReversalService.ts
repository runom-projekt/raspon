import "server-only";
import { prisma } from "@/lib/prisma";
import { submitGatewayReversal } from "@/lib/paymentGateway";
import { getReversalRetryDelayMs } from "@/server/domain/bookingCancellation";
import { appendAuditLog } from "@/server/services/auditService";

const MAX_ATTEMPTS = 8;
const STALE_SUBMISSION_MS = 5 * 60 * 1000;

export async function processPaymentReversal(reversalId: string, now = new Date()): Promise<"submitted" | "completed" | "retry" | "skipped"> {
  const staleBefore = new Date(now.getTime() - STALE_SUBMISSION_MS);
  const claimed = await prisma.paymentReversal.updateMany({
    where: {
      id: reversalId,
      attempts: { lt: MAX_ATTEMPTS },
      nextAttemptAt: { lte: now },
      OR: [{ status: "QUEUED" }, { status: "SUBMITTING", processingStartedAt: { lte: staleBefore } }],
    },
    data: { status: "SUBMITTING", processingStartedAt: now, attempts: { increment: 1 }, lastError: null },
  });
  if (claimed.count !== 1) return "skipped";
  const reversal = await prisma.paymentReversal.findUniqueOrThrow({ where: { id: reversalId }, include: { payment: true } });
  if (!reversal.payment.providerPaymentId) {
    await prisma.paymentReversal.update({ where: { id: reversal.id }, data: { status: "FAILED", lastError: "Missing provider order ID" } });
    return "skipped";
  }
  try {
    const result = await submitGatewayReversal({
      reversalId: reversal.id,
      type: reversal.type,
      providerOrderId: reversal.payment.providerPaymentId,
      amountMinor: reversal.amount.mul(100).toDecimalPlaces(0).toNumber(),
      currency: reversal.currency.toUpperCase(),
    });
    const completed = result.state === "COMPLETED";
    const applied = await prisma.$transaction(async (tx) => {
      const currentApplied = await tx.paymentReversal.updateMany({
        where: {
          id: reversal.id,
          status: "SUBMITTING",
          processingStartedAt: now,
          type: reversal.type,
        },
        data: { status: completed ? "COMPLETED" : "SUBMITTED", providerOperationId: result.providerOperationId, completedAt: completed ? now : null, processingStartedAt: null },
      });
      if (currentApplied.count !== 1) return false;
      if (completed && reversal.type === "CANCEL_ORDER") {
        await tx.payment.updateMany({ where: { id: reversal.paymentId, status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED"] } }, data: { status: "FAILED" } });
      } else if (completed && reversal.type === "FULL_REFUND") {
        await tx.payment.update({ where: { id: reversal.paymentId }, data: { status: "REFUNDED", refundedAmount: reversal.amount, depositHeld: false } });
        const booking = await tx.booking.findUniqueOrThrow({ where: { id: reversal.bookingId } });
        await tx.notification.createMany({ data: [
          { userId: booking.renterId, channel: "IN_APP", title: "Rückzahlung abgeschlossen", body: `Die Rückzahlung für Buchung ${booking.code} wurde abgeschlossen.` },
          { userId: booking.renterId, channel: "EMAIL", title: "Rückzahlung abgeschlossen", body: `Die Rückzahlung für Buchung ${booking.code} wurde abgeschlossen.` },
        ] });
      }
      await appendAuditLog(tx, {
        actor: { sub: "SYSTEM", email: null, role: "ADMIN" }, requestId: null,
        action: completed ? "PAYMENT_REVERSAL_COMPLETED" : "PAYMENT_REVERSAL_SUBMITTED",
        entityType: "PaymentReversal", entityId: reversal.id,
        changes: { type: reversal.type, providerOperationId: result.providerOperationId },
      });
      return true;
    });
    if (!applied) return "skipped";
    return completed ? "completed" : "submitted";
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown gateway error";
    const finalAttempt = reversal.attempts >= MAX_ATTEMPTS;
    await prisma.paymentReversal.updateMany({
      where: { id: reversal.id, status: "SUBMITTING", processingStartedAt: now, type: reversal.type },
      data: { status: finalAttempt ? "FAILED" : "QUEUED", processingStartedAt: null, lastError: message, nextAttemptAt: new Date(now.getTime() + getReversalRetryDelayMs(reversal.attempts)) },
    });
    return "retry";
  }
}

export async function processPaymentReversalBatch(batchSize = 50, now = new Date()) {
  const staleBefore = new Date(now.getTime() - STALE_SUBMISSION_MS);
  const candidates = await prisma.paymentReversal.findMany({
    where: { attempts: { lt: MAX_ATTEMPTS }, nextAttemptAt: { lte: now }, OR: [{ status: "QUEUED" }, { status: "SUBMITTING", processingStartedAt: { lte: staleBefore } }] },
    orderBy: { nextAttemptAt: "asc" }, take: batchSize, select: { id: true },
  });
  const totals = { scanned: candidates.length, submitted: 0, completed: 0, retry: 0 };
  for (const candidate of candidates) {
    const result = await processPaymentReversal(candidate.id, now);
    if (result !== "skipped") totals[result] += 1;
  }
  return totals;
}
