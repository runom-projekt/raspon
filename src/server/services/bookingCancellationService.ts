import "server-only";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decideRenterCancellation } from "@/server/domain/bookingCancellation";
import { appendAuditLog } from "@/server/services/auditService";
import { lockTrailerSchedule } from "@/server/services/bookingService";
import { computeRefundRiskScore, getRunomConfig, getRunomTask, requestRefundApproval, RunomRequestError } from "@/lib/runom";
import type { Prisma, PaymentReversal } from "@prisma/client";

export class BookingCancellationError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

const SYSTEM_ACTOR: SessionPayload = { sub: "SYSTEM", email: null, role: "ADMIN" };

/** Domyślny próg (EUR), poniżej połowy którego RUNOM auto-akceptuje refund bez udziału administratora. Nadpisywalny przez RUNOM_REFUND_AUTO_APPROVE_MAX_EUR. */
const DEFAULT_AUTO_APPROVE_MAX_EUR = 200;

export type CancellationOutcome =
  | { outcome: "cancelled"; reversal: PaymentReversal | null }
  | { outcome: "pending_review"; taskId: string };

/**
 * Wykonuje faktyczne anulowanie (transakcja: status -> CANCELLED, ewentualny
 * PaymentReversal, powiadomienia, audit log). Reużywane zarówno przy
 * natychmiastowym anulowaniu (brak refundu lub RUNOM auto-akceptował), jak i
 * przy finalizacji po zatwierdzeniu administratora (finalizeApprovedCancellation).
 * `reversalType`/`reversalAmount` = null oznacza brak refundu (decision.reversal === "NONE").
 */
