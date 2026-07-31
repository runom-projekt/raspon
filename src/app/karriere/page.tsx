import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Mail, Users, Rocket, Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Karriere",
  description: "Karriere bei Raspon — werde Teil eines Teams, das die Anhängervermietung in Deutschland neu denkt.",
};

const VALUES = [
  {
    icon: Rocket,
    title: "Eigenverantwortung",
    description: "Kurze Wege, schnelle Entscheidungen — jede und jeder trägt echte Verantwortung.",
  },
  {
    icon: Users,
    title: "Kleines Team",
    description: "Wir wachsen bewusst schrittweise und lernen aus direktem Kontakt mit Nutzern.",
  },
  {
    icon: Compass,
    title: "Klarer Fokus",
    description: "Ein Produkt, ein Ziel: Anhängervermietung so einfach wie möglich machen.",
  },
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 text-center lg:py-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Karriere
          </span>
          <h1 className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-graphite-900 sm:text-5xl">
            Gestalte mit uns die Zukunft der Anhängervermietung
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-graphite-600">
            Raspon ist ein kleines, wachsendes Team. Wir suchen Menschen, die Lust haben, ein Produkt von Grund
            auf mitzugestalten.
          </p>
        </section>

        <section className="bg-graphite-50 py-16 lg:py-24">
          <div className="container-page">
            <div className="mt-0 grid grid-cols-1 gap-6 sm:grid-cols-3">
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
          <div className="mx-auto max-w-2xl rounded-2xl border border-graphite-100 p-8 text-center sm:p-10">
            <h2 className="font-display text-2xl font-bold text-graphite-900">Aktuell keine offenen Stellen</h2>
            <p className="mt-3 text-graphite-600">
              Wir haben derzeit keine ausgeschriebenen Positionen — das ändert sich aber mit unserem Wachstum.
              Wenn du überzeugt bist, dass du zu uns passt, freuen wir uns über deine Initiativbewerbung.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="mailto:kontakt@raspon.de" variant="primary" icon={<Mail size={18} />}>
                Initiativbewerbung senden
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
