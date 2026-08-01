import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeApprovedCancellation } from "@/server/services/bookingCancellationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ten sam wzorzec co /api/internal/payment-reversals/process — chroniony
// jednym sekretem workera lokalnego (cron/systemd), nie sesją użytkownika.
// docs/adr/0003-runom-refund-approval.md.
export async function POST(req: NextRequest) {
  const provided = req.headers.get("x-worker-secret");
  const expected = process.env.NOTIFICATION_WORKER_SECRET;
  if (!provided || !expected || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.booking.findMany({
    where: { pendingCancellationTaskId: { not: null } },
    select: { id: true },
    take: 100,
  });

  const totals = { scanned: pending.length, cancelled: 0, declined: 0, stillPending: 0, notPending: 0 };
  for (const { id } of pending) {
    const outcome = await finalizeApprovedCancellation(id);
    if (outcome === "cancelled") totals.cancelled += 1;
    else if (outcome === "declined") totals.declined += 1;
    else if (outcome === "still_pending") totals.stillPending += 1;
    else totals.notPending += 1;
  }

  return NextResponse.json(totals, { headers: { "Cache-Control": "no-store" } });
}
