import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trailerCreateSchema } from "@/lib/validation";
import { appendAuditLog } from "@/server/services/auditService";

async function assertOwnership(id: string, userId: string, role: string) {
  const trailer = await prisma.trailer.findUnique({ where: { id } });
  if (!trailer) return { error: "Anhänger nicht gefunden", status: 404 as const };
  if (trailer.ownerId !== userId && role !== "ADMIN") {
    return { error: "Keine Berechtigung", status: 403 as const };
  }
  return { trailer };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const { id } = await params;
  const check = await assertOwnership(id, session.sub, session.role);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json().catch(() => null);
  const parsed = trailerCreateSchema
    .omit({ photos: true, registrationDocumentUrl: true })
    .partial()
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten", issues: parsed.error.flatten() }, { status: 400 });
  }

  const trailer = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`trailer-edit:${id}`}))`;
    const current = await tx.trailer.findUniqueOrThrow({ where: { id } });
    const requiresReview = session.role !== "ADMIN" && ["PUBLISHED", "SUSPENDED"].includes(current.status);
    const updated = await tx.trailer.update({ where: { id }, data: { ...parsed.data, status: requiresReview ? "PENDING_REVIEW" : undefined } });
    if (requiresReview) await tx.notification.create({ data: { userId: session.sub, channel: "IN_APP", title: "Erneute Prüfung erforderlich", body: `Ihre Änderungen an „${current.title}“ werden vor der Veröffentlichung erneut geprüft.` } });
    await appendAuditLog(tx, { actor: session, requestId: req.headers.get("x-request-id"), action: "TRAILER_UPDATED", entityType: "Trailer", entityId: id, changes: { fields: Object.keys(parsed.data), status: requiresReview ? { from: current.status, to: "PENDING_REVIEW" } : undefined } });
    return updated;
  });

  return NextResponse.json({ trailer });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const { id } = await params;
  const check = await assertOwnership(id, session.sub, session.role);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  await prisma.$transaction(async (tx) => {
    const current = await tx.trailer.findUniqueOrThrow({ where: { id } });
    if (current.status === "ARCHIVED") return;
    await tx.trailer.update({ where: { id }, data: { status: "ARCHIVED" } });
    await appendAuditLog(tx, { actor: session, requestId: req.headers.get("x-request-id"), action: "TRAILER_ARCHIVED", entityType: "Trailer", entityId: id, changes: { status: { from: current.status, to: "ARCHIVED" } } });
  });
  return NextResponse.json({ success: true });
}
