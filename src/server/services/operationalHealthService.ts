import "server-only";
import { prisma } from "@/lib/prisma";

const GRACE_MS = 5 * 60 * 1000;
const STALE_PROCESSING_MS = 15 * 60 * 1000;

export async function getOperationalQueueHealth(now = new Date()) {
  const overdueBefore = new Date(now.getTime() - GRACE_MS);
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);
  const [expiredBookings, notificationFailures, notificationBacklog, passwordResetFailures, passwordResetBacklog, reversalFailures, reversalBacklog, storageFailures, storageBacklog, payoutBacklog] = await prisma.$transaction([
    prisma.booking.count({ where: { status: "PENDING", expiresAt: { lt: overdueBefore } } }),
    prisma.notification.count({ where: { deliveryStatus: "FAILED" } }),
    prisma.notification.count({ where: { OR: [
      { channel: "IN_APP", deliveryStatus: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lt: overdueBefore } },
      { deliveryStatus: "PROCESSING", lastAttemptAt: { lt: staleBefore } },
    ] } }),
    prisma.passwordResetToken.count({ where: { deliveryStatus: "FAILED", expiresAt: { gt: now } } }),
    prisma.passwordResetToken.count({ where: { expiresAt: { gt: now }, OR: [
      { deliveryStatus: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lt: overdueBefore } },
      { deliveryStatus: "PROCESSING", lastAttemptAt: { lt: staleBefore } },
    ] } }),
    prisma.paymentReversal.count({ where: { status: "FAILED" } }),
    prisma.paymentReversal.count({ where: { OR: [
      { status: "QUEUED", nextAttemptAt: { lt: overdueBefore } },
      { status: "SUBMITTING", processingStartedAt: { lt: staleBefore } },
    ] } }),
    prisma.storageObjectDeletion.count({ where: { status: "FAILED" } }),
    prisma.storageObjectDeletion.count({ where: { OR: [
      { status: { in: ["QUEUED", "RETRY"] }, nextAttemptAt: { lt: overdueBefore } },
      { status: "PROCESSING", processingStartedAt: { lt: staleBefore } },
    ] } }),
    prisma.booking.count({ where: {
      status: "COMPLETED",
      endDate: { lt: overdueBefore },
      payment: { status: "PAID" },
      trailer: { owner: { isIdVerified: true, status: "ACTIVE" } },
      payout: null,
    } }),
  ]);
  const queues = { expiredBookings, notificationFailures, notificationBacklog, passwordResetFailures, passwordResetBacklog, reversalFailures, reversalBacklog, storageFailures, storageBacklog, payoutBacklog };
  return { status: Object.values(queues).every((count) => count === 0) ? "ok" as const : "degraded" as const, queues, checkedAt: now.toISOString() };
}
