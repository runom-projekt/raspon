ALTER TABLE "Booking"
  ADD COLUMN "pendingCancellationTaskId" TEXT;

CREATE INDEX "Booking_pendingCancellationTaskId_idx" ON "Booking"("pendingCancellationTaskId");
