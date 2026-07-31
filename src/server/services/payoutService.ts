import "server-only";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/server/services/auditService";

export async function accrueCompletedBookingPayouts(batchSize = 100) {
  const candidates = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      payment: { status: "PAID" },
      trailer: { owner: { isIdVerified: true, status: "ACTIVE" } },
      payout: null,
    },
    select: {
      id: true,
      code: true,
      startDate: true,
      endDate: true,
      subtotal: true,
      commissionAmt: true,
      currency: true,
      trailer: { select: { owner: { select: { id: true, email: true } } } },
    },
    orderBy: { endDate: "asc" },
    take: Math.max(1, Math.min(batchSize, 500)),
  });

  let accrued = 0;
  for (const candidate of candidates) {
    const created = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`payout-booking:${candidate.id}`}))`;
      const booking = await tx.booking.findFirst({
        where: {
          id: candidate.id,
          status: "COMPLETED",
          payment: { status: "PAID" },
          trailer: { owner: { isIdVerified: true, status: "ACTIVE" } },
          payout: null,
        },
        select: { id: true },
      });
      if (!booking) return false;

      const amount = candidate.subtotal.minus(candidate.commissionAmt);
      if (amount.lte(0)) return false;
      const payout = await tx.payout.create({
        data: {
          bookingId: candidate.id,
          ownerId: candidate.trailer.owner.id,
          amount,
          currency: candidate.currency,
          periodFrom: candidate.startDate,
          periodTo: candidate.endDate,
        },
      });
      await appendAuditLog(tx, {
        actor: {
          sub: candidate.trailer.owner.id,
          email: candidate.trailer.owner.email ?? "system@raspon.de",
          role: "OWNER",
        },
        requestId: null,
        action: "PAYOUT_AUTOMATICALLY_ACCRUED",
        entityType: "Payout",
        entityId: payout.id,
        changes: { bookingId: candidate.id, bookingCode: candidate.code, amount: amount.toString(), currency: candidate.currency },
      });
      await tx.notification.create({
        data: {
          userId: candidate.trailer.owner.id,
          channel: "IN_APP",
          title: "Auszahlung vorgemerkt",
          body: `Die Auszahlung für Buchung ${candidate.code} in Höhe von ${amount.toFixed(2)} ${candidate.currency} wurde automatisch vorgemerkt.`,
        },
      });
      return true;
    });
    if (created) accrued++;
  }
  return { scanned: candidates.length, accrued };
}
