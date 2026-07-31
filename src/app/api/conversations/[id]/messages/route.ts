import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { messageCreateSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { ConversationError, readConversation, sendConversationMessage } from "@/server/services/conversationService";

function accessError(error: ConversationError) {
  return NextResponse.json({ error: "Kein Zugriff" }, { status: error.code === "NOT_FOUND" ? 404 : 403 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  try { return NextResponse.json({ messages: await readConversation((await params).id, session) }); }
  catch (error) { if (error instanceof ConversationError) return accessError(error); throw error; }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const id = (await params).id;
  const parsed = messageCreateSchema.safeParse({ ...(await req.json().catch(() => null)), conversationId: id });
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  const limited = await rateLimit(`message:${session.sub}`, { limit: 30, windowMs: 60_000 });
  if (!limited.success) return NextResponse.json({ error: "Zu viele Nachrichten. Bitte warten Sie kurz." }, { status: 429 });
  try {
    const message = await sendConversationMessage({ conversationId: id, body: parsed.data.body.trim(), actor: session, requestId: req.headers.get("x-request-id") });
    return NextResponse.json({ message });
  } catch (error) { if (error instanceof ConversationError) return accessError(error); throw error; }
}
