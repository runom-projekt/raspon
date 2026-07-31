"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface UserSettings {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isIdVerified: boolean;
}

export function SettingsForm({ user }: { user: UserSettings }) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Änderungen konnten nicht gespeichert werden");
        return;
      }
      toast.success("Änderungen gespeichert");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-graphite-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-graphite-900">Persönliche Daten</h2>
          {user.isIdVerified && (
            <span className="flex items-center gap-1 text-xs font-semibold text-accent-600">
              <ShieldCheck size={14} /> Verifiziert
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Vorname</span>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Nachname</span>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="input"
            />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">E-Mail</span>
            <input
              value={user.email ?? "Keine E-Mail-Adresse hinterlegt"}
              disabled
              className="input opacity-60"
            />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Telefon</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
            />
          </label>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary h-12 px-8">
        {isSubmitting ? "Wird gespeichert…" : "Änderungen speichern"}
      </button>
    </form>
  );
}
