"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ConfirmBankTransferButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button type="button" disabled={busy} onClick={async () => {
    if (!window.confirm("Zahlungseingang für diese Buchung verbindlich bestätigen?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-bank-transfer`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) return toast.error(data.error ?? "Bestätigung fehlgeschlagen");
      toast.success("Zahlung bestätigt"); router.refresh();
    } finally { setBusy(false); }
  }} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Wird bestätigt…" : "Eingang bestätigen"}</button>;
}
