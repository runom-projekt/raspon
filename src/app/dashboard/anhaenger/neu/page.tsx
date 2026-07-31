import type { Metadata } from "next";
import { TrailerForm } from "@/components/dashboard/TrailerForm";

export const metadata: Metadata = { title: "Anhänger hinzufügen" };

export default function NewTrailerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-graphite-900">Neuen Anhänger hinzufügen</h1>
      <p className="mt-1 text-sm text-graphite-500">
        Füllen Sie die folgenden Angaben aus. Ihre Anzeige wird nach Prüfung durch unser Team veröffentlicht.
      </p>
      <div className="mt-8">
        <TrailerForm />
      </div>
    </div>
  );
}
