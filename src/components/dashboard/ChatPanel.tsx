"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConversationSummary {
  id: string;
  participantA: { id: string; firstName: string; lastName: string };
  participantB: { id: string; firstName: string; lastName: string };
  messages: { body: string; createdAt: string }[];
}

interface MessageItem {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { firstName: string; lastName: string };
}

export function ChatPanel({ currentUserId, initialConversationId }: { currentUserId: string; initialConversationId?: string }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations ?? []);
        const requested = data.conversations?.find((conversation: ConversationSummary) => conversation.id === initialConversationId);
        if (requested) setActiveId(requested.id);
        else if (data.conversations?.[0]) setActiveId(data.conversations[0].id);
      })
      .catch(() => toast.error("Unterhaltungen konnten nicht geladen werden"));
  }, [initialConversationId]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/conversations/${activeId}/messages`);
      const data = await res.json();
      if (!res.ok) {
        if (!cancelled) toast.error(data.error ?? "Nachrichten konnten nicht geladen werden");
        return;
      }
      if (!cancelled) setMessages(data.messages ?? []);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!draft.trim() || !activeId || sending) return;
    const body = draft;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nachricht konnte nicht gesendet werden");
      setDraft("");
      if (data.message) setMessages((prev) => [...prev, data.message]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nachricht konnte nicht gesendet werden");
    } finally {
      setSending(false);
    }
  }

  function otherParticipant(c: ConversationSummary) {
    return c.participantA.id === currentUserId ? c.participantB : c.participantA;
  }

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-graphite-100 bg-white lg:grid-cols-[280px_1fr]">
      <div className="border-r border-graphite-100">
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-graphite-500">Keine Unterhaltungen.</p>
        ) : (
          conversations.map((c) => {
            const other = otherParticipant(c);
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "block w-full border-b border-graphite-50 p-4 text-left hover:bg-graphite-50",
                  activeId === c.id && "bg-graphite-50"
                )}
              >
                <p className="text-sm font-semibold text-graphite-900">
                  {other.firstName} {other.lastName}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-graphite-500">
                  {c.messages[0]?.body ?? "Keine Nachrichten"}
                </p>
              </button>
            );
          })
        )}
      </div>

      <div className="flex h-[480px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.senderId === currentUserId ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-xs rounded-2xl px-4 py-2 text-sm",
                  m.senderId === currentUserId
                    ? "bg-graphite-900 text-white"
                    : "bg-graphite-100 text-graphite-900"
                )}
              >
                {m.body}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 border-t border-graphite-100 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Nachricht schreiben…"
            className="input h-11"
            disabled={!activeId}
          />
          <button onClick={sendMessage} disabled={!activeId || sending || !draft.trim()} aria-label="Nachricht senden" className="btn-primary h-11 w-11 shrink-0 p-0 disabled:opacity-50">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
