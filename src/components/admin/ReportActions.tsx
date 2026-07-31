"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ReportActions({ reportId, hasTrailer }: { reportId: string; hasTrailer: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState(""), [suspend, setSuspend] = useState(false), [pending, setPending] = useState(false);
  async function decide(status: "IN_REVIEW" | "RESOLVED" | "DISMISSED") {
    if (status !== "IN_REVIEW" && !note.trim()) { toast.error("Bitte Entscheidung begründen"); return; }
    setPending(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, resolutionNote: note.trim() || undefined, suspendTrailer: status === "RESOLVED" && suspend }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Meldung konnte nicht bearbeitet werden");
      toast.success("Meldung aktualisiert"); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Meldung konnte nicht bearbeitet werden"); }
    finally { setPending(false); }
  }
  return <div className="mt-4"><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Interne Begründung / Ergebnis" className="input min-h-20"/>{hasTrailer && <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={suspend} onChange={(e) => setSuspend(e.target.checked)}/> Anzeige bei bestätigtem Verstoß sperren</label>}<div className="mt-3 flex flex-wrap gap-2"><button disabled={pending} onClick={() => decide("IN_REVIEW")} className="rounded-full border px-3 py-1 text-xs font-semibold">Prüfung starten</button><button disabled={pending} onClick={() => decide("RESOLVED")} className="rounded-full border px-3 py-1 text-xs font-semibold">Lösen</button><button disabled={pending} onClick={() => decide("DISMISSED")} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">Ablehnen</button></div></div>;
}
