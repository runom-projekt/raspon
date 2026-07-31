"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency, nightsBetween } from "@/lib/utils";

interface BookingWidgetProps {
  trailerId: string;
  pricePerDay: string;
  depositAmount: string;
  currency: string;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function BookingWidget({
  trailerId,
  pricePerDay,
  depositAmount,
  currency,
  initialStartDate = "",
  initialEndDate = "",
}: BookingWidgetProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return 0;
    return nightsBetween(start, end);
  }, [startDate, endDate]);

  const subtotal = days * parseFloat(pricePerDay);
  const deposit = parseFloat(depositAmount);
  const total = subtotal + deposit;

  async function handleReserve() {
    if (!days) {
      toast.error("Bitte wählen Sie einen gültigen Zeitraum");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trailerId, startDate, endDate }),
      });
      const data = await res.json();
      if (res.status === 401) {
        const returnTo = `${window.location.pathname}?${new URLSearchParams({ startDate, endDate })}`;
        router.push(`/anmelden?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "Buchung konnte nicht erstellt werden");
        return;
      }
      toast.success("Buchung erstellt! Sie werden zur Zahlung weitergeleitet…");
      router.push(`/buchungen/${data.booking.id}`);
    } catch {
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-graphite-100 p-6 shadow-card">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-graphite-900">
          {formatCurrency(pricePerDay, currency)}
        </span>
        <span className="text-sm text-graphite-500">/ Tag</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-graphite-200">
        <label className="border-r border-graphite-200 p-3">
          <span className="block text-[10px] font-semibold uppercase text-graphite-500">Abholung</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border-none p-0 text-sm text-graphite-900 focus:outline-none"
            aria-label="Abholdatum"
          />
        </label>
        <label className="p-3">
          <span className="block text-[10px] font-semibold uppercase text-graphite-500">Rückgabe</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border-none p-0 text-sm text-graphite-900 focus:outline-none"
            aria-label="Rückgabedatum"
          />
        </label>
      </div>

      <button
        onClick={handleReserve}
        disabled={isSubmitting}
        className="btn-primary mt-5 h-12 w-full"
      >
        {isSubmitting ? "Wird verarbeitet…" : "Jetzt buchen"}
      </button>

      {days > 0 && (
        <dl className="mt-5 space-y-2 border-t border-graphite-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-graphite-600">
              {formatCurrency(pricePerDay, currency)} × {days} {days === 1 ? "Tag" : "Tage"}
            </dt>
            <dd className="text-graphite-900">{formatCurrency(subtotal, currency)}</dd>
          </div>
          {deposit > 0 && (
            <div className="flex justify-between">
              <dt className="text-graphite-600">Rückzahlbare Kaution</dt>
              <dd className="text-graphite-900">{formatCurrency(deposit, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-graphite-100 pt-2 font-bold">
            <dt>Gesamt</dt>
            <dd>{formatCurrency(total, currency)}</dd>
          </div>
        </dl>
      )}
      <p className="mt-4 text-center text-xs text-graphite-400">Es wird jetzt noch nichts abgebucht</p>
    </div>
  );
}