async function applyCancellation({
  bookingId,
  expectedStatus,
  actor,
  reason,
  requestId,
  reversalType,
  now,
}: {
  bookingId: string;
  expectedStatus: string;
  actor: SessionPayload;
  reason: string | null;
  requestId: string | null;
  reversalType: "NONE" | "CANCEL_ORDER" | "FULL_REFUND";
  now: Date;
}): Promise<PaymentReversal | null> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { payment: true, trailer: true, paymentReversal: true } });
    if (!booking) throw new BookingCancellationError("NOT_FOUND");
    if (!booking.payment) throw new BookingCancellationError("PAYMENT_INCONSISTENT");
    if (booking.paymentReversal) return booking.paymentReversal;
    if (booking.status !== expectedStatus) throw new BookingCancellationError("CONCURRENT_CHANGE");

    await lockTrailerSchedule(tx, booking.trailerId);
    const current = await tx.booking.findUnique({ where: { id: booking.id }, include: { paymentReversal: true } });
    if (!current) throw new BookingCancellationError("NOT_FOUND");
    if (current.paymentReversal) return current.paymentReversal;
    if (current.status !== expectedStatus) throw new BookingCancellationError("CONCURRENT_CHANGE");

    const changed = await tx.booking.updateMany({
      where: { id: booking.id, status: expectedStatus },
      data: { status: "CANCELLED", cancelledAt: now, pendingCancellationTaskId: null },
    });
    if (changed.count !== 1) throw new BookingCancellationError("CONCURRENT_CHANGE");

    if (booking.discountCodeId && booking.status === "PENDING") {
      await tx.discountCode.updateMany({ where: { id: booking.discountCodeId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    }
    if (reversalType === "NONE") {
      await tx.payment.updateMany({ where: { id: booking.payment.id, status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED"] } }, data: { status: "FAILED" } });
    }

    const reversal = reversalType === "NONE" ? null : await tx.paymentReversal.create({
      data: {
        bookingId: booking.id,
        paymentId: booking.payment.id,
        requestedById: actor.sub,
        type: reversalType,
        amount: reversalType === "FULL_REFUND" ? booking.payment.amount : 0,
        currency: booking.payment.currency,
        reason,
      },
    });

    const refundText = reversalType === "FULL_REFUND" ? " Die vollständige Rückzahlung wurde automatisch beauftragt." : "";
    await tx.notification.createMany({
      data: [
        { userId: booking.renterId, channel: "IN_APP", title: "Buchung storniert", body: `Buchung ${booking.code} wurde storniert.${refundText}` },
        { userId: booking.renterId, channel: "EMAIL", title: "Buchung storniert", body: `Buchung ${booking.code} wurde storniert.${refundText}` },
        { userId: booking.trailer.ownerId, channel: "IN_APP", title: "Buchung storniert", body: `Buchung ${booking.code} wurde vom Mieter storniert. Der Termin ist wieder frei.` },
      ],
    });
    await appendAuditLog(tx, {
      actor,
      requestId,
      action: "BOOKING_CANCELLED_BY_RENTER",
      entityType: "Booking",
      entityId: booking.id,
      changes: { status: { from: expectedStatus, to: "CANCELLED" }, reversal: reversalType, reversalId: reversal?.id ?? null },
    });
    return reversal;
  });
}

export async function cancelBookingByRenter({
  bookingId,
  actor,
  reason,
  requestId,
  now = new Date(),
}: {
  bookingId: string;
  actor: SessionPayload;
  reason?: string;
  requestId: string | null;
  now?: Date;
}): Promise<CancellationOutcome> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true, paymentReversal: true } });
  if (!booking) throw new BookingCancellationError("NOT_FOUND");
  if (booking.renterId !== actor.sub && actor.role !== "ADMIN") throw new BookingCancellationError("FORBIDDEN");
  if (!booking.payment) throw new BookingCancellationError("PAYMENT_INCONSISTENT");
  if (booking.paymentReversal) return { outcome: "cancelled", reversal: booking.paymentReversal };
  if (booking.pendingCancellationTaskId) return { outcome: "pending_review", taskId: booking.pendingCancellationTaskId };

  const decision = decideRenterCancellation({
    bookingStatus: booking.status,
    paymentStatus: booking.payment.status,
    hasProviderOrder: Boolean(booking.payment.providerPaymentId),
    startDate: booking.startDate,
    now,
  });
  if (!decision.allowed) throw new BookingCancellationError(decision.reason);

  // RUNOM (docs/adr/0003-runom-refund-approval.md): WYŁĄCZNIE ścieżka
  // "opłacona rezerwacja, pełny refund" przechodzi przez ocenę ryzyka —
  // anulowanie nieopłaconej rezerwacji (NONE/CANCEL_ORDER) działa dokładnie
  // jak dotąd, bez zmian. Świadoma decyzja: bez skonfigurowanego RUNOM ta
  // ścieżka jest ZABLOKOWANA (fail closed), nie cicho dozwolona bez oceny —
  // zgodnie z pierwotnym zapisem ADR-0001 ("Anulowanie potwierdzonej
  // rezerwacji pozostaje zablokowane do czasu zatwierdzenia polityki
  // refundów"), którego poprzednia wersja tego kodu w praktyce nie
  // przestrzegała (auto-refund bez żadnej bramki).
  if (decision.reversal === "FULL_REFUND") {
    const config = getRunomConfig();
    if (!config) throw new BookingCancellationError("REFUND_REVIEW_NOT_CONFIGURED");

    const amountEur = booking.payment.amount.toNumber();
    const autoApproveMaxEur = Number(process.env.RUNOM_REFUND_AUTO_APPROVE_MAX_EUR ?? DEFAULT_AUTO_APPROVE_MAX_EUR);
    const riskScore = computeRefundRiskScore(amountEur, Number.isFinite(autoApproveMaxEur) && autoApproveMaxEur > 0 ? autoApproveMaxEur : DEFAULT_AUTO_APPROVE_MAX_EUR);

    let task;
    try {
      task = await requestRefundApproval(config, {
        bookingId: booking.id,
        bookingCode: booking.code,
        amountEur,
        currency: booking.payment.currency,
        riskScore,
        reason: reason ?? null,
      });
    } catch (error) {
      // Fail closed: niedostępność RUNOM NIGDY nie staje się cichym
      // ominięciem oceny ryzyka. Administrator musi rozwiązać problem
      // dostępności, zanim refund będzie mógł zostać przetworzony.
      const message = error instanceof RunomRequestError ? error.message : "RUNOM unavailable";
      throw new BookingCancellationError(`REFUND_REVIEW_UNAVAILABLE: ${message}`);
    }

    if (task.status === "awaiting_approval") {
      await prisma.$transaction(async (tx) => {
        const current = await tx.booking.findUnique({ where: { id: booking.id }, include: { paymentReversal: true } });
        if (!current) throw new BookingCancellationError("NOT_FOUND");
        if (current.paymentReversal || current.pendingCancellationTaskId) return;
        if (current.status !== booking.status) throw new BookingCancellationError("CONCURRENT_CHANGE");
        await tx.booking.update({ where: { id: booking.id }, data: { pendingCancellationTaskId: task.id } });
        await appendAuditLog(tx, {
          actor,
          requestId,
          action: "BOOKING_CANCELLATION_AWAITING_APPROVAL",
          entityType: "Booking",
          entityId: booking.id,
          changes: { runomTaskId: task.id, amountEur, riskScore },
        });
      });
      return { outcome: "pending_review", taskId: task.id };
    }
    // task.status === "in_progress" -> RUNOM auto-zatwierdził (riskScore poniżej progu).
  }

  const reversal = await applyCancellation({
    bookingId: booking.id,
    expectedStatus: booking.status,
    actor,
    reason: reason ?? null,
    requestId,
    reversalType: decision.reversal,
    now,
  });
  return { outcome: "cancelled", reversal };
}

