"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TRAILER_CATEGORIES, EQUIPMENT_OPTIONS } from "@/lib/constants";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import type { TrailerCategory } from "@prisma/client";

const FIELD_LABELS: Record<string, string> = {
  title: "Anzeigentitel",
  description: "Beschreibung",
  category: "Kategorie",
  manufacturer: "Hersteller",
  model: "Modell",
  productionYear: "Baujahr",
  weightKg: "Leergewicht",
  grossWeightKg: "Zulässiges Gesamtgewicht",
  payloadKg: "Nutzlast",
  lengthCm: "Länge",
  widthCm: "Breite",
  heightCm: "Höhe",
  vin: "Fahrgestellnummer (VIN)",
  pricePerHour: "Preis pro Stunde",
  pricePerDay: "Preis pro Tag",
  pricePerWeek: "Preis pro Woche",
  depositAmount: "Kaution",
  addressLine: "Adresse",
  city: "Stadt",
  postalCode: "Postleitzahl",
  latitude: "Breitengrad",
  longitude: "Längengrad",
  photos: "Fotos",
  registrationDocumentUrl: "Fahrzeugschein / Kfz-Brief",
};

function describeIssues(issues: unknown): string | null {
  const fieldErrors = (issues as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors;
  if (!fieldErrors) return null;
  const messages = Object.entries(fieldErrors)
    .filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length))
    .map(([field, msgs]) => `${FIELD_LABELS[field] ?? field}: ${msgs[0]}`);
  return messages.length > 0 ? messages.join(" · ") : null;
}

const initialState = {
  title: "",
  description: "",
  category: "CARGO" as TrailerCategory,
  manufacturer: "",
  model: "",
  productionYear: "",
  weightKg: "",
  grossWeightKg: "",
  payloadKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  vin: "",
  pricePerHour: "",
  pricePerDay: "",
  pricePerWeek: "",
  depositAmount: "0",
  addressLine: "",
  city: "",
  postalCode: "",
  country: "DE",
  latitude: "52.5200",
  longitude: "13.4050",
  equipment: [] as string[],
  photos: [] as string[],
  registrationDocumentUrl: "",
};

export function TrailerForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleEquipment(value: string) {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(value)
        ? f.equipment.filter((e) => e !== value)
        : [...f.equipment, value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.registrationDocumentUrl) {
      setError("Bitte laden Sie den Fahrzeugschein / Kfz-Brief hoch, bevor Sie fortfahren.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/trailers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          (data && describeIssues(data.issues)) ?? data?.error ?? "Anhänger konnte nicht hinzugefügt werden"
        );
        return;
      }
      toast.success("Anhänger hinzugefügt und zur Prüfung weitergeleitet");
      router.push("/dashboard/anhaenger");
      router.refresh();
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Grundinformationen</h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Anzeigentitel</span>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="z.B. Lastenanhänger 750kg mit Plane"
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Beschreibung</span>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Kategorie</span>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as TrailerCategory)}
              className="input appearance-none"
            >
              {Object.entries(TRAILER_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Technische Daten</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(
            [
              ["manufacturer", "Hersteller", "text"],
              ["model", "Modell", "text"],
              ["productionYear", "Baujahr", "number"],
              ["weightKg", "Leergewicht (kg)", "number"],
              ["grossWeightKg", "Zulässiges Gesamtgewicht (kg)", "number"],
              ["payloadKg", "Nutzlast (kg)", "number"],
              ["lengthCm", "Länge (cm)", "number"],
              ["widthCm", "Breite (cm)", "number"],
              ["heightCm", "Höhe (cm)", "number"],
              ["vin", "Fahrgestellnummer (VIN)", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-sm font-medium text-graphite-700">{label}</span>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                className="input"
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-graphite-400">
          Die Fahrgestellnummer wird nicht öffentlich angezeigt — sie dient ausschließlich der Verifizierung.
        </p>
      </section>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Ausstattung</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleEquipment(opt.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm",
                form.equipment.includes(opt.value)
                  ? "border-graphite-900 bg-graphite-900 text-white"
                  : "border-graphite-200 text-graphite-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Fotos</h2>
        <div className="mt-4">
          <MultiImageUploader folder="trailers" value={form.photos} onChange={(photos) => update("photos", photos)} />
        </div>
      </section>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Fahrzeugschein / Kfz-Brief</h2>
        <p className="mt-1 text-sm text-graphite-500">
          Wird ausschließlich zur Prüfung durch unser Team verwendet und nicht öffentlich angezeigt.
        </p>
        <div className="mt-4">
          <ImageUploadField
            folder="registration"
            value={form.registrationDocumentUrl}
            onChange={(url) => update("registrationDocumentUrl", url)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Preise und Kaution</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Preis / Stunde (€)</span>
            <input
              required
              type="number"
              step="0.01"
              value={form.pricePerHour}
              onChange={(e) => update("pricePerHour", e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Preis / Tag (€)</span>
            <input
              required
              type="number"
              step="0.01"
              value={form.pricePerDay}
              onChange={(e) => update("pricePerDay", e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Preis / Woche (€)</span>
            <input
              type="number"
              step="0.01"
              value={form.pricePerWeek}
              onChange={(e) => update("pricePerWeek", e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Kaution (€)</span>
            <input
              type="number"
              step="0.01"
              value={form.depositAmount}
              onChange={(e) => update("depositAmount", e.target.value)}
              className="input"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Standort</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="col-span-2 block sm:col-span-1">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Stadt</span>
            <input required value={form.city} onChange={(e) => update("city", e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Postleitzahl</span>
            <input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className="input" />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1.5 block text-sm font-medium text-graphite-700">Adresse (optional)</span>
            <input value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)} className="input" />
          </label>
        </div>
      </section>

      <button type="submit" disabled={isSubmitting} className="btn-primary h-12 w-full sm:w-auto sm:px-10">
        {isSubmitting ? "Wird gespeichert…" : "Anhänger zur Prüfung einreichen"}
      </button>
    </form>
  );
}
