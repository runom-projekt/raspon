ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'PAYPAL';
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';
ALTER TABLE "Payment" ADD COLUMN "providerCaptureId" TEXT;
CREATE UNIQUE INDEX "Payment_providerCaptureId_key" ON "Payment"("providerCaptureId");
