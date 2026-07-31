"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FavoriteButton({ trailerId, initialFavorited = false }: { trailerId: string; initialFavorited?: boolean }) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/favorites${isFavorited ? `?trailerId=${trailerId}` : ""}`, {
        method: isFavorited ? "DELETE" : "POST",
        headers: isFavorited ? undefined : { "Content-Type": "application/json" },
        body: isFavorited ? undefined : JSON.stringify({ trailerId }),
      });
      if (res.status === 401) {
        toast.error("Bitte melden Sie sich an, um Favoriten hinzuzufügen");
        return;
      }
      if (!res.ok) {
        toast.error("Favoriten konnten nicht aktualisiert werden");
        return;
      }
      setIsFavorited((v) => !v);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-graphite-700 backdrop-blur hover:text-accent-500"
      aria-label={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      aria-pressed={isFavorited}
    >
      <Heart size={16} className={cn(isFavorited && "fill-accent-500 text-accent-500")} />
    </button>
  );
}
