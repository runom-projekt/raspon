import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { ChatPanel } from "@/components/dashboard/ChatPanel";

export const metadata: Metadata = { title: "Nachrichten" };

export default async function OwnerMessagesPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const session = await getSession();
  const { conversation } = await searchParams;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-graphite-900">Nachrichten</h1>
      <ChatPanel currentUserId={session!.sub} initialConversationId={conversation} />
    </div>
  );
}
