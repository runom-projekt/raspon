"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

export function ReportTrailerButton({ trailerId, signedIn }: { trailerId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false), [reason, setReason] = useState("MISLEADING"), [details, setDetails] = useState("");
  async function submit() {
    if (!signedIn) { window.location.href = `/anmelden?returnTo=${encodeURIComponent(window.location.pathname)}`; return; }
    setPending(true);
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trailerId, reason, details: details.trim() || undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Meldung konnte nicht gesendet werden");
      toast.success("Meldung wurde sicher übermittelt"); setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Meldung konnte nicht gesendet werden"); }
    finally { setPending(false); }
  }
  return <div className="mt-4">{!open ? <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm text-graphite-500 hover:text-red-600"><Flag size={16} /> Anzeige melden</button> : <div className="rounded-xl border border-graphite-200 bg-white p-4 text-left"><label className="text-sm font-medium">Grund<select value={reason} onChange={(e) => setReason(e.target.value)} className="input mt-1"><option value="MISLEADING">Irreführende Angaben</option><option value="FRAUD">Betrugsverdacht</option><option value="UNSAFE">Unsichere Anzeige</option><option value="DUPLICATE">Doppelte Anzeige</option><option value="OTHER">Anderer Grund</option></select></label><textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} placeholder="Optionale Details" className="input mt-3 min-h-24"/><div className="mt-3 flex gap-2"><button onClick={submit} disabled={pending} className="btn-primary px-4 py-2 text-sm">{pending ? "Wird gesendet…" : "Meldung senden"}</button><button onClick={() => setOpen(false)} className="px-3 text-sm">Abbrechen</button></div></div>}</div>;
}
