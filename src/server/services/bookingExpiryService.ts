import "server-only";
import { prisma } from "@/lib/prisma";
import { lockTrailerSchedule } from "@/server/services/bookingService";
import { appendAuditLog } from "@/server/services/auditService";

export async function expirePendingBooking(
  bookingId: string,
  now = new Date()
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (
      !candidate ||
      candidate.status !== "PENDING" ||
      candidate.expiresAt > now ||
      candidate.payment?.providerPaymentId
    ) {
      return false;
    }

    await lockTrailerSchedule(tx, candidate.trailerId);
    const expired = await tx.booking.updateMany({
      where: {
        id: candidate.id,
        status: "PENDING",
        expiresAt: { lte: now },
        payment: { providerPaymentId: null },
      },
      data: { status: "CANCELLED", cancelledAt: now },
    });
    if (expired.count !== 1) return false;

    await tx.payment.updateMany({
      where: {
        bookingId: candidate.id,
        status: { in: ["REQUIRES_PAYMENT", "AUTHORIZED"] },
      },
      data: { status: "FAILED" },
    });
    if (candidate.discountCodeId) {
      await tx.discountCode.updateMany({
        where: { id: candidate.discountCodeId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    await tx.notification.createMany({
      data: [
        {
          userId: candidate.renterId,
          channel: "IN_APP",
          title: "Buchung abgelaufen",
          body: `Die Zahlungsfrist für Buchung ${candidate.code} ist abgelaufen. Der Termin wurde wieder freigegeben.`,
        },
        {
          userId: candidate.renterId,
          channel: "EMAIL",
          title: "Buchung abgelaufen",
          body: `Die Zahlungsfrist für Buchung ${candidate.code} ist abgelaufen. Der Termin wurde wieder freigegeben.`,
        },
      ],
    });
    await appendAuditLog(tx, {
      actor: { sub: "SYSTEM", email: null, role: "ADMIN" },
      requestId: null,
      action: "BOOKING_PAYMENT_EXPIRED",
      entityType: "Booking",
      entityId: candidate.id,
      changes: { status: { from: "PENDING", to: "CANCELLED" } },
    });
    return true;
  });
}

export async function expirePendingBookings(batchSize = 100, now = new Date()) {
  const candidates = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: now },
      payment: { providerPaymentId: null },
    },
    orderBy: { expiresAt: "asc" },
    take: batchSize,
    select: { id: true },
  });

  let expired = 0;
  for (const candidate of candidates) {
    if (await expirePendingBooking(candidate.id, now)) expired += 1;
  }
  return { scanned: candidates.length, expired };
}
