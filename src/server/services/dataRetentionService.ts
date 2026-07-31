import "server-only";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function applyTechnicalDataRetention(now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('technical-data-retention'))`;
    const tokenCutoff = new Date(now.getTime() - 7 * DAY_MS);
    const revokedCutoff = new Date(now.getTime() - 30 * DAY_MS);
    const rateLimitCutoff = new Date(now.getTime() - DAY_MS);
    const storageCutoff = new Date(now.getTime() - 30 * DAY_MS);
    const [rateLimits, emailTokens, passwordTokens, expiredRefreshTokens, revokedRefreshTokens, storageDeletions] = await Promise.all([
      tx.rateLimitBucket.deleteMany({ where: { resetAt: { lt: rateLimitCutoff } } }),
      tx.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: tokenCutoff } } }),
      tx.passwordResetToken.deleteMany({ where: { expiresAt: { lt: tokenCutoff } } }),
      tx.refreshToken.deleteMany({ where: { expiresAt: { lt: revokedCutoff } } }),
      tx.refreshToken.deleteMany({ where: { revokedAt: { lt: revokedCutoff } } }),
      tx.storageObjectDeletion.deleteMany({ where: { status: "COMPLETED", completedAt: { lt: storageCutoff } } }),
    ]);
    return {
      rateLimits: rateLimits.count,
      emailTokens: emailTokens.count,
      passwordTokens: passwordTokens.count,
      refreshTokens: expiredRefreshTokens.count + revokedRefreshTokens.count,
      storageDeletions: storageDeletions.count,
    };
  });
}
