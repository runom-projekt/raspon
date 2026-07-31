"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Das Passwort konnte nicht geändert werden.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Der Link ist unvollständig. Bitte fordern Sie einen neuen an.
        </div>
        <Link href="/passwort-vergessen" className="btn-primary flex h-12 w-full items-center justify-center">
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          Ihr Passwort wurde geändert. Sie können sich jetzt anmelden.
        </div>
        <Link href="/anmelden" className="btn-primary flex h-12 w-full items-center justify-center">
          Zur Anmeldung
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
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Neues Passwort</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input pr-11"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400"
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <span className="mt-1 block text-xs text-graphite-500">
          Mindestens 8 Zeichen, ein Großbuchstabe und eine Ziffer.
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Passwort wiederholen</span>
        <input
          type="password"
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="input"
          autoComplete="new-password"
        />
      </label>
      <button type="submit" disabled={isSubmitting} className="btn-primary h-12 w-full">
        {isSubmitting ? "Wird gespeichert…" : "Passwort speichern"}
      </button>
    </form>
  );
}
