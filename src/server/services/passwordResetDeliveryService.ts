import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSensitiveValue, encryptSensitiveValue } from "@/lib/sensitiveValue";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/constants";
import { getNotificationRetryDelayMs, shouldRetryNotification } from "@/server/domain/notificationRetry";

const CONFIG_RETRY_MS = 15 * 60 * 1000;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

interface DeliveryDependencies {
  now: () => Date;
  configured: () => boolean;
  send: typeof sendPasswordResetEmail;
}

const defaults: DeliveryDependencies = {
  now: () => new Date(),
  configured: isEmailConfigured,
  send: sendPasswordResetEmail,
};

export async function enqueuePasswordReset(userId: string, tokenHash: string, rawToken: string, expiresAt: Date) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`password-reset:${userId}`}))`;
    await tx.passwordResetToken.deleteMany({ where: { userId } });
    return tx.passwordResetToken.create({
      data: { userId, tokenHash, tokenCiphertext: encryptSensitiveValue(rawToken), expiresAt },
      select: { id: true },
    });
  });
}

export async function processPasswordResetEmailBatch(batchSize = 10, dependencies: DeliveryDependencies = defaults) {
  const totals = { processed: 0, sent: 0, retried: 0, failed: 0 };
  const now = dependencies.now();
  await prisma.passwordResetToken.updateMany({
    where: { deliveryStatus: "PROCESSING", lastAttemptAt: { lt: new Date(now.getTime() - PROCESSING_TIMEOUT_MS) } },
    data: { deliveryStatus: "RETRY", nextAttemptAt: now, lastError: "Recovered after worker timeout" },
  });

  for (let index = 0; index < Math.max(1, Math.min(batchSize, 100)); index++) {
    const candidate = await prisma.passwordResetToken.findFirst({
      where: { tokenCiphertext: { not: null }, expiresAt: { gt: now }, deliveryStatus: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
      orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (!candidate) break;
    const claimed = await prisma.passwordResetToken.updateMany({
      where: { id: candidate.id, deliveryStatus: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
      data: { deliveryStatus: "PROCESSING", attempts: { increment: 1 }, lastAttemptAt: now, lastError: null },
    });
    if (!claimed.count) continue;
    totals.processed++;
    const delivery = await prisma.passwordResetToken.findUniqueOrThrow({
      where: { id: candidate.id },
      include: { user: { select: { email: true, firstName: true } } },
    });
    if (!dependencies.configured()) {
      await prisma.passwordResetToken.update({ where: { id: delivery.id }, data: { deliveryStatus: "RETRY", attempts: { decrement: 1 }, nextAttemptAt: new Date(now.getTime() + CONFIG_RETRY_MS), lastError: "Email provider configuration unavailable" } });
      totals.retried++;
      continue;
    }
    try {
      if (!delivery.user.email || !delivery.tokenCiphertext) throw new Error("Reset delivery data unavailable");
      const raw = decryptSensitiveValue(delivery.tokenCiphertext);
      await dependencies.send(delivery.user.email, delivery.user.firstName, `${SITE_URL}/passwort-zuruecksetzen?token=${encodeURIComponent(raw)}`);
      await prisma.passwordResetToken.update({ where: { id: delivery.id }, data: { deliveryStatus: "SENT", deliveredAt: now, tokenCiphertext: null, lastError: null } });
      totals.sent++;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown delivery error";
      const retry = shouldRetryNotification(delivery.attempts);
      await prisma.passwordResetToken.update({ where: { id: delivery.id }, data: retry ? { deliveryStatus: "RETRY", nextAttemptAt: new Date(now.getTime() + getNotificationRetryDelayMs(delivery.attempts)), lastError: message } : { deliveryStatus: "FAILED", tokenCiphertext: null, lastError: message } });
      retry ? totals.retried++ : totals.failed++;
    }
  }
  return totals;
}
