"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function NewDiscountCodeForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    percentOff: "",
    validFrom: "",
    validTo: "",
    maxUses: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Code konnte nicht hinzugefügt werden");
        return;
      }
      toast.success("Rabattcode hinzugefügt");
      setForm({ code: "", percentOff: "", validFrom: "", validTo: "", maxUses: "" });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-graphite-100 bg-white p-5">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Code</span>
        <input
          required
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          className="input h-10 w-36 text-sm uppercase"
          placeholder="SOMMER2026"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Rabatt (%)</span>
        <input
          required
          type="number"
          min={1}
          max={100}
          value={form.percentOff}
          onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
          className="input h-10 w-24 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Gültig ab</span>
        <input
          required
          type="date"
          value={form.validFrom}
          onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
          className="input h-10 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Gültig bis</span>
        <input
          required
          type="date"
          value={form.validTo}
          onChange={(e) => setForm({ ...form, validTo: e.target.value })}
          className="input h-10 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-graphite-700">Nutzungslimit</span>
        <input
          type="number"
          min={1}
          value={form.maxUses}
          onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          className="input h-10 w-24 text-sm"
        />
      </label>
      <button type="submit" disabled={isSubmitting} className="btn-secondary h-10 px-5 text-sm">
        Code hinzufügen
      </button>
    </form>
  );
}
