import "server-only";
import { prisma } from "@/lib/prisma";
import { deleteObjectByPublicUrl } from "@/lib/storage";

const MAX_ATTEMPTS = 8;
const STALE_AFTER_MS = 10 * 60_000;

export async function processStorageDeletionBatch(limit = 20, remove = deleteObjectByPublicUrl, now = new Date()) {
  await prisma.storageObjectDeletion.updateMany({ where: { status: "PROCESSING", processingStartedAt: { lt: new Date(now.getTime() - STALE_AFTER_MS) } }, data: { status: "QUEUED", processingStartedAt: null } });
  let completed = 0, failed = 0;
  for (let index = 0; index < limit; index++) {
    const candidate = await prisma.storageObjectDeletion.findFirst({ where: { status: { in: ["QUEUED", "RETRY"] }, nextAttemptAt: { lte: now } }, orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }] });
    if (!candidate) break;
    const claimed = await prisma.storageObjectDeletion.updateMany({ where: { id: candidate.id, status: { in: ["QUEUED", "RETRY"] } }, data: { status: "PROCESSING", processingStartedAt: now, attempts: { increment: 1 } } });
    if (claimed.count !== 1) continue;
    const item = await prisma.storageObjectDeletion.findUniqueOrThrow({ where: { id: candidate.id } });
    try {
      await remove(item.publicUrl);
      await prisma.storageObjectDeletion.update({ where: { id: item.id }, data: { status: "COMPLETED", completedAt: now, processingStartedAt: null, lastError: null } });
      completed++;
    } catch (error) {
      const terminal = item.attempts >= MAX_ATTEMPTS;
      await prisma.storageObjectDeletion.update({ where: { id: item.id }, data: { status: terminal ? "FAILED" : "RETRY", processingStartedAt: null, lastError: (error instanceof Error ? error.message : "Unknown storage error").slice(0, 1000), nextAttemptAt: new Date(now.getTime() + Math.min(6 * 60 * 60_000, 60_000 * 2 ** Math.max(0, item.attempts - 1))) } });
      failed++;
    }
  }
  return { completed, failed };
}
