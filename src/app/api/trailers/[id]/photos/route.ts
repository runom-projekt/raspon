import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isManagedPublicUrl } from "@/lib/storage";
import { appendAuditLog } from "@/server/services/auditService";

const createSchema = z.object({
  url: z.string().url(),
});

const reorderSchema = z.object({
  order: z.array(z.string().cuid()),
});

async function requireOwnerOrAdmin(trailerId: string, session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const trailer = await prisma.trailer.findUnique({ where: { id: trailerId } });
  if (!trailer || (trailer.ownerId !== session.sub && session.role !== "ADMIN")) return null;
  return trailer;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const { id } = await params;
  const trailer = await requireOwnerOrAdmin(id, session);
  if (!trailer) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  if (!isManagedPublicUrl(parsed.data.url)) return NextResponse.json({ error: "Nicht autorisierte Bildquelle" }, { status: 403 });

  const photo = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`trailer-edit:${id}`}))`;
    const current = await tx.trailer.findUniqueOrThrow({ where: { id } });
    const lastPhoto = await tx.trailerPhoto.findFirst({ where: { trailerId: id }, orderBy: { position: "desc" } });
    const created = await tx.trailerPhoto.create({ data: { trailerId: id, url: parsed.data.url, position: (lastPhoto?.position ?? -1) + 1 } });
    const requiresReview = session.role !== "ADMIN" && ["PUBLISHED", "SUSPENDED"].includes(current.status);
    if (requiresReview) {
      await tx.trailer.update({ where: { id }, data: { status: "PENDING_REVIEW" } });
      await tx.notification.create({ data: { userId: session.sub, channel: "IN_APP", title: "Erneute Prüfung erforderlich", body: `Die Fotos von „${current.title}“ werden erneut geprüft.` } });
    }
    await appendAuditLog(tx, { actor: session, requestId: req.headers.get("x-request-id"), action: "TRAILER_PHOTO_ADDED", entityType: "TrailerPhoto", entityId: created.id, changes: { trailerId: id, requiresReview } });
    return created;
  });

  return NextResponse.json({ photo });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const { id } = await params;
  const trailer = await requireOwnerOrAdmin(id, session);
  if (!trailer) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const photos = await prisma.trailerPhoto.findMany({ where: { trailerId: id } });
  const validIds = new Set(photos.map((p) => p.id));
  if (parsed.data.order.length !== photos.length || !parsed.data.order.every((pid) => validIds.has(pid))) {
    return NextResponse.json({ error: "Ungültige Reihenfolge" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`trailer-edit:${id}`}))`;
    const current = await tx.trailer.findUniqueOrThrow({ where: { id } });
    await Promise.all(parsed.data.order.map((photoId, position) => tx.trailerPhoto.update({ where: { id: photoId }, data: { position } })));
    const requiresReview = session.role !== "ADMIN" && ["PUBLISHED", "SUSPENDED"].includes(current.status);
    if (requiresReview) {
      await tx.trailer.update({ where: { id }, data: { status: "PENDING_REVIEW" } });
      await tx.notification.create({ data: { userId: session.sub, channel: "IN_APP", title: "Erneute Prüfung erforderlich", body: `Die Fotoreihenfolge von „${current.title}“ wird erneut geprüft.` } });
    }
    await appendAuditLog(tx, { actor: session, requestId: req.headers.get("x-request-id"), action: "TRAILER_PHOTOS_REORDERED", entityType: "Trailer", entityId: id, changes: { order: parsed.data.order, requiresReview } });
  });

  return NextResponse.json({ success: true });
}
