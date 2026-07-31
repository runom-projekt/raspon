import "server-only";
import type { ReportStatus } from "@prisma/client";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/server/services/auditService";

export class ReportWorkflowError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "FORBIDDEN" | "ALREADY_REPORTED" | "INVALID_TRANSITION") { super(code); }
}

export async function createTrailerReport({ trailerId, reason, details, actor, requestId }: { trailerId: string; reason: string; details?: string; actor: SessionPayload; requestId: string | null }) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`report:${actor.sub}:${trailerId}`}))`;
    const trailer = await tx.trailer.findUnique({ where: { id: trailerId }, select: { ownerId: true, status: true, title: true } });
    if (!trailer || trailer.status !== "PUBLISHED") throw new ReportWorkflowError("NOT_FOUND");
    if (trailer.ownerId === actor.sub) throw new ReportWorkflowError("FORBIDDEN");
    const active = await tx.report.findFirst({ where: { authorId: actor.sub, trailerId, status: { in: ["OPEN", "IN_REVIEW"] } } });
    if (active) throw new ReportWorkflowError("ALREADY_REPORTED");
    const report = await tx.report.create({ data: { authorId: actor.sub, trailerId, reason, details } });
    const admins = await tx.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
    if (admins.length) await tx.notification.createMany({ data: admins.map((admin) => ({ userId: admin.id, channel: "IN_APP" as const, title: "Neue Meldung", body: `Die Anzeige „${trailer.title}“ wurde gemeldet.` })) });
    await appendAuditLog(tx, { actor, requestId, action: "REPORT_CREATED", entityType: "Report", entityId: report.id, changes: { trailerId, reason } });
    return report;
  });
}

export async function resolveReport({ reportId, targetStatus, resolutionNote, suspendTrailer, actor, requestId }: { reportId: string; targetStatus: Exclude<ReportStatus, "OPEN">; resolutionNote?: string; suspendTrailer: boolean; actor: SessionPayload; requestId: string | null }) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`report-resolution:${reportId}`}))`;
    const report = await tx.report.findUnique({ where: { id: reportId }, include: { trailer: true } });
    if (!report) throw new ReportWorkflowError("NOT_FOUND");
    if (["RESOLVED", "DISMISSED"].includes(report.status)) {
      if (report.status === targetStatus) return report;
      throw new ReportWorkflowError("INVALID_TRANSITION");
    }
    if (suspendTrailer && (targetStatus !== "RESOLVED" || !report.trailerId)) throw new ReportWorkflowError("INVALID_TRANSITION");
    const updated = await tx.report.update({ where: { id: report.id }, data: { status: targetStatus, resolutionNote, resolvedAt: ["RESOLVED", "DISMISSED"].includes(targetStatus) ? new Date() : null } });
    if (suspendTrailer && report.trailer && report.trailer.status !== "SUSPENDED") {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`trailer-edit:${report.trailer.id}`}))`;
      await tx.trailer.update({ where: { id: report.trailer.id }, data: { status: "SUSPENDED" } });
      await tx.notification.create({ data: { userId: report.trailer.ownerId, channel: "IN_APP", title: "Anzeige gesperrt", body: `Ihre Anzeige „${report.trailer.title}“ wurde nach einer Sicherheitsprüfung gesperrt.` } });
      await appendAuditLog(tx, { actor, requestId, action: "TRAILER_SUSPENDED_FROM_REPORT", entityType: "Trailer", entityId: report.trailer.id, changes: { reportId } });
    }
    await tx.notification.create({ data: { userId: report.authorId, channel: "IN_APP", title: "Meldung bearbeitet", body: targetStatus === "DISMISSED" ? "Ihre Meldung wurde geprüft und geschlossen." : targetStatus === "RESOLVED" ? "Ihre Meldung wurde geprüft und gelöst." : "Ihre Meldung wird jetzt geprüft." } });
    await appendAuditLog(tx, { actor, requestId, action: "REPORT_STATUS_CHANGED", entityType: "Report", entityId: report.id, changes: { status: { from: report.status, to: targetStatus }, suspendTrailer } });
    return updated;
  });
}
