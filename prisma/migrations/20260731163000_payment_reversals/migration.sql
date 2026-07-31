CREATE TYPE "PaymentReversalType" AS ENUM ('CANCEL_ORDER', 'FULL_REFUND');
CREATE TYPE "PaymentReversalStatus" AS ENUM ('QUEUED', 'SUBMITTING', 'SUBMITTED', 'COMPLETED', 'FAILED');

ALTER TABLE "Payment" ADD COLUMN "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE "PaymentReversal" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "type" "PaymentReversalType" NOT NULL,
  "status" "PaymentReversalStatus" NOT NULL DEFAULT 'QUEUED',
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "reason" TEXT,
  "providerOperationId" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentReversal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentReversal_bookingId_key" ON "PaymentReversal"("bookingId");
CREATE UNIQUE INDEX "PaymentReversal_providerOperationId_key" ON "PaymentReversal"("providerOperationId");
CREATE INDEX "PaymentReversal_status_nextAttemptAt_idx" ON "PaymentReversal"("status", "nextAttemptAt");
CREATE INDEX "PaymentReversal_paymentId_idx" ON "PaymentReversal"("paymentId");
ALTER TABLE "PaymentReversal" ADD CONSTRAINT "PaymentReversal_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentReversal" ADD CONSTRAINT "PaymentReversal_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentReversal" ADD CONSTRAINT "PaymentReversal_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
