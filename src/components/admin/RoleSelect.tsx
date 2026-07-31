"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";

const ROLES: UserRole[] = ["CUSTOMER", "OWNER", "ADMIN"];

export function RoleSelect({ userId, role }: { userId: string; role: UserRole }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChange(nextRole: string) {
    if (nextRole === role) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Rolle konnte nicht geändert werden");
        return;
      }
      toast.success("Rolle aktualisiert");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <select
      defaultValue={role}
      disabled={isSubmitting}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-full border border-graphite-200 bg-white px-2.5 py-1 text-xs font-semibold text-graphite-700 hover:border-graphite-900 disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
