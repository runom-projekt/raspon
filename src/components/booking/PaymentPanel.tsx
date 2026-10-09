"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Landmark, WalletCards } from "lucide-react";

type Method = "PAYPAL" | "BANK_TRANSFER";
type Transfer = { accountHolder: string; iban: string; bic: string | null; reference: string; expiresAt: string };

export function PaymentPanel({ bookingId }: { bookingId: string }) {
  const [method, setMethod] = useState<Method>("PAYPAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transfer, setTransfer] = useState<Transfer | null>(null);

  async function handlePay() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checkout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method }) });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error ?? "Zahlung konnte nicht gestartet werden");
      if (data.method === "BANK_TRANSFER") {
        setTransfer(data.transfer);
        toast.success("Überweisungsdaten wurden erstellt");
      } else window.location.href = data.url;
    } catch {
      toast.error("Zahlung konnte nicht gestartet werden");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-graphite-100 bg-white p-6">
      <h2 className="font-semibold text-graphite-900">Zahlungsmethode wählen</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => { setMethod("PAYPAL"); setTransfer(null); }} className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold ${method === "PAYPAL" ? "border-accent-500 bg-accent-50 text-accent-700" : "border-graphite-200 text-graphite-600"}`}>
          <WalletCards size={20} /> PayPal
        </button>
        <button type="button" onClick={() => setMethod("BANK_TRANSFER")} className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold ${method === "BANK_TRANSFER" ? "border-accent-500 bg-accent-50 text-accent-700" : "border-graphite-200 text-graphite-600"}`}>
          <Landmark size={20} /> Überweisung
        </button>
      </div>
      <button onClick={handlePay} disabled={isSubmitting} className="btn-primary mt-5 h-12 w-full">
        {isSubmitting ? "Wird vorbereitet…" : method === "PAYPAL" ? "Weiter zu PayPal" : "Überweisungsdaten anzeigen"}
      </button>
      {transfer && (
        <dl className="mt-5 space-y-2 rounded-xl bg-graphite-50 p-4 text-sm">
          <div><dt className="text-graphite-500">Empfänger</dt><dd className="font-semibold">{transfer.accountHolder}</dd></div>
          <div><dt className="text-graphite-500">IBAN</dt><dd className="break-all font-mono font-semibold">{transfer.iban}</dd></div>
          {transfer.bic && <div><dt className="text-graphite-500">BIC</dt><dd className="font-mono">{transfer.bic}</dd></div>}
          <div><dt className="text-graphite-500">Verwendungszweck</dt><dd className="font-mono font-bold">{transfer.reference}</dd></div>
          <p className="pt-2 text-xs text-graphite-500">Die Buchung wird nach Zahlungseingang bestätigt. Bitte verwenden Sie exakt den angegebenen Verwendungszweck.</p>
        </dl>
      )}
      <p className="mt-3 text-center text-xs text-graphite-400">PayPal-Zahlungen werden bei PayPal verarbeitet. Überweisungen werden nach Geldeingang bestätigt.</p>
    </div>
  );
}
