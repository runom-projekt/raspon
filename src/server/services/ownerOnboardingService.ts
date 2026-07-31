import "server-only";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/server/services/auditService";

export class OwnerOnboardingError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "ACCOUNT_INACTIVE") { super(code); }
}

export async function activateOwnerAccount(actor: SessionPayload, requestId: string | null) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`owner-onboarding:${actor.sub}`}))`;
    const user = await tx.user.findUnique({ where: { id: actor.sub } });
    if (!user) throw new OwnerOnboardingError("NOT_FOUND");
    if (user.status !== "ACTIVE") throw new OwnerOnboardingError("ACCOUNT_INACTIVE");
    if (user.role === "ADMIN" || user.role === "OWNER") return user;
    const updated = await tx.user.update({ where: { id: user.id }, data: { role: "OWNER" } });
    await tx.notification.create({ data: { userId: user.id, channel: "IN_APP", title: "Vermieterkonto aktiviert", body: "Sie können jetzt Ihren Anhänger einstellen und vermieten." } });
    await appendAuditLog(tx, { actor, requestId, action: "OWNER_ACCOUNT_ACTIVATED", entityType: "User", entityId: user.id, changes: { role: { from: user.role, to: "OWNER" } } });
    return updated;
  });
}
