import "server-only";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendQueuedEmail } from "@/lib/email";
import { getSmsProvider, isSmsConfigured } from "@/lib/sms";
import {
  getNotificationRetryDelayMs,
  shouldRetryNotification,
} from "@/server/domain/notificationRetry";

const CONFIG_RETRY_MS = 15 * 60 * 1000;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

interface DeliveryDependencies {
  now: () => Date;
  emailConfigured: () => boolean;
  smsConfigured: () => boolean;
  sendEmail: typeof sendQueuedEmail;
  sendSms: (message: { to: string; body: string }) => Promise<void>;
}

const defaultDependencies: DeliveryDependencies = {
  now: () => new Date(),
  emailConfigured: isEmailConfigured,
  smsConfigured: isSmsConfigured,
  sendEmail: sendQueuedEmail,
  sendSms: (message) => getSmsProvider().send(message),
};

export async function processNotificationBatch(
  batchSize = 25,
  dependencies: DeliveryDependencies = defaultDependencies
) {
  const totals = { processed: 0, sent: 0, retried: 0, failed: 0, skipped: 0 };
  const now = dependencies.now();

  await prisma.notification.updateMany({
    where: {
      deliveryStatus: "PROCESSING",
      lastAttemptAt: { lt: new Date(now.getTime() - PROCESSING_TIMEOUT_MS) },
    },
    data: {
      deliveryStatus: "RETRY",
      nextAttemptAt: now,
      lastError: "Recovered after worker timeout",
    },
  });

  for (let index = 0; index < batchSize; index += 1) {
    const candidate = await prisma.notification.findFirst({
      where: {
        deliveryStatus: { in: ["PENDING", "RETRY"] },
        nextAttemptAt: { lte: now },
      },
      orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (!candidate) break;

    const claimed = await prisma.notification.updateMany({
      where: {
        id: candidate.id,
        deliveryStatus: { in: ["PENDING", "RETRY"] },
        nextAttemptAt: { lte: now },
      },
      data: {
        deliveryStatus: "PROCESSING",
        attempts: { increment: 1 },
        lastAttemptAt: now,
        lastError: null,
      },
    });
    if (claimed.count === 0) continue;

    const notification = await prisma.notification.findUniqueOrThrow({
      where: { id: candidate.id },
      include: { user: { select: { email: true, phone: true } } },
    });
    totals.processed += 1;

    if (notification.channel === "PUSH") {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          deliveryStatus: "SKIPPED",
          lastError: "Push provider is not configured",
        },
      });
      totals.skipped += 1;
      continue;
    }
    if (notification.channel === "IN_APP") {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { deliveryStatus: "SENT", deliveredAt: now },
      });
      totals.sent += 1;
      continue;
    }

    const providerUnavailable =
      (notification.channel === "EMAIL" && !dependencies.emailConfigured()) ||
      (notification.channel === "SMS" && !dependencies.smsConfigured());
    if (providerUnavailable) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          deliveryStatus: "RETRY",
          attempts: { decrement: 1 },
          nextAttemptAt: new Date(now.getTime() + CONFIG_RETRY_MS),
          lastError: "Provider configuration unavailable",
        },
      });
      totals.retried += 1;
      continue;
    }

    try {
      if (notification.channel === "EMAIL") {
        if (!notification.user.email) throw new Error("Recipient has no email");
        await dependencies.sendEmail({
          id: notification.id,
          to: notification.user.email,
          subject: notification.title,
          body: notification.body,
        });
      } else {
        if (!notification.user.phone) throw new Error("Recipient has no phone");
        await dependencies.sendSms({
          to: notification.user.phone,
          body: `${notification.title}: ${notification.body}`,
        });
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          deliveryStatus: "SENT",
          deliveredAt: now,
          lastError: null,
        },
      });
      totals.sent += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message.slice(0, 1000) : "Unknown delivery error";
      const retry = shouldRetryNotification(notification.attempts);
      await prisma.notification.update({
        where: { id: notification.id },
        data: retry
          ? {
              deliveryStatus: "RETRY",
              nextAttemptAt: new Date(
                now.getTime() + getNotificationRetryDelayMs(notification.attempts)
              ),
              lastError: message,
            }
          : { deliveryStatus: "FAILED", lastError: message },
      });
      if (retry) totals.retried += 1;
      else totals.failed += 1;
    }
  }

  return totals;
}
