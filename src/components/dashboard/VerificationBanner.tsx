"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export function VerificationBanner() {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setIsSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Bestätigungslink konnte nicht gesendet werden");
        return;
      }
      setSent(true);
      toast.success("Bestätigungslink gesendet");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <div className="flex items-center gap-2">
        <Mail size={18} className="shrink-0" />
        <span>Bitte bestätigen Sie Ihre E-Mail-Adresse, um alle Funktionen nutzen zu können.</span>
      </div>
      <button
        type="button"
        onClick={handleResend}
        disabled={isSending || sent}
        className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        {sent ? "Link gesendet" : isSending ? "Wird gesendet…" : "Bestätigungslink erneut senden"}
      </button>
    </div>
  );
}
