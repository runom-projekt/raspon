import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { identityDocumentSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = identityDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten", issues: parsed.error.flatten() }, { status: 400 });
  }
  if (!parsed.data.documentUrl.startsWith(`identity/${session.sub}/`)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: session.sub },
    data: {
      identityDocumentUrl: parsed.data.documentUrl,
      identitySubmittedAt: new Date(),
      isIdVerified: false,
    },
  });

  return NextResponse.json({ success: true });
}
