"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function BlockDatesForm({ trailerId }: { trailerId: string }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trailers/${trailerId}/blocked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Termin konnte nicht blockiert werden");
        return;
      }
      toast.success("Termin blockiert");
      setStartDate("");
      setEndDate("");
      setReason("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Von</span>
        <input
          required
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input h-10 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Bis</span>
        <input
          required
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input h-10 text-sm"
        />
      </label>
      <label className="block flex-1">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Grund (optional)</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="z.B. Wartung"
          className="input h-10 text-sm"
        />
      </label>
      <button type="submit" disabled={isSubmitting} className="btn-secondary h-10 px-5 text-sm">
        Blockieren
      </button>
    </form>
  );
}
