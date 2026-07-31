import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z.object({ role: z.enum(["CUSTOMER", "OWNER", "ADMIN"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN" || !session.isSuperAdmin) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: "Sie können Ihre eigene Rolle nicht ändern" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const user = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({
      where: { id },
      select: { role: true },
    });
    const updated = await tx.user.update({
      where: { id },
      data: { role: parsed.data.role },
    });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: id,
      changes: { role: { from: current.role, to: updated.role } },
    });
    return updated;
  });
  return NextResponse.json({ user: { id: user.id, role: user.role } });
}
