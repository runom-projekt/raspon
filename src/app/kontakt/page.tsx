import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Phone, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktieren Sie das Raspon-Team telefonisch, per E-Mail oder Post.",
};

const CONTACT_METHODS = [
  {
    icon: Phone,
    title: "Telefon",
    value: "+49 176 2323 6768",
    href: "tel:+4917623236768",
  },
  {
    icon: Mail,
    title: "E-Mail",
    value: "kontakt@raspon.de",
    href: "mailto:kontakt@raspon.de",
  },
  {
    icon: MapPin,
    title: "Adresse",
    value: "Doomerstraße 4, 47877 Willich",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 text-center lg:py-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Kontakt
          </span>
          <h1 className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-graphite-900 sm:text-5xl">
            Wir helfen gerne weiter
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-graphite-600">
            Ob Frage zu einer Buchung, Ihrer Anzeige oder etwas anderem — schreiben oder rufen Sie uns an. Wir
            antworten in der Regel innerhalb von 1–2 Werktagen.
          </p>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
            {CONTACT_METHODS.map((item) => {
              const content = (
                <>
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
                    <item.icon size={22} />
                  </span>
                  <h3 className="mt-4 font-semibold text-graphite-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-graphite-600">{item.value}</p>
                </>
              );
              return item.href ? (
                <a
                  key={item.title}
                  href={item.href}
                  className="rounded-2xl border border-graphite-100 p-6 text-center transition-colors hover:border-accent-200 hover:bg-accent-50/40"
                >
                  {content}
                </a>
              ) : (
                <div key={item.title} className="rounded-2xl border border-graphite-100 p-6 text-center">
                  {content}
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-10 max-w-xl text-sm text-graphite-500">
            Häufige Fragen finden Sie auch in unserem{" "}
            <Link href="/hilfe" className="font-semibold text-accent-600 underline">
              Hilfe-Center
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
