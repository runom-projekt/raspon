import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, FileText, Car } from "lucide-react";

export const metadata: Metadata = {
  title: "Versicherung",
  description: "So schützen Kaution, Verifizierung und Prüfungen Vermieter und Mieter bei Raspon.",
};

const POINTS = [
  {
    icon: FileText,
    title: "Kaution",
    description:
      "Viele Vermieter legen für ihren Anhänger eine Kaution fest. Sie wird bei der Buchung ausgewiesen und dient als Sicherheit für den Zustand des Anhängers während der Mietzeit.",
  },
  {
    icon: ShieldCheck,
    title: "Geprüfte Anzeigen",
    description:
      "Jeder Anhänger wird vor Veröffentlichung inklusive Fahrzeugschein von unserem Team geprüft — so wissen Sie, dass die Angaben zum Fahrzeug stimmen.",
  },
  {
    icon: Car,
    title: "Eigene Fahrzeugversicherung prüfen",
    description:
      "Ob und wie das Ziehen eines gemieteten Anhängers über Ihre eigene Kfz-Haftpflicht abgedeckt ist, hängt von Ihrem Versicherer ab. Klären Sie das am besten vorab direkt mit Ihrer Versicherung.",
  },
];

export default function InsurancePage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 text-center lg:py-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Versicherung &amp; Kaution
          </span>
          <h1 className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-graphite-900 sm:text-5xl">
            Sicher unterwegs mit Ihrem gemieteten Anhänger
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-graphite-600">
            Raspon selbst ist kein Versicherer. Kaution, geprüfte Anzeigen und Verifizierung sorgen aber dafür,
            dass beide Seiten fair abgesichert sind.
          </p>
        </section>

        <section className="bg-graphite-50 py-16 lg:py-24">
          <div className="container-page">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {POINTS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-graphite-100 bg-white p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
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
          <div className="mx-auto max-w-2xl rounded-2xl border border-graphite-100 p-8 text-center sm:p-10">
            <h2 className="font-display text-2xl font-bold text-graphite-900">Fragen zur Kaution oder einem Schaden?</h2>
            <p className="mt-3 text-graphite-600">
              Wenden Sie sich an unseren Support — wir helfen bei der Klärung zwischen Mieter und Vermieter.
            </p>
            <Link href="/kontakt" className="mt-6 inline-block font-semibold text-accent-600 underline">
              Zum Kontakt
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
