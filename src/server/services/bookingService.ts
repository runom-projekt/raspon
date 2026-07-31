import "server-only";
import { prisma } from "@/lib/prisma";
import { generateBookingCode, nightsBetween } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { calculateBookingPrice } from "@/server/domain/bookingPrice";
import { bookingExpiresAt } from "@/server/domain/bookingExpiry";

export class BookingConflictError extends Error {}
export class BookingNotFoundError extends Error {}

export async function lockTrailerSchedule(
  tx: Prisma.TransactionClient,
  trailerId: string
): Promise<void> {
  // Wszystkie zapisy kalendarza tej samej przyczepy muszą używać tej blokady.
  // Blokada jest transakcyjna i automatycznie zwalnia się po commit/rollback.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${trailerId}, 0))`;
}

export async function createBooking({
  trailerId,
  renterId,
  startDate,
  endDate,
  discountCode,
}: {
  trailerId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
  discountCode?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await lockTrailerSchedule(tx, trailerId);

    const trailer = await tx.trailer.findUnique({ where: { id: trailerId } });
    if (!trailer || trailer.status !== "PUBLISHED") {
      throw new BookingNotFoundError("Der Anhänger ist nicht verfügbar");
    }

    const now = new Date();
    const overlapping = await tx.booking.findFirst({
      where: {
        trailerId,
        OR: [
          { status: { in: ["CONFIRMED", "ACTIVE"] } },
          { status: "PENDING", expiresAt: { gt: now } },
        ],
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
    if (overlapping) {
      throw new BookingConflictError("Der Anhänger ist im gewählten Zeitraum bereits gebucht");
    }

    const blocked = await tx.blockedDate.findFirst({
      where: {
        trailerId,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
    if (blocked) {
      throw new BookingConflictError("Der Vermieter hat diesen Termin blockiert");
    }

    const days = nightsBetween(startDate, endDate);
    const pricePerUnit = trailer.pricePerDay;

    let discount: { id: string } | null = null;
    let percentOff: number | null = null;
    let amountOff: Prisma.Decimal | null = null;
    if (discountCode) {
      const code = await tx.discountCode.findUnique({ where: { code: discountCode } });
      if (code && code.active && code.validFrom <= now && code.validTo >= now) {
        const reserved = await tx.discountCode.updateMany({
          where: {
            id: code.id,
            active: true,
            validFrom: { lte: now },
            validTo: { gte: now },
            usedCount: code.maxUses === null ? undefined : { lt: code.maxUses },
          },
          data: { usedCount: { increment: 1 } },
        });
        if (reserved.count === 1) {
          discount = { id: code.id };
          percentOff = code.percentOff;
          amountOff = code.amountOff;
        }
      }
    }

    const { subtotal, commissionAmt, totalAmount } = calculateBookingPrice({
      pricePerDay: pricePerUnit,
      days,
      depositAmount: trailer.depositAmount,
      commissionPct: trailer.commissionPct,
      percentOff,
      amountOff,
    });

    const createdAt = new Date();
    const booking = await tx.booking.create({
      data: {
        code: generateBookingCode(),
        trailerId,
        renterId,
        startDate,
        endDate,
        pricePerUnit,
        subtotal,
        commissionAmt,
        depositAmount: trailer.depositAmount,
        discountCodeId: discount?.id,
        totalAmount,
        currency: trailer.currency,
        status: "PENDING",
        createdAt,
        expiresAt: bookingExpiresAt(createdAt),
      },
    });

    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        currency: trailer.currency,
        status: "REQUIRES_PAYMENT",
      },
    });

    const notificationBody = `Ihre Buchung für den Anhänger "${trailer.title}" (Code ${booking.code}) wartet auf die Zahlung.`;
    await tx.notification.createMany({ data: [
      { userId: renterId, channel: "IN_APP", title: "Buchung erstellt", body: notificationBody },
      { userId: renterId, channel: "EMAIL", title: "Buchung erstellt", body: notificationBody },
    ] });

    return booking;
  });
}
