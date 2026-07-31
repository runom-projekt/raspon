"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm({ returnTo = "/" }: { returnTo?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, twoFactorCode: requiresTwoFactor ? twoFactorCode : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Anmeldung fehlgeschlagen");
        return;
      }
      if (data.requiresTwoFactorSetup) {
        router.push("/2fa-einrichten");
        return;
      }
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTwoFactorCode("");
        return;
      }
      toast.success("Erfolgreich angemeldet");
      router.push(returnTo !== "/" ? returnTo : data.user.role === "ADMIN" ? "/admin" : data.user.role === "OWNER" ? "/dashboard" : "/");
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
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">E-Mail-Adresse oder Telefonnummer</span>
        <input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="input"
          autoComplete="username"
        />
      </label>
      {requiresTwoFactor && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-graphite-700">Authenticator- oder Wiederherstellungscode</span>
          <input
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase())}
            className="input"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
          />
        </label>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-graphite-700">Passwort</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pr-11"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400"
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <div className="flex justify-end">
        <a href="/passwort-vergessen" className="text-sm font-medium text-accent-600 hover:underline">
          Passwort vergessen?
        </a>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary h-12 w-full">
        {isSubmitting ? "Anmeldung läuft…" : "Anmelden"}
      </button>
    </form>
  );
}
