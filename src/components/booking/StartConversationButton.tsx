"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function StartConversationButton({ bookingId, recipientId, destination, compact = false }: { bookingId: string; recipientId: string; destination: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function openConversation() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId, recipientId }),
      });
      const data = await response.json();
      if (!response.ok || !data.conversation?.id) throw new Error(data.error ?? "Unterhaltung konnte nicht geöffnet werden");
      router.push(`${destination}?conversation=${encodeURIComponent(data.conversation.id)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unterhaltung konnte nicht geöffnet werden");
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={openConversation} disabled={pending} className={compact ? "inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 disabled:opacity-50" : "btn-secondary mt-4 w-full disabled:opacity-50"}>
      <MessageCircle size={17} /> {pending ? "Wird geöffnet…" : "Nachricht senden"}
    </button>
  );
}
