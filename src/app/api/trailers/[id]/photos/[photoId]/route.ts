import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManagedPublicUrl } from "@/lib/storage";
import { appendAuditLog } from "@/server/services/auditService";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const { id, photoId } = await params;
  const trailer = await prisma.trailer.findUnique({ where: { id } });
  if (!trailer || (trailer.ownerId !== session.sub && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const photo = await prisma.trailerPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.trailerId !== id) {
    return NextResponse.json({ error: "Foto nicht gefunden" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`trailer-edit:${id}`}))`;
    const current = await tx.trailer.findUniqueOrThrow({ where: { id } });
    await tx.trailerPhoto.delete({ where: { id: photoId } });
    if (isManagedPublicUrl(photo.url)) await tx.storageObjectDeletion.createMany({ data: [{ publicUrl: photo.url }], skipDuplicates: true });
    const requiresReview = session.role !== "ADMIN" && ["PUBLISHED", "SUSPENDED"].includes(current.status);
    if (requiresReview) {
      await tx.trailer.update({ where: { id }, data: { status: "PENDING_REVIEW" } });
      await tx.notification.create({ data: { userId: session.sub, channel: "IN_APP", title: "Erneute Prüfung erforderlich", body: `Die Fotos von „${current.title}“ werden erneut geprüft.` } });
    }
    await appendAuditLog(tx, { actor: session, requestId: _req.headers.get("x-request-id"), action: "TRAILER_PHOTO_REMOVED", entityType: "TrailerPhoto", entityId: photo.id, changes: { trailerId: id, deletionQueued: isManagedPublicUrl(photo.url), requiresReview } });
  });

  return NextResponse.json({ success: true });
}
