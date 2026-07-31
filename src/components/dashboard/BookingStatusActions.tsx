"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BookingStatus } from "@prisma/client";

const nextActions: Partial<Record<BookingStatus, { label: string; status: BookingStatus }[]>> = {
  PENDING: [{ label: "Ablehnen", status: "DECLINED" }],
  CONFIRMED: [{ label: "Als abgeholt markieren", status: "ACTIVE" }],
  ACTIVE: [{ label: "Als zurückgegeben markieren", status: "COMPLETED" }],
};

export function BookingStatusActions({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const actions = nextActions[status];

  if (!actions) return <span className="text-xs text-graphite-400">—</span>;

  async function updateStatus(newStatus: BookingStatus) {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Buchung konnte nicht aktualisiert werden");
        return;
      }
      toast.success("Buchungsstatus aktualisiert");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
        <button
          key={action.status}
          disabled={isSubmitting}
          onClick={() => updateStatus(action.status)}
          className="rounded-full border border-graphite-200 px-3 py-1 text-xs font-semibold hover:border-graphite-900"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
