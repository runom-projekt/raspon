import "server-only";
import type { Prisma } from "@prisma/client";
import type { SessionPayload } from "@/lib/auth";

export async function appendAuditLog(
  tx: Prisma.TransactionClient,
  {
    actor,
    requestId,
    action,
    entityType,
    entityId,
    changes,
  }: {
    actor: SessionPayload;
    requestId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Prisma.InputJsonValue;
  }
) {
  return tx.auditLog.create({
    data: {
      actorId: actor.sub,
      actorEmail: actor.email,
      action,
      entityType,
      entityId,
      requestId,
      changes,
    },
  });
}
