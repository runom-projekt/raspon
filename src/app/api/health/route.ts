import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getIntegrationReadiness,
  hasCriticalIntegrations,
} from "@/lib/integrationReadiness";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const integrations = getIntegrationReadiness();
    return NextResponse.json(
      {
        status: hasCriticalIntegrations(integrations) ? "ok" : "degraded",
        checks: { database: "ok" },
        integrations,
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        checks: { database: "unavailable" },
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
