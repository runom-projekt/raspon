import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Hilfe-Center",
  description: "Antworten auf häufige Fragen rund um Buchung, Vermietung, Zahlung und Sicherheit bei Raspon.",
};

const FAQ_GROUPS = [
  {
    title: "Für Mieter",
    items: [
      {
        q: "Wie finde und buche ich einen Anhänger?",
        a: "Geben Sie Ihren Standort und den gewünschten Zeitraum in die Suche ein, wählen Sie einen passenden Anhänger aus und buchen Sie direkt online. Sie erhalten sofort eine Bestätigung.",
      },
      {
        q: "Wie funktioniert die Bezahlung?",
        a: "Die Zahlung erfolgt sicher online bei der Buchung. Der Betrag wird erst final an den Vermieter freigegeben, wenn die Vermietung planmäßig abläuft.",
      },
      {
        q: "Was ist die Kaution?",
        a: "Viele Vermieter verlangen eine Kaution als Sicherheit, die bei der Buchung separat ausgewiesen wird. Details zur Rückerstattung regeln Sie direkt mit dem Vermieter bei der Übergabe.",
      },
      {
        q: "Kann ich eine Buchung stornieren?",
        a: "Ja, Stornierungsbedingungen finden Sie auf der jeweiligen Anzeige sowie in unserer Widerrufsbelehrung.",
      },
    ],
  },
  {
    title: "Für Vermieter",
    items: [
      {
        q: "Wie melde ich meinen Anhänger an?",
        a: "Erstellen Sie ein Vermieterkonto, hinterlegen Sie Fotos, technische Daten und Preis und laden Sie den Fahrzeugschein hoch. Unser Team prüft die Anzeige, bevor sie veröffentlicht wird.",
      },
      {
        q: "Wann bekomme ich mein Geld?",
        a: "Nach Abschluss einer Vermietung wird der Betrag Ihrem Konto gutgeschrieben. Für die Auszahlung ist einmalig eine Identitätsprüfung notwendig — danach können Sie Auszahlungen im Dashboard anfordern.",
      },
      {
        q: "Was passiert bei Schäden am Anhänger?",
        a: "Prüfen Sie den Anhänger bei Rückgabe gemeinsam mit dem Mieter. Bei Schäden greift zunächst die hinterlegte Kaution; dokumentieren Sie Schäden mit Fotos und kontaktieren Sie unseren Support.",
      },
    ],
  },
  {
    title: "Allgemein",
    items: [
      {
        q: "Ist Raspon sicher?",
        a: "Alle Anzeigen werden vor Veröffentlichung geprüft, Auszahlungen setzen eine Identitätsprüfung voraus, und Zahlungen laufen über eine sichere Zahlungsabwicklung. Mehr dazu auf unserer Sicherheit-Seite.",
      },
      {
        q: "Wie erreiche ich den Support?",
        a: "Über unsere Kontaktseite per Telefon oder E-Mail — wir antworten in der Regel innerhalb von 1–2 Werktagen.",
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 text-center lg:py-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Hilfe-Center
          </span>
          <h1 className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold tracking-tight text-graphite-900 sm:text-5xl">
            Wie können wir helfen?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-graphite-600">
            Antworten auf die häufigsten Fragen rund um Raspon.
          </p>
        </section>

        <section className="container-page pb-16 lg:pb-24">
          <div className="mx-auto max-w-3xl space-y-12">
            {FAQ_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="font-display text-xl font-bold text-graphite-900">{group.title}</h2>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-2xl border border-graphite-100 p-5 open:bg-graphite-50"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-graphite-900">
                        {item.q}
                        <ChevronDown
                          size={18}
                          className="shrink-0 text-graphite-400 transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <p className="mt-3 text-sm text-graphite-600">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-14 max-w-xl text-center text-sm text-graphite-500">
            Keine Antwort gefunden?{" "}
            <Link href="/kontakt" className="font-semibold text-accent-600 underline">
              Kontaktieren Sie uns
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
