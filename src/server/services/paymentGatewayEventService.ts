import "server-only";
import { prisma } from "@/lib/prisma";
import { decidePaymentCompletion } from "@/server/domain/paymentCompletion";
import { appendAuditLog } from "@/server/services/auditService";
import { lockTrailerSchedule } from "@/server/services/bookingService";

export interface PaymentGatewayEvent {
  eventId: string;
  event: "PAYMENT_COMPLETED" | "PAYMENT_FAILED";
  paymentId: string;
  providerOrderId: string;
  amountMinor: number;
  currency: string;
}

export class PaymentGatewayEventError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "PAYMENT_MISMATCH" | "PROVIDER_ORDER_MISMATCH") {
    super(code);
  }
}

export async function processPaymentGatewayEvent({ event, payloadHash, requestId }: { event: PaymentGatewayEvent; payloadHash: string; requestId: string | null }) {
  const initial = await prisma.payment.findUnique({ where: { id: event.paymentId }, include: { booking: true } });
  if (!initial) throw new PaymentGatewayEventError("NOT_FOUND");
  if (initial.amount.mul(100).toDecimalPlaces(0).toNumber() !== event.amountMinor || initial.currency.toUpperCase() !== event.currency.toUpperCase()) {
    throw new PaymentGatewayEventError("PAYMENT_MISMATCH");
  }
  if (initial.providerPaymentId && initial.providerPaymentId !== event.providerOrderId) {
    throw new PaymentGatewayEventError("PROVIDER_ORDER_MISMATCH");
  }

  const eventType = `HMS_${event.event}_${event.eventId}`;
  let confirmed = false;
  await prisma.$transaction(async (tx) => {
    await lockTrailerSchedule(tx, initial.booking.trailerId);
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: initial.id }, include: { booking: { include: { trailer: true } } } });
    if (payment.amount.mul(100).toDecimalPlaces(0).toNumber() !== event.amountMinor || payment.currency.toUpperCase() !== event.currency.toUpperCase()) {
      throw new PaymentGatewayEventError("PAYMENT_MISMATCH");
    }
    if (payment.providerPaymentId && payment.providerPaymentId !== event.providerOrderId) {
      throw new PaymentGatewayEventError("PROVIDER_ORDER_MISMATCH");
    }
    const claimed = await tx.paymentWebhookEvent.createMany({
      data: [{ provider: "REVOLUT", eventType, providerOrderId: event.providerOrderId, payloadHash }],
      skipDuplicates: true,
    });
    if (claimed.count === 0) return;

    let outcome = "NO_STATE_CHANGE";
    if (event.event === "PAYMENT_COMPLETED") {
      const action = decidePaymentCompletion(payment.booking.status, payment.status);
      if (payment.status !== "REFUNDED") {
        await tx.payment.updateMany({
          where: { id: payment.id, status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED", "FAILED", "PAID"] } },
          data: { status: "PAID", providerPaymentId: event.providerOrderId },
        });
      }
      if (action === "CONFIRM_BOOKING") {
        const changed = await tx.booking.updateMany({ where: { id: payment.bookingId, status: "PENDING" }, data: { status: "CONFIRMED" } });
        confirmed = changed.count === 1;
        outcome = confirmed ? "PAYMENT_CONFIRMED" : "NO_STATE_CHANGE";
        if (confirmed) {
          const body = `Die Zahlung für Buchung ${payment.booking.code} ist eingegangen.`;
          await tx.notification.createMany({ data: [
            { userId: payment.booking.renterId, channel: "IN_APP", title: "Buchung bestätigt", body },
            { userId: payment.booking.trailer.ownerId, channel: "IN_APP", title: "Zahlung eingegangen", body },
            { userId: payment.booking.renterId, channel: "SMS", title: "Buchung bestätigt", body },
            { userId: payment.booking.trailer.ownerId, channel: "SMS", title: "Zahlung eingegangen", body },
          ] });
          await appendAuditLog(tx, {
            actor: { sub: "SYSTEM", email: null, role: "ADMIN" }, requestId,
            action: "PAYMENT_CONFIRMED", entityType: "Booking", entityId: payment.bookingId,
            changes: { paymentId: payment.id, providerOrderId: event.providerOrderId },
          });
        }
      } else if (action === "QUEUE_REFUND" && payment.status !== "REFUNDED") {
        const existing = await tx.paymentReversal.findUnique({ where: { bookingId: payment.bookingId } });
        if (!existing || existing.status !== "COMPLETED" || existing.type !== "FULL_REFUND") {
          const reversal = existing
            ? await tx.paymentReversal.update({ where: { id: existing.id }, data: {
                type: "FULL_REFUND", status: "QUEUED", amount: payment.amount, currency: payment.currency,
                providerOperationId: null, processingStartedAt: null, completedAt: null, lastError: null, nextAttemptAt: new Date(),
              } })
            : await tx.paymentReversal.create({ data: {
                bookingId: payment.bookingId, paymentId: payment.id, requestedById: payment.booking.renterId,
                type: "FULL_REFUND", amount: payment.amount, currency: payment.currency,
                reason: "Automatic refund for payment received after booking closure",
              } });
          await tx.notification.createMany({ data: [
            { userId: payment.booking.renterId, channel: "IN_APP", title: "Rückzahlung eingeleitet", body: `Die Zahlung für Buchung ${payment.booking.code} ging nach deren Schließung ein und wird automatisch vollständig zurückgezahlt.` },
            { userId: payment.booking.renterId, channel: "EMAIL", title: "Rückzahlung eingeleitet", body: `Die Zahlung für Buchung ${payment.booking.code} ging nach deren Schließung ein und wird automatisch vollständig zurückgezahlt.` },
          ] });
          await appendAuditLog(tx, {
            actor: { sub: "SYSTEM", email: null, role: "ADMIN" }, requestId,
            action: "LATE_PAYMENT_REFUND_QUEUED", entityType: "PaymentReversal", entityId: reversal.id,
            changes: { bookingStatus: payment.booking.status, paymentId: payment.id, providerOrderId: event.providerOrderId },
          });
          outcome = "LATE_PAYMENT_REFUND_QUEUED";
        } else outcome = "REFUND_ALREADY_COMPLETED";
      } else outcome = payment.status === "REFUNDED" ? "REFUND_ALREADY_COMPLETED" : "PAYMENT_ALREADY_ACCEPTED";
    } else {
      await tx.payment.updateMany({
        where: { id: payment.id, status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED"] } },
        data: { status: "FAILED", providerPaymentId: event.providerOrderId },
      });
      outcome = "PAYMENT_FAILED";
    }
    await tx.paymentWebhookEvent.update({
      where: { provider_eventType_providerOrderId: { provider: "REVOLUT", eventType, providerOrderId: event.providerOrderId } },
      data: { processedAt: new Date(), outcome },
    });
  });
  return { confirmed, bookingId: initial.bookingId };
}
