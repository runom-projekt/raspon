import "server-only";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decideRenterCancellation } from "@/server/domain/bookingCancellation";
import { appendAuditLog } from "@/server/services/auditService";
import { lockTrailerSchedule } from "@/server/services/bookingService";

export class BookingCancellationError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
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
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, trailer: true, paymentReversal: true },
    });
    if (!booking) throw new BookingCancellationError("NOT_FOUND");
    if (booking.renterId !== actor.sub && actor.role !== "ADMIN") {
      throw new BookingCancellationError("FORBIDDEN");
    }
    if (!booking.payment) throw new BookingCancellationError("PAYMENT_INCONSISTENT");
    if (booking.paymentReversal) return booking.paymentReversal;

    const decision = decideRenterCancellation({
      bookingStatus: booking.status,
      paymentStatus: booking.payment.status,
      hasProviderOrder: Boolean(booking.payment.providerPaymentId),
      startDate: booking.startDate,
      now,
    });
    if (!decision.allowed) throw new BookingCancellationError(decision.reason);

    await lockTrailerSchedule(tx, booking.trailerId);
    const current = await tx.booking.findUnique({
      where: { id: booking.id },
      include: { paymentReversal: true },
    });
    if (!current) throw new BookingCancellationError("NOT_FOUND");
    if (current.paymentReversal) return current.paymentReversal;
    if (current.status !== booking.status) {
      throw new BookingCancellationError("CONCURRENT_CHANGE");
    }

    const changed = await tx.booking.updateMany({
      where: { id: booking.id, status: booking.status },
      data: { status: "CANCELLED", cancelledAt: now },
    });
    if (changed.count !== 1) throw new BookingCancellationError("CONCURRENT_CHANGE");

    if (booking.discountCodeId && booking.status === "PENDING") {
      await tx.discountCode.updateMany({
        where: { id: booking.discountCodeId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
    if (decision.reversal === "NONE") {
      await tx.payment.updateMany({
        where: { id: booking.payment.id, status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED"] } },
        data: { status: "FAILED" },
      });
    }

    const reversal = decision.reversal === "NONE" ? null : await tx.paymentReversal.create({
      data: {
        bookingId: booking.id,
        paymentId: booking.payment.id,
        requestedById: actor.sub,
        type: decision.reversal,
        amount: decision.reversal === "FULL_REFUND" ? booking.payment.amount : 0,
        currency: booking.payment.currency,
        reason,
      },
    });

    const refundText = decision.reversal === "FULL_REFUND"
      ? " Die vollstÃ¤ndige RÃ¼ckzahlung wurde automatisch beauftragt."
      : "";
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
      changes: {
        status: { from: booking.status, to: "CANCELLED" },
        reversal: decision.reversal,
        reversalId: reversal?.id ?? null,
      },
    });
    return reversal;
  });
}
