import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { moderateTrailer, TrailerModerationError } from "@/server/services/trailerModerationService";

const schema = z.object({ status: z.enum(["PUBLISHED", "SUSPENDED", "PENDING_REVIEW", "ARCHIVED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  try {
    const trailer = await moderateTrailer({ trailerId: (await params).id, targetStatus: parsed.data.status, actor: session, requestId: req.headers.get("x-request-id") });
    return NextResponse.json({ trailer });
  } catch (error) {
    if (error instanceof TrailerModerationError) {
      if (error.code === "NOT_FOUND") return NextResponse.json({ error: "Anhänger nicht gefunden" }, { status: 404 });
      if (error.code === "NOT_READY") return NextResponse.json({ error: "Die Anzeige ist noch nicht veröffentlichungsbereit", missing: error.details }, { status: 409 });
      return NextResponse.json({ error: "Ungültiger Statuswechsel" }, { status: 409 });
    }
    throw error;
  }
}
