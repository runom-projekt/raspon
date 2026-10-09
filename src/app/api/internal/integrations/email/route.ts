import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyEmailDelivery } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const provided = req.headers.get("x-worker-secret");
  const expected = process.env.NOTIFICATION_WORKER_SECRET;
  return Boolean(
    provided &&
      expected &&
      Buffer.byteLength(provided) === Buffer.byteLength(expected) &&
      timingSafeEqual(Buffer.from(provided!), Buffer.from(expected!))
  );
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const provider = await verifyEmailDelivery();
    return NextResponse.json(
      { status: "ok", provider },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { status: "failed" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
