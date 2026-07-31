"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { ImageUploadField } from "@/components/ui/ImageUploadField";

interface PayoutActionsProps {
  outstanding: number;
  pending: number;
  isIdVerified: boolean;
  identitySubmitted: boolean;
}

export function PayoutActions({ outstanding, pending, isIdVerified, identitySubmitted }: PayoutActionsProps) {
  const router = useRouter();
  const [documentUrl, setDocumentUrl] = useState("");
  const [isSubmittingId, setIsSubmittingId] = useState(false);

  async function submitIdentityDocument() {
    if (!documentUrl) {
      toast.error("Bitte zuerst ein Dokument hochladen");
      return;
    }
    setIsSubmittingId(true);
    try {
      const res = await fetch("/api/account/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Einreichung fehlgeschlagen");
        return;
      }
      toast.success("Dokument eingereicht — wird geprüft");
      router.refresh();
    } finally {
      setIsSubmittingId(false);
    }
  }

  if (isIdVerified) {
    return (
      <div className="grid gap-4 rounded-xl border border-graphite-100 bg-graphite-50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-graphite-500">Zur Auszahlung vorgemerkt</p>
          <p className="text-lg font-semibold text-graphite-900">{formatCurrency(pending)}</p>
        </div>
        <div>
          <p className="text-sm text-graphite-500">Wird automatisch vorgemerkt</p>
          <p className="text-lg font-semibold text-graphite-900">{formatCurrency(outstanding)}</p>
        </div>
        <p className="text-sm text-graphite-600 sm:col-span-2">
          Nach einer abgeschlossenen und bezahlten Vermietung wird Ihre Netto-Auszahlung automatisch erfasst. Eine manuelle Anforderung ist nicht erforderlich.
        </p>
      </div>
    );
  }

  if (identitySubmitted) {
    return (
      <div className="rounded-xl border border-graphite-100 bg-graphite-50 p-4 text-sm text-graphite-600">
        Ihre Identitätsprüfung wird derzeit geprüft. Nach der Bestätigung werden fällige Auszahlungen automatisch vorgemerkt.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-graphite-100 bg-graphite-50 p-4">
      <p className="text-sm text-graphite-600">
        Für Auszahlungen ist einmalig eine Identitätsprüfung erforderlich. Bitte laden Sie ein gültiges
        Ausweisdokument hoch.
      </p>
      <div className="mt-4">
        <ImageUploadField folder="identity" value={documentUrl} onChange={setDocumentUrl} />
      </div>
      <button
        type="button"
        onClick={submitIdentityDocument}
        disabled={isSubmittingId || !documentUrl}
        className="btn-primary mt-4 h-10 px-6 text-sm disabled:opacity-50"
      >
        {isSubmittingId ? "Wird eingereicht…" : "Zur Prüfung einreichen"}
      </button>
    </div>
  );
}
