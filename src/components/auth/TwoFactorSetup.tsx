"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function TwoFactorSetup() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/two-factor/setup", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Einrichtung konnte nicht gestartet werden");
        setSecret(data.secret);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/two-factor/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Code konnte nicht bestätigt werden");
    setRecoveryCodes(data.recoveryCodes);
  }

  if (recoveryCodes) return (
    <section className="w-full max-w-lg rounded-2xl border border-graphite-100 bg-white p-7 shadow-sm">
      <h1 className="font-display text-2xl font-bold">2FA ist aktiviert</h1>
      <p className="mt-3 text-sm text-graphite-600">Speichern Sie diese Einmalcodes jetzt an einem sicheren Ort. Sie werden nicht erneut angezeigt.</p>
      <pre className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-graphite-50 p-4 text-sm">{recoveryCodes.join("\n")}</pre>
      <button className="btn-primary mt-6 h-11 w-full" onClick={() => { router.push("/admin"); router.refresh(); }}>Weiter zum Admin-Panel</button>
    </section>
  );

  return (
    <section className="w-full max-w-lg rounded-2xl border border-graphite-100 bg-white p-7 shadow-sm">
      <h1 className="font-display text-2xl font-bold">Zwei-Faktor-Schutz einrichten</h1>
      <p className="mt-3 text-sm text-graphite-600">Fügen Sie in Ihrer Authenticator-App ein zeitbasiertes Konto hinzu und geben Sie anschließend den sechsstelligen Code ein.</p>
      {loading ? <p className="mt-6 text-sm">Sicherheitskonfiguration wird erstellt…</p> : secret && (
        <div className="mt-6 rounded-xl bg-graphite-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-graphite-500">Manueller Schlüssel</p>
          <code className="mt-2 block break-all text-base font-bold tracking-wider">{secret}</code>
        </div>
      )}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <form onSubmit={confirm} className="mt-5 space-y-4">
        <label className="block"><span className="mb-1.5 block text-sm font-medium">Sicherheitscode</span><input className="input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required /></label>
        <button className="btn-primary h-11 w-full" disabled={loading || code.length !== 6}>Aktivieren</button>
      </form>
    </section>
  );
}
