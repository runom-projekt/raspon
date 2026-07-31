import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.sub, channel: "IN_APP" }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId: session.sub, channel: "IN_APP", readAt: null } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

const patchSchema = z.union([z.object({ all: z.literal(true) }), z.object({ id: z.string().cuid() })]);

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  const where = "all" in parsed.data ? { userId: session.sub, channel: "IN_APP" as const, readAt: null } : { id: parsed.data.id, userId: session.sub, channel: "IN_APP" as const, readAt: null };
  const result = await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  return NextResponse.json({ updated: result.count });
}
