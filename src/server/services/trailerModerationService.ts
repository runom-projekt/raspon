import "server-only";
import type { TrailerStatus } from "@prisma/client";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManagedPublicUrl } from "@/lib/storage";
import { appendAuditLog } from "@/server/services/auditService";

export class TrailerModerationError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "NOT_READY" | "INVALID_TRANSITION", public readonly details?: string[]) { super(code); }
}

const transitions: Record<TrailerStatus, TrailerStatus[]> = {
  DRAFT: ["PENDING_REVIEW", "ARCHIVED"],
  PENDING_REVIEW: ["PUBLISHED", "SUSPENDED", "ARCHIVED"],
  PUBLISHED: ["SUSPENDED", "ARCHIVED"],
  SUSPENDED: ["PUBLISHED", "PENDING_REVIEW", "ARCHIVED"],
  ARCHIVED: ["PENDING_REVIEW"],
};

export async function moderateTrailer({ trailerId, targetStatus, actor, requestId }: { trailerId: string; targetStatus: TrailerStatus; actor: SessionPayload; requestId: string | null }) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`trailer-edit:${trailerId}`}))`;
    const trailer = await tx.trailer.findUnique({ where: { id: trailerId }, include: { owner: true, photos: true, documents: { where: { type: "REGISTRATION" } } } });
    if (!trailer) throw new TrailerModerationError("NOT_FOUND");
    if (trailer.status === targetStatus) return trailer;
    if (!transitions[trailer.status].includes(targetStatus)) throw new TrailerModerationError("INVALID_TRANSITION");

    if (targetStatus === "PUBLISHED") {
      const missing: string[] = [];
      if (trailer.owner.status !== "ACTIVE" || !["OWNER", "ADMIN"].includes(trailer.owner.role)) missing.push("activeOwner");
      if (trailer.photos.length === 0 || !trailer.photos.every((photo) => isManagedPublicUrl(photo.url))) missing.push("managedPhoto");
      if (!trailer.documents.some((document) => document.url.startsWith(`registration/${trailer.ownerId}/`))) missing.push("registrationDocument");
      if (!Number.isFinite(trailer.latitude) || !Number.isFinite(trailer.longitude)) missing.push("location");
      if (missing.length) throw new TrailerModerationError("NOT_READY", missing);
    }

    const updated = await tx.trailer.update({ where: { id: trailer.id }, data: { status: targetStatus, publishedAt: targetStatus === "PUBLISHED" ? new Date() : undefined } });
    const labels: Record<TrailerStatus, string> = { DRAFT: "Entwurf", PENDING_REVIEW: "Prüfung", PUBLISHED: "veröffentlicht", SUSPENDED: "gesperrt", ARCHIVED: "archiviert" };
    await tx.notification.create({ data: { userId: trailer.ownerId, channel: "IN_APP", title: "Anzeigenstatus geändert", body: `Ihre Anzeige „${trailer.title}“ ist jetzt ${labels[targetStatus]}.` } });
    await appendAuditLog(tx, { actor, requestId, action: "TRAILER_STATUS_CHANGED", entityType: "Trailer", entityId: trailer.id, changes: { status: { from: trailer.status, to: targetStatus } } });
    return updated;
  });
}
