import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const user = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });
    const updated = await tx.user.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "USER_STATUS_CHANGED",
      entityType: "User",
      entityId: id,
      changes: { status: { from: current.status, to: updated.status } },
    });
    return updated;
  });
  return NextResponse.json({ user: { id: user.id, status: user.status } });
}
