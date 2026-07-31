import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BadgeCheck, Lock, UserCheck, Star, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Sicherheit",
  description: "Wie Raspon für Sicherheit sorgt: geprüfte Anzeigen, Identitätsprüfung, sichere Zahlungen und Bewertungen.",
};

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Geprüfte Anzeigen",
    description:
      "Jeder Anhänger wird zusammen mit dem Fahrzeugschein von unserem Team geprüft, bevor die Anzeige veröffentlicht wird.",
  },
  {
    icon: UserCheck,
    title: "Identitätsprüfung",
    description:
      "Bevor Vermieter eine Auszahlung erhalten, verifizieren wir einmalig ihre Identität anhand eines Ausweisdokuments.",
  },
  {
    icon: Lock,
    title: "Sichere Zahlungen",
    description:
      "Zahlungen laufen über eine gesicherte Zahlungsabwicklung — Ihre Zahlungsdaten liegen nie offen bei Raspon oder dem Vermieter.",
  },
  {
    icon: Star,
    title: "Bewertungen",
    description:
      "Nach jeder Vermietung können Mieter eine Bewertung hinterlassen — so bleibt die Qualität auf der Plattform transparent.",
  },
  {
    icon: ShieldAlert,
    title: "Meldefunktion",
    description:
      "Verdächtige Anzeigen oder Verhalten können jederzeit gemeldet werden und werden von unserem Team geprüft.",
  },
];

export default function SafetyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 text-center lg:py-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Sicherheit
          </span>
          <h1 className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-graphite-900 sm:text-5xl">
            Vertrauen ist die Grundlage jeder Vermietung
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-graphite-600">
            Von der ersten Anzeige bis zur Auszahlung — so schaffen wir eine sichere Umgebung für Mieter und
            Vermieter.
          </p>
        </section>

        <section className="pb-16 lg:pb-24">
          <div className="container-page grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-graphite-100 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
                  <item.icon size={22} />
                </span>
                <h3 className="mt-4 font-semibold text-graphite-900">{item.title}</h3>
                <p className="mt-2 text-sm text-graphite-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container-page pb-16 lg:pb-24">
          <div className="mx-auto max-w-2xl rounded-2xl border border-graphite-100 p-8 text-center sm:p-10">
            <h2 className="font-display text-2xl font-bold text-graphite-900">Etwas verdächtig?</h2>
            <p className="mt-3 text-graphite-600">
              Melden Sie uns auffällige Anzeigen oder Nutzer — wir prüfen jede Meldung.
            </p>
            <Link href="/kontakt" className="mt-6 inline-block font-semibold text-accent-600 underline">
              Support kontaktieren
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
