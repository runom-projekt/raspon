"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CancellationPanel({ bookingId, paid }: { bookingId: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function cancel() {
    const warning = paid
      ? "Buchung wirklich stornieren? Die vollständige Rückzahlung wird automatisch veranlasst."
      : "Buchung wirklich stornieren? Der Termin wird sofort freigegeben.";
    if (!window.confirm(warning)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error ?? "Stornierung fehlgeschlagen");
      toast.success(paid ? "Storniert. Rückzahlung wurde beauftragt." : "Buchung storniert.");
      router.refresh();
    } finally { setBusy(false); }
  }
  return <button type="button" onClick={cancel} disabled={busy} className="mt-6 w-full rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{busy ? "Wird storniert…" : "Buchung stornieren"}</button>;
}
