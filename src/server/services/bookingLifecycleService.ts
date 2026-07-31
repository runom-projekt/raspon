import "server-only";
import type { BookingStatus } from "@prisma/client";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  decideBookingLifecycleTransition,
  type BookingActor,
} from "@/server/domain/bookingStatus";
import { appendAuditLog } from "@/server/services/auditService";
import { lockTrailerSchedule } from "@/server/services/bookingService";

export class BookingLifecycleError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export async function transitionBookingLifecycle({
  bookingId,
  targetStatus,
  actor,
  requestId,
  now = new Date(),
}: {
  bookingId: string;
  targetStatus: "DECLINED" | "ACTIVE" | "COMPLETED";
  actor: SessionPayload;
  requestId: string | null;
  now?: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const initial = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { trailer: true, payment: true },
    });
    if (!initial) throw new BookingLifecycleError("NOT_FOUND");

    const isOwner = initial.trailer.ownerId === actor.sub;
    const isRenter = initial.renterId === actor.sub;
    const lifecycleActor: BookingActor | null =
      actor.role === "ADMIN" ? "ADMIN" : isOwner ? "OWNER" : isRenter ? "RENTER" : null;
    if (!lifecycleActor) throw new BookingLifecycleError("FORBIDDEN");
    if (!initial.payment) throw new BookingLifecycleError("PAYMENT_INCONSISTENT");

    await lockTrailerSchedule(tx, initial.trailerId);
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { trailer: true, payment: true },
    });
    if (!booking || !booking.payment) throw new BookingLifecycleError("CONCURRENT_CHANGE");

    const decision = decideBookingLifecycleTransition({
      from: booking.status,
      to: targetStatus,
      actor: lifecycleActor,
      paymentStatus: booking.payment.status,
      hasProviderOrder: Boolean(booking.payment.providerPaymentId),
      startDate: booking.startDate,
      endDate: booking.endDate,
      now,
    });
    if (!decision.allowed) throw new BookingLifecycleError(decision.reason);

    const changed = await tx.booking.updateMany({
      where: { id: booking.id, status: booking.status },
      data: { status: targetStatus },
    });
    if (changed.count !== 1) throw new BookingLifecycleError("CONCURRENT_CHANGE");

    if (targetStatus === "DECLINED") {
      await tx.payment.updateMany({
        where: { id: booking.payment.id, status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED"] } },
        data: { status: "FAILED" },
      });
      if (booking.discountCodeId) {
        await tx.discountCode.updateMany({
          where: { id: booking.discountCodeId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }
    }

    const statusText: Record<typeof targetStatus, string> = {
      DECLINED: "abgelehnt",
      ACTIVE: "als abgeholt markiert",
      COMPLETED: "als zurückgegeben markiert",
    };
    await tx.notification.createMany({
      data: [
        {
          userId: booking.renterId,
          channel: "IN_APP",
          title: "Buchungsstatus aktualisiert",
          body: `Buchung ${booking.code} wurde ${statusText[targetStatus]}.`,
        },
        {
          userId: booking.renterId,
          channel: "EMAIL",
          title: "Buchungsstatus aktualisiert",
          body: `Buchung ${booking.code} wurde ${statusText[targetStatus]}.`,
        },
      ],
    });
    await appendAuditLog(tx, {
      actor,
      requestId,
      action: "BOOKING_STATUS_CHANGED",
      entityType: "Booking",
      entityId: booking.id,
      changes: { status: { from: booking.status, to: targetStatus } },
    });

    return tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
  });
}
