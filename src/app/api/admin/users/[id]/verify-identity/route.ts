import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z.object({ verified: z.boolean() });

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
      select: { isIdVerified: true },
    });
    const updated = await tx.user.update({
      where: { id },
      data: { isIdVerified: parsed.data.verified },
    });
    await appendAuditLog(tx, {
      actor: session,
      requestId: req.headers.get("x-request-id"),
      action: "IDENTITY_VERIFICATION_CHANGED",
      entityType: "User",
      entityId: id,
      changes: {
        isIdVerified: { from: current.isIdVerified, to: updated.isIdVerified },
      },
    });
    return updated;
  });
  return NextResponse.json({ user: { id: user.id, isIdVerified: user.isIdVerified } });
}
