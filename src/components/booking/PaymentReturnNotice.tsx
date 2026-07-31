"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LoaderCircle } from "lucide-react";

export function PaymentReturnNotice({ paymentResult, paid }: { paymentResult?: string; paid: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!paymentResult || paid || paymentResult === "failed" || paymentResult === "verification-error") return;
    let refreshes = 0;
    const timer = window.setInterval(() => {
      router.refresh();
      refreshes += 1;
      if (refreshes >= 15) window.clearInterval(timer);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [paid, paymentResult, router]);

  if (!paymentResult || paid) return null;
  if (paymentResult === "failed" || paymentResult === "verification-error") {
    return <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={20} />Die Zahlung konnte nicht bestätigt werden. Es wurde nichts doppelt belastet; Sie können die Zahlung erneut öffnen.</div>;
  }
  return <div className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800"><LoaderCircle className="animate-spin" size={20} />Die Zahlung wird sicher bestätigt. Diese Seite aktualisiert sich automatisch.</div>;
}
