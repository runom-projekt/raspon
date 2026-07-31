import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPrivateDownloadUrl, isPrivateStorageConfigured } from "@/lib/storage";
import { appendAuditLog } from "@/server/services/auditService";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  if (!isPrivateStorageConfigured()) return NextResponse.json({ error: "Dokumentenspeicher ist nicht konfiguriert" }, { status: 503 });
  const { id } = await params;
  const trailer = await prisma.trailer.findUnique({ where: { id }, select: { ownerId: true, documents: { where: { type: "REGISTRATION" }, take: 1 } } });
  const key = trailer?.documents[0]?.url;
  if (!trailer || !key?.startsWith(`registration/${trailer.ownerId}/`)) return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
  const downloadUrl = await createPrivateDownloadUrl(key);
  await prisma.$transaction((tx) => appendAuditLog(tx, { actor: session, requestId: request.headers.get("x-request-id"), action: "TRAILER_REGISTRATION_DOCUMENT_ACCESSED", entityType: "Trailer", entityId: id }));
  return NextResponse.redirect(downloadUrl, 303);
}
