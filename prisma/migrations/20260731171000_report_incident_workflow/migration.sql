ALTER TABLE "Report" ADD COLUMN "resolutionNote" TEXT;
ALTER TABLE "Report" ADD COLUMN "resolvedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Report_one_active_per_author_trailer"
ON "Report" ("authorId", "trailerId")
WHERE "trailerId" IS NOT NULL AND "status" IN ('OPEN', 'IN_REVIEW');
