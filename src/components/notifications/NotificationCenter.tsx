"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

interface Item { id: string; title: string; body: string; readAt: Date | string | null; createdAt: Date | string }

export function NotificationCenter({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const router = useRouter();
  const unread = items.filter((item) => !item.readAt).length;

  async function markRead(id?: string) {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }) });
    if (!response.ok) { toast.error("Benachrichtigung konnte nicht aktualisiert werden"); return; }
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => (!id || item.id === id) ? { ...item, readAt: item.readAt ?? now } : item));
    router.refresh();
  }

  async function deleteNotification(id?: string) {
    const response = await fetch("/api/notifications", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }) });
    if (!response.ok) { toast.error("Benachrichtigung konnte nicht gelöscht werden"); return; }
    setItems((current) => (id ? current.filter((item) => item.id !== id) : []));
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-graphite-500">{unread ? `${unread} ungelesen` : "Alles gelesen"}</p>
        <div className="flex items-center gap-4">
          {unread > 0 && <button onClick={() => markRead()} className="inline-flex items-center gap-2 text-sm font-semibold text-accent-600"><CheckCheck size={17} /> Alle als gelesen markieren</button>}
          {items.length > 0 && <button onClick={() => deleteNotification()} className="inline-flex items-center gap-2 text-sm font-semibold text-graphite-500 hover:text-red-600"><Trash2 size={17} /> Alle löschen</button>}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`rounded-2xl border p-4 ${item.readAt ? "border-graphite-100 bg-white" : "border-accent-200 bg-accent-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => !item.readAt && markRead(item.id)} className="flex-1 text-left">
                <div className="flex items-start justify-between gap-3"><strong className="text-sm text-graphite-900">{item.title}</strong>{!item.readAt && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500" />}</div>
                <p className="mt-1 text-sm text-graphite-600">{item.body}</p>
                <p className="mt-2 text-xs text-graphite-400">{formatDateTime(new Date(item.createdAt))}</p>
              </button>
              <button onClick={() => deleteNotification(item.id)} aria-label="Benachrichtigung löschen" className="shrink-0 rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-100 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-2xl border border-graphite-100 bg-white p-8 text-center text-sm text-graphite-500">Noch keine Benachrichtigungen.</div>}
      </div>
    </div>
  );
}
