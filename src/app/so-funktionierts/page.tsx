import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CtaSection } from "@/components/home/CtaSection";
import { FileEdit, BadgeCheck, Euro, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "So funktioniert's",
  description: "So funktioniert Raspon — für Mieter und Vermieter, Schritt für Schritt erklärt.",
};

const OWNER_STEPS = [
  {
    icon: FileEdit,
    title: "Anzeige erstellen",
    description: "Fotos, technische Daten und Preis in wenigen Minuten hinterlegen.",
  },
  {
    icon: BadgeCheck,
    title: "Wird geprüft",
    description: "Unser Team prüft Ihre Anzeige und den Fahrzeugschein, bevor sie live geht.",
  },
  {
    icon: Euro,
    title: "Anhänger vermieten",
    description: "Mieter buchen und bezahlen direkt online — Sie legen Preis und Verfügbarkeit fest.",
  },
  {
    icon: Wallet,
    title: "Geld erhalten",
    description: "Nach erfolgreicher Vermietung fordern Sie Ihre Auszahlung im Dashboard an.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 text-center lg:py-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            So funktioniert&apos;s
          </span>
          <h1 className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-graphite-900 sm:text-5xl">
            Anhänger mieten und vermieten — einfach erklärt
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-graphite-600">
            Egal ob Sie einen Anhänger für Ihren nächsten Umzug brauchen oder Ihren eigenen vermieten möchten —
            so läuft es bei Raspon ab.
          </p>
        </section>

        <HowItWorks />

        <section className="py-16 lg:py-24">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-graphite-900 sm:text-4xl">
                Für Vermieter
              </h2>
              <p className="mt-3 text-graphite-600">So verdienen Sie Geld mit Ihrem Anhänger.</p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {OWNER_STEPS.map((item, i) => (
                <div key={item.title} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-graphite-50 shadow-soft">
                    <item.icon size={26} className="text-accent-500" />
                  </div>
                  <span className="mt-4 block font-display text-sm font-bold text-accent-500">
                    SCHRITT {i + 1}
                  </span>
                  <h3 className="mt-1 font-semibold text-graphite-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-graphite-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
