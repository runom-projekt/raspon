import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { processPaymentReversalBatch } from "@/server/services/paymentReversalService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const provided = req.headers.get("x-worker-secret");
  const expected = process.env.NOTIFICATION_WORKER_SECRET;
  if (!provided || !expected || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await processPaymentReversalBatch(), { headers: { "Cache-Control": "no-store" } });
}
