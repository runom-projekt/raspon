"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function VerifyIdentityButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-identity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Aktion fehlgeschlagen");
        return;
      }
      toast.success("Identität verifiziert");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSubmitting}
      className="rounded-full border border-graphite-200 px-3 py-1 text-xs font-semibold hover:border-graphite-900"
    >
      Verifizieren
    </button>
  );
}