export type FinalizeOutcome = "cancelled" | "declined" | "still_pending" | "not_pending";

/**
 * Woła RUNOM o aktualny stan zadania zatwierdzenia i finalizuje sprawę:
 * `in_progress` (administrator zatwierdził, task.task.resumed.v1 po stronie
 * RUNOM) -> wykonuje anulowanie + refund; `failed` (odrzucone) -> czyści
 * oczekiwanie, rezerwacja ZOSTAJE CONFIRMED, renter dostaje powiadomienie o
 * odmowie; `awaiting_approval` -> brak zmian (nadal czeka). Wołane przez
 * worker uzgadniający (src/app/api/internal/runom-reconcile).
 */
export async function finalizeApprovedCancellation(bookingId: string, now = new Date()): Promise<FinalizeOutcome> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking?.pendingCancellationTaskId) return "not_pending";

  const config = getRunomConfig();
  if (!config) return "still_pending";

  const task = await getRunomTask(config, booking.pendingCancellationTaskId);

  if (task.status === "awaiting_approval") return "still_pending";

  if (task.status === "in_progress") {
    await applyCancellation({
      bookingId: booking.id,
      expectedStatus: booking.status,
      actor: SYSTEM_ACTOR,
      reason: "RUNOM approval granted",
      requestId: null,
      reversalType: "FULL_REFUND",
      now,
    });
    return "cancelled";
  }

  if (task.status === "failed") {
    await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({ where: { id: booking.id } });
      if (!current || current.pendingCancellationTaskId !== booking.pendingCancellationTaskId) return;
      await tx.booking.update({ where: { id: booking.id }, data: { pendingCancellationTaskId: null } });
      await tx.notification.createMany({
        data: [
          { userId: current.renterId, channel: "IN_APP", title: "Stornierung abgelehnt", body: `Die Stornierung von Buchung ${current.code} wurde nach Prüfung abgelehnt. Die Buchung bleibt bestehen.` },
          { userId: current.renterId, channel: "EMAIL", title: "Stornierung abgelehnt", body: `Die Stornierung von Buchung ${current.code} wurde nach Prüfung abgelehnt. Die Buchung bleibt bestehen.` },
        ],
      });
      await appendAuditLog(tx, {
        actor: SYSTEM_ACTOR,
        requestId: null,
        action: "BOOKING_CANCELLATION_DECLINED",
        entityType: "Booking",
        entityId: current.id,
        changes: { runomTaskId: booking.pendingCancellationTaskId },
      });
    });
    return "declined";
  }

  return "still_pending";
}
