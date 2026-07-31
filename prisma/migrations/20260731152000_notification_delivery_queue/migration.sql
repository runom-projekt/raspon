CREATE TYPE "NotificationDeliveryStatus" AS ENUM (
    'UNKNOWN',
    'PENDING',
    'PROCESSING',
    'RETRY',
    'SENT',
    'FAILED',
    'SKIPPED'
);

ALTER TABLE "Notification"
    ADD COLUMN "deliveryStatus" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
    ADD COLUMN "deliveredAt" TIMESTAMP(3),
    ADD COLUMN "lastError" TEXT;

UPDATE "Notification"
SET "deliveryStatus" = 'UNKNOWN',
    "lastError" = 'Historical record created before delivery tracking';

CREATE INDEX "Notification_deliveryStatus_nextAttemptAt_idx"
    ON "Notification"("deliveryStatus", "nextAttemptAt");
