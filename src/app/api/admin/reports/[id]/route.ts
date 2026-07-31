import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ReportWorkflowError, resolveReport } from "@/server/services/reportService";

const schema = z.object({ status: z.enum(["IN_REVIEW", "RESOLVED", "DISMISSED"]), resolutionNote: z.string().trim().max(2000).optional(), suspendTrailer: z.boolean().default(false) }).refine((data) => data.status === "IN_REVIEW" || Boolean(data.resolutionNote), { path: ["resolutionNote"] });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Entscheidung begründen" }, { status: 400 });
  try {
    const report = await resolveReport({ reportId: (await params).id, targetStatus: parsed.data.status, resolutionNote: parsed.data.resolutionNote, suspendTrailer: parsed.data.suspendTrailer, actor: session, requestId: req.headers.get("x-request-id") });
    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof ReportWorkflowError) return NextResponse.json({ error: error.code === "NOT_FOUND" ? "Meldung nicht gefunden" : "Ungültige Entscheidung" }, { status: error.code === "NOT_FOUND" ? 404 : 409 });
    throw error;
  }
}
