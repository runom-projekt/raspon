ALTER TABLE "Booking"
    ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "Booking"
SET "expiresAt" = CASE
    WHEN "status" = 'PENDING' THEN "createdAt" + INTERVAL '30 minutes'
    ELSE "createdAt"
END;

ALTER TABLE "Booking"
    ALTER COLUMN "expiresAt" SET NOT NULL;

CREATE INDEX "Booking_status_expiresAt_idx"
    ON "Booking"("status", "expiresAt");
