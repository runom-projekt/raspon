CREATE TABLE "StorageObjectDeletion" (
    "id" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StorageObjectDeletion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StorageObjectDeletion_publicUrl_key" ON "StorageObjectDeletion"("publicUrl");
CREATE INDEX "StorageObjectDeletion_status_nextAttemptAt_idx" ON "StorageObjectDeletion"("status", "nextAttemptAt");
