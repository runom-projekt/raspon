"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Die Anfrage konnte nicht verarbeitet werden.");
        return;
      }
      setMessage(data.deliveryDelayed
        ? "Der E-Mail-Versand ist derzeit verzögert. Ihre Anfrage wurde sicher gespeichert und wird automatisch zugestellt, sobald der Dienst wieder verfügbar ist."
        : data.message);
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (message) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {message}
        </div>
        <Link href="/anmelden" className="btn-primary flex h-12 w-full items-center justify-center">
          Zurück zur Anmeldung
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">E-Mail-Adresse</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input"
          autoComplete="email"
        />
      </label>
      <button type="submit" disabled={isSubmitting} className="btn-primary h-12 w-full">
        {isSubmitting ? "Wird gesendet…" : "Link anfordern"}
      </button>
    </form>
  );
}
