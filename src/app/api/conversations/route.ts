import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConversationError, getOrCreateBookingConversation } from "@/server/services/conversationService";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ participantAId: session.sub }, { participantBId: session.sub }] },
    orderBy: { createdAt: "desc" },
    include: { participantA: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, participantB: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ conversations });
}

const createSchema = z.object({ recipientId: z.string().cuid(), bookingId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  try {
    const conversation = await getOrCreateBookingConversation({ ...parsed.data, actor: session, requestId: req.headers.get("x-request-id") });
    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof ConversationError) return NextResponse.json({ error: error.code === "NOT_FOUND" ? "Buchung nicht gefunden" : "Kein Zugriff" }, { status: error.code === "NOT_FOUND" ? 404 : 403 });
    throw error;
  }
}
