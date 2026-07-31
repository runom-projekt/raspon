import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Nachrichten" };

export default async function CustomerMessagesPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/anmelden");
  const { conversation } = await searchParams;

  return (
    <>
      <Header />
      <main className="container-page py-10">
        <h1 className="mb-6 font-display text-2xl font-bold text-graphite-900">Nachrichten</h1>
        <ChatPanel currentUserId={session.sub} initialConversationId={conversation} />
      </main>
      <Footer />
    </>
  );
}
