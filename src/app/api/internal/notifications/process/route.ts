import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { processNotificationBatch } from "@/server/services/notificationDeliveryService";
import { processStorageDeletionBatch } from "@/server/services/storageDeletionService";
import { applyTechnicalDataRetention } from "@/server/services/dataRetentionService";
import { accrueCompletedBookingPayouts } from "@/server/services/payoutService";
import { processPasswordResetEmailBatch } from "@/server/services/passwordResetDeliveryService";

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
  const [notifications, passwordResets, storageDeletions, retention, payouts] = await Promise.all([processNotificationBatch(), processPasswordResetEmailBatch(), processStorageDeletionBatch(), applyTechnicalDataRetention(), accrueCompletedBookingPayouts()]);
  return NextResponse.json({ notifications, passwordResets, storageDeletions, retention, payouts }, {
    headers: { "Cache-Control": "no-store" },
  });
}
