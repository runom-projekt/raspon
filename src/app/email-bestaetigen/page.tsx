"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Kein Bestätigungslink angegeben.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setStatus("error");
          setError(data?.error ?? "Bestätigung fehlgeschlagen");
          return;
        }
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
        setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      });
  }, [token]);

  return (
    <AuthCard
      title="E-Mail-Bestätigung"
      subtitle="Wir bestätigen Ihre E-Mail-Adresse."
      footer={
        <Button href="/" variant="ghost" size="sm">
          Zur Startseite
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin text-graphite-400" />
            <p className="text-sm text-graphite-600">Bestätigung wird geprüft…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={32} className="text-emerald-500" />
            <p className="text-sm text-graphite-600">
              Ihre E-Mail-Adresse wurde erfolgreich bestätigt.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={32} className="text-red-500" />
            <p className="text-sm text-graphite-600">{error}</p>
          </>
        )}
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  );
}
