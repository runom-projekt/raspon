import "server-only";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/server/services/auditService";

export class ReviewError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "FORBIDDEN" | "BOOKING_NOT_COMPLETED" | "PAYMENT_REQUIRED" | "ALREADY_REVIEWED") {
    super(code);
  }
}

export async function createBookingReview({
  bookingId,
  rating,
  comment,
  actor,
  requestId,
}: {
  bookingId: string;
  rating: number;
  comment?: string;
  actor: SessionPayload;
  requestId: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const initial = await tx.booking.findUnique({ where: { id: bookingId }, include: { payment: true, trailer: true } });
    if (!initial) throw new ReviewError("NOT_FOUND");
    if (initial.renterId !== actor.sub) throw new ReviewError("FORBIDDEN");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`review:${initial.trailerId}`}))`;
    const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { payment: true, review: true, trailer: true } });
    if (booking.status !== "COMPLETED") throw new ReviewError("BOOKING_NOT_COMPLETED");
    if (booking.payment?.status !== "PAID") throw new ReviewError("PAYMENT_REQUIRED");
    if (booking.review) throw new ReviewError("ALREADY_REVIEWED");

    const review = await tx.review.create({
      data: { trailerId: booking.trailerId, authorId: actor.sub, bookingId, rating, comment },
    });
    const aggregate = await tx.review.aggregate({
      where: { trailerId: booking.trailerId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.trailer.update({
      where: { id: booking.trailerId },
      data: { averageRating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count.rating },
    });
    await tx.notification.create({
      data: {
        userId: booking.trailer.ownerId,
        channel: "IN_APP",
        title: "Neue Bewertung",
        body: `Für „${booking.trailer.title}“ wurde eine Bewertung mit ${rating} von 5 Sternen abgegeben.`,
      },
    });
    await appendAuditLog(tx, {
      actor,
      requestId,
      action: "REVIEW_CREATED",
      entityType: "Review",
      entityId: review.id,
      changes: { bookingId, trailerId: booking.trailerId, rating },
    });
    return review;
  });
}
