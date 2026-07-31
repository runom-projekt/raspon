import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CtaSection } from "@/components/home/CtaSection";
import { Heart, ShieldCheck, Leaf, Headset } from "lucide-react";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Raspon ist die europäische Plattform für Anhängervermietung — wir verbinden Anhängerbesitzer mit Menschen, die kurzfristig einen Anhänger brauchen.",
};

const VALUES = [
  {
    icon: Heart,
    title: "Einfachheit",
    description: "Vom Suchen bis zum Buchen — alles läuft digital, ohne Papierkram und ohne Umwege.",
  },
  {
    icon: ShieldCheck,
    title: "Vertrauen",
    description: "Verifizierte Vermieter, geprüfte Anzeigen und sichere Zahlungen für beide Seiten.",
  },
  {
    icon: Leaf,
    title: "Nachhaltigkeit",
    description: "Geteilte Anhänger bedeuten weniger Neuanschaffungen und bessere Auslastung vorhandener Ressourcen.",
  },
  {
    icon: Headset,
    title: "Support",
    description: "Wir sind erreichbar, wenn es mal hakt — vor, während und nach der Buchung.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 text-center lg:py-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Über Raspon
          </span>
          <h1 className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-graphite-900 sm:text-5xl">
            Anhänger mieten, ohne einen besitzen zu müssen
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-graphite-600">
            Die meisten Anhänger stehen die meiste Zeit ungenutzt in der Garage. Raspon bringt Besitzer und
            Menschen, die kurzfristig einen Anhänger brauchen, digital und unkompliziert zusammen.
          </p>

          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-graphite-100 pt-8">
            <div>
              <dt className="text-2xl font-bold text-graphite-900 sm:text-3xl">12.000+</dt>
              <dd className="mt-1 text-sm text-graphite-500">Anhänger im Angebot</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-graphite-900 sm:text-3xl">98%</dt>
              <dd className="mt-1 text-sm text-graphite-500">zufriedene Kunden</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-graphite-900 sm:text-3xl">150+</dt>
              <dd className="mt-1 text-sm text-graphite-500">Städte in Deutschland</dd>
            </div>
          </dl>
        </section>

        <section className="bg-graphite-50 py-16 lg:py-24">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-graphite-900 sm:text-4xl">
                Wofür wir stehen
              </h2>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((item) => (
                <div key={item.title} className="rounded-2xl border border-graphite-100 bg-white p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
                    <item.icon size={22} />
                  </span>
                  <h3 className="mt-4 font-semibold text-graphite-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-graphite-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-16 lg:py-24">
          <div className="mx-auto max-w-3xl rounded-2xl border border-graphite-100 p-8 sm:p-10">
            <h2 className="font-display text-2xl font-bold text-graphite-900">Wer wir sind</h2>
            <p className="mt-4 text-graphite-600">
              Raspon wird von HMS Runo betrieben und mit dem Ziel entwickelt, Anhängervermietung in Deutschland so
              einfach zu machen wie eine Hotelbuchung. Statt einen Anhänger zu kaufen und ihn 350 Tage im Jahr
              ungenutzt zu lassen, verbinden wir Besitzer mit Mietern in ihrer Nähe — sicher, digital und fair.
            </p>
          </div>
        </section>

        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
