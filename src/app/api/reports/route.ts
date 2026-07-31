import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createTrailerReport, ReportWorkflowError } from "@/server/services/reportService";

const schema = z.object({ trailerId: z.string().cuid(), reason: z.enum(["FRAUD", "UNSAFE", "MISLEADING", "DUPLICATE", "OTHER"]), details: z.string().trim().max(2000).optional() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const limited = await rateLimit(`report:${session.sub}`, { limit: 5, windowMs: 24 * 60 * 60_000 });
  if (!limited.success) return NextResponse.json({ error: "Zu viele Meldungen. Bitte versuchen Sie es später erneut." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  try {
    const report = await createTrailerReport({ ...parsed.data, actor: session, requestId: req.headers.get("x-request-id") });
    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof ReportWorkflowError) {
      if (error.code === "NOT_FOUND") return NextResponse.json({ error: "Anzeige nicht gefunden" }, { status: 404 });
      if (error.code === "ALREADY_REPORTED") return NextResponse.json({ error: "Sie haben diese Anzeige bereits gemeldet" }, { status: 409 });
      return NextResponse.json({ error: "Eigene Anzeige kann nicht gemeldet werden" }, { status: 403 });
    }
    throw error;
  }
}
