"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteUserButton({ userId, email }: { userId: string; email: string | null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (!window.confirm(`Konto „${email ?? userId}" endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Konto konnte nicht gelöscht werden");
        return;
      }
      toast.success("Konto gelöscht");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSubmitting}
      aria-label="Konto löschen"
      className="rounded-full border border-red-200 p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}
