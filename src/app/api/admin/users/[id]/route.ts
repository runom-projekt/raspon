import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/server/services/auditService";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN" || !session.isSuperAdmin) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: "Sie können Ihr eigenes Konto nicht löschen" }, { status: 400 });
  }

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUniqueOrThrow({ where: { id }, select: { email: true } });
      // Rein persönliche Daten ohne Bedeutung für andere Nutzer — sicher vor dem Löschversuch zu entfernen.
      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
      await appendAuditLog(tx, {
        actor: session,
        requestId: req.headers.get("x-request-id"),
        action: "USER_DELETED",
        entityType: "User",
        entityId: id,
        changes: { email: target.email },
      });
      return target;
    });
    return NextResponse.json({ deleted: true, email: deleted.email });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Konto wurde nicht gefunden" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Konto hat verknüpfte Daten (Buchungen, Anhänger, Bewertungen o. Ä.) und kann nicht gelöscht werden. Sperren Sie es stattdessen." },
        { status: 409 }
      );
    }
    throw error;
  }
}
