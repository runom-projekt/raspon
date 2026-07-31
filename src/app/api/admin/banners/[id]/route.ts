import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z.object({ active: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const banner = await prisma.$transaction(async (tx) => {
    const current = await tx.banner.findUniqueOrThrow({ where: { id }, select: { active: true } });
    const updated = await tx.banner.update({ where: { id }, data: parsed.data });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "BANNER_STATUS_CHANGED",
      entityType: "Banner",
      entityId: id,
      changes: { active: { from: current.active, to: updated.active } },
    });
    return updated;
  });
  return NextResponse.json({ banner });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

  const { id } = await params;
  await prisma.$transaction(async (tx) => {
    await tx.banner.delete({ where: { id } });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "BANNER_DELETED",
      entityType: "Banner",
      entityId: id,
    });
  });
  return NextResponse.json({ success: true });
}
