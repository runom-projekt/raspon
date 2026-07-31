"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ActionButton({
  endpoint,
  method = "PATCH",
  body,
  label,
  variant = "outline",
}: {
  endpoint: string;
  method?: "PATCH" | "DELETE" | "POST";
  body?: Record<string, unknown>;
  label: string;
  variant?: "outline" | "danger";
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Aktion fehlgeschlagen");
        return;
      }
      toast.success("Erledigt");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSubmitting}
      className={
        variant === "danger"
          ? "rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          : "rounded-full border border-graphite-200 px-3 py-1 text-xs font-semibold hover:border-graphite-900"
      }
    >
      {label}
    </button>
  );
}
