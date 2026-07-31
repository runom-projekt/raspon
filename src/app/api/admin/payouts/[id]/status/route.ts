import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransitionPayoutStatus } from "@/server/domain/payout";
import { appendAuditLog } from "@/server/services/auditService";

const schema = z.object({ status: z.enum(["PENDING", "PAID", "FAILED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  try {
    const payout = await prisma.$transaction(async (tx) => {
      const current = await tx.payout.findUniqueOrThrow({ where: { id }, select: { status: true } });
      if (!canTransitionPayoutStatus(current.status, parsed.data.status)) {
        throw new Error("INVALID_PAYOUT_TRANSITION");
      }
      const updated = await tx.payout.update({ where: { id }, data: { status: parsed.data.status } });
      await appendAuditLog(tx, {
        actor: session,
        requestId: req.headers.get("x-request-id"),
        action: "PAYOUT_STATUS_CHANGED",
        entityType: "Payout",
        entityId: id,
        changes: { status: { from: current.status, to: updated.status } },
      });
      return updated;
    });
    return NextResponse.json({ payout });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PAYOUT_TRANSITION") {
      return NextResponse.json({ error: "Dieser Statuswechsel ist nicht erlaubt" }, { status: 409 });
    }
    throw error;
  }
}
