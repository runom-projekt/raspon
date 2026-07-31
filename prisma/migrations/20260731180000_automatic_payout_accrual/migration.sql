ALTER TABLE "Payout" ADD COLUMN "bookingId" TEXT;
ALTER TABLE "Payout" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Payout_bookingId_key" ON "Payout"("bookingId");
CREATE INDEX "Payout_status_createdAt_idx" ON "Payout"("status", "createdAt");

ALTER TABLE "Payout" ADD CONSTRAINT "Payout_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
