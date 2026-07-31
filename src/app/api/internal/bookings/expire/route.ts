import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { expirePendingBookings } from "@/server/services/bookingExpiryService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validWorkerSecret(provided: string | null): boolean {
  const expected = process.env.NOTIFICATION_WORKER_SECRET;
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(req: NextRequest) {
  if (!validWorkerSecret(req.headers.get("x-worker-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await expirePendingBookings(), {
    headers: { "Cache-Control": "no-store" },
  });
}
