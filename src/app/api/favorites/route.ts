import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const favoriteSchema = z.object({ trailerId: z.string().cuid() });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.sub },
    include: {
      trailer: {
        include: { photos: { take: 1, orderBy: { position: "asc" } } },
      },
    },
  });

  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const favorite = await prisma.favorite.upsert({
    where: { userId_trailerId: { userId: session.sub, trailerId: parsed.data.trailerId } },
    create: { userId: session.sub, trailerId: parsed.data.trailerId },
    update: {},
  });

  return NextResponse.json({ favorite });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const trailerId = req.nextUrl.searchParams.get("trailerId");
  if (!trailerId) return NextResponse.json({ error: "trailerId fehlt" }, { status: 400 });

  await prisma.favorite.deleteMany({ where: { userId: session.sub, trailerId } });
  return NextResponse.json({ success: true });
}
