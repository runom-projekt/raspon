import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getOperationalQueueHealth } from "@/server/services/operationalHealthService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const provided = req.headers.get("x-worker-secret");
  const expected = process.env.NOTIFICATION_WORKER_SECRET;
  if (!provided || !expected || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getOperationalQueueHealth();
  return NextResponse.json(result, { status: result.status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
