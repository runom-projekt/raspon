ALTER TABLE "PasswordResetToken"
  ADD COLUMN "tokenCiphertext" TEXT,
  ADD COLUMN "deliveryStatus" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "lastError" TEXT;

CREATE INDEX "PasswordResetToken_deliveryStatus_nextAttemptAt_idx"
  ON "PasswordResetToken"("deliveryStatus", "nextAttemptAt");
