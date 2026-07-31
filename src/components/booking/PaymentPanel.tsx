"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Wallet, Smartphone } from "lucide-react";

const methods = [
  { id: "card", label: "Karte", icon: CreditCard },
  { id: "revolut_pay", label: "Revolut Pay", icon: Wallet },
  { id: "apple_pay", label: "Apple Pay", icon: Smartphone },
  { id: "google_pay", label: "Google Pay", icon: Smartphone },
];

export function PaymentPanel({ bookingId }: { bookingId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePay() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Zahlung konnte nicht gestartet werden");
        return;
      }
      window.location.href = data.url;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-graphite-100 bg-white p-6">
      <h2 className="font-semibold text-graphite-900">Zahlungsmethode wählen</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {methods.map((m) => (
          <div
            key={m.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-graphite-200 p-4 text-xs font-medium text-graphite-600"
          >
            <m.icon size={20} />
            {m.label}
          </div>
        ))}
      </div>
      <button onClick={handlePay} disabled={isSubmitting} className="btn-primary mt-5 h-12 w-full">
        {isSubmitting ? "Weiterleitung…" : "Zur Zahlung"}
      </button>
      <p className="mt-3 text-center text-xs text-graphite-400">
        Sichere Weiterleitung zu hms-runo.de · Abwicklung über Revolut · 3-D Secure.
      </p>
    </div>
  );
}
