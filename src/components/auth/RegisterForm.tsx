"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FIELD_LABELS: Record<string, string> = {
  firstName: "Vorname",
  lastName: "Nachname",
  email: "E-Mail-Adresse",
  phone: "Telefonnummer",
  password: "Passwort",
};

function describeIssues(issues: unknown): string | null {
  const fieldErrors = (issues as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors;
  if (!fieldErrors) return null;
  const messages = Object.entries(fieldErrors)
    .filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length))
    .map(([field, msgs]) => (field === "email" || field === "phone" ? msgs[0] : `${FIELD_LABELS[field] ?? field}: ${msgs[0]}`));
  return messages.length > 0 ? messages.join(" · ") : null;
}

export function RegisterForm({ returnTo = "/", initialRole = "CUSTOMER" }: { returnTo?: string; initialRole?: "CUSTOMER" | "OWNER" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: initialRole as "CUSTOMER" | "OWNER",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.email && !form.phone) {
      setError("Bitte E-Mail-Adresse oder Telefonnummer angeben");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data && describeIssues(data.issues)) ?? data?.error ?? "Konto konnte nicht erstellt werden");
        return;
      }
      if (data.emailSent) {
        toast.success("Konto erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link, den wir Ihnen gesendet haben.");
      } else {
        toast.success("Konto erstellt. Willkommen bei Raspon!");
      }
      router.push(returnTo !== "/" ? returnTo : form.role === "OWNER" ? "/dashboard" : "/");
      router.refresh();
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-graphite-700">Vorname</span>
          <input
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-graphite-700">Nachname</span>
          <input
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="input"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-graphite-700">E-Mail-Adresse</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-graphite-700">Telefonnummer</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input"
            autoComplete="tel"
            placeholder="+49 176 1234567"
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-graphite-400">Mindestens eine der beiden Angaben ist erforderlich.</p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Passwort</span>
        <input
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="input"
          autoComplete="new-password"
        />
        <span className="mt-1 block text-xs text-graphite-400">
          Mind. 8 Zeichen, ein Großbuchstabe und eine Ziffer
        </span>
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Ich möchte</span>
        <div className="grid grid-cols-2 gap-3">
          {(["CUSTOMER", "OWNER"] as const).map((role) => (
            <button
              type="button"
              key={role}
              onClick={() => setForm({ ...form, role })}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm font-semibold",
                form.role === role
                  ? "border-graphite-900 bg-graphite-900 text-white"
                  : "border-graphite-200 text-graphite-700"
              )}
            >
              {role === "CUSTOMER" ? "Anhänger mieten" : "Mit meinem Anhänger Geld verdienen"}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary h-12 w-full">
        {isSubmitting ? "Konto wird erstellt…" : "Konto erstellen"}
      </button>

      <p className="text-center text-xs text-graphite-400">
        Mit der Kontoerstellung akzeptieren Sie die <a href="/agb" className="underline">AGB</a> und{" "}
        <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
      </p>
    </form>
  );
}
