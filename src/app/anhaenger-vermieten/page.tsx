import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { WhyUs } from "@/components/home/WhyUs";
import { getSession } from "@/lib/auth";
import { ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Anhänger vermieten und Geld verdienen",
  description:
    "Vermieten Sie Ihren Anhänger auf Raspon und verdienen Sie Geld, wenn Sie ihn nicht nutzen. Sichere Zahlungen, verifizierte Mieter, volle Kontrolle über den Kalender.",
};

export default async function AddTrailerLandingPage() {
  const session = await getSession();
  if (session?.role === "OWNER" || session?.role === "ADMIN") {
    redirect("/dashboard/anhaenger/neu");
  }

  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 text-center lg:py-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Schließen Sie sich Tausenden Vermietern an
          </span>
          <h1 className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-graphite-900 sm:text-5xl">
            Verdienen Sie Geld mit Ihrem Anhänger
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-graphite-600">
            Erstellen Sie in wenigen Minuten eine Anzeige und verdienen Sie Geld, während Ihr Anhänger sonst ungenutzt in der Garage steht.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              href={session ? "/vermieterkonto-aktivieren" : "/registrieren?role=OWNER&returnTo=%2Fdashboard%2Fanhaenger%2Fneu"}
              size="lg"
              icon={<ArrowRight size={20} />}
              iconPosition="right"
            >
              {session ? "Anhänger hinzufügen" : "Vermieterkonto erstellen"}
            </Button>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-6 text-left sm:grid-cols-3">
            {[
              "Sie legen Preis und Verfügbarkeit fest",
              "Zahlungen werden automatisch abgerechnet",
              "Support und Verifizierung der Mieter",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-graphite-100 p-5">
                <Check size={18} className="mt-0.5 shrink-0 text-accent-500" />
                <span className="text-sm text-graphite-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <WhyUs />
      </main>
      <Footer />
    </>
  );
}
