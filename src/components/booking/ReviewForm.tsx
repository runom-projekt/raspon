"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment: comment.trim() || undefined }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return toast.error(data?.error ?? "Bewertung konnte nicht gespeichert werden");
      toast.success("Vielen Dank für Ihre Bewertung");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-graphite-100 bg-white p-6">
      <h2 className="font-display text-lg font-bold text-graphite-900">Vermietung bewerten</h2>
      <p className="mt-1 text-sm text-graphite-500">Ihre Erfahrung hilft anderen Mietern.</p>
      <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Bewertung">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} von 5 Sternen`} onClick={() => setRating(value)} className="p-1">
            <Star size={28} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-graphite-300"} />
          </button>
        ))}
      </div>
      <textarea className="input mt-4 min-h-28 resize-y" maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optionaler Kommentar" />
      <button className="btn-primary mt-4 h-11 px-6" disabled={submitting || rating === 0}>{submitting ? "Wird gespeichert…" : "Bewertung veröffentlichen"}</button>
    </form>
  );
}
