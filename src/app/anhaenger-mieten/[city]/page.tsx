import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchResultsView } from "@/components/trailer/SearchResultsView";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { searchTrailers } from "@/server/services/trailerService";

async function cityForSlug(slug: string) {
  const cities = await prisma.trailer.findMany({ where: { status: "PUBLISHED" }, distinct: ["city"], select: { city: true } });
  return cities.find((entry) => slugify(entry.city) === slug)?.city ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await cityForSlug(slug);
  if (!city) return {};
  const title = `Anhänger mieten in ${city}`;
  const description = `Anhänger in ${city} vergleichen und direkt online anfragen. Preise, Standorte und verfügbare Angebote auf Raspon.`;
  return { title, description, alternates: { canonical: `${SITE_URL}/anhaenger-mieten/${slug}` }, openGraph: { title, description, url: `${SITE_URL}/anhaenger-mieten/${slug}` } };
}

export default async function CityLandingPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = await cityForSlug(slug);
  if (!city) notFound();
  const results = await searchTrailers({ location: city, pageSize: 24 });
  const jsonLd = { "@context": "https://schema.org", "@type": "ItemList", name: `Anhänger mieten in ${city}`, numberOfItems: results.total, itemListElement: results.items.map((item, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}/anhaenger/${item.slug}`, name: item.title })) };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <Header />
    <main className="container-page py-12">
      <h1 className="font-display text-3xl font-bold text-graphite-900">Anhänger mieten in {city}</h1>
      <p className="mt-3 max-w-2xl text-graphite-600">Vergleichen Sie veröffentlichte Anhänger in {city}. Prüfen Sie Preis, Standort und Ausstattung und wählen Sie anschließend Ihren Mietzeitraum.</p>
      <div className="mt-10"><SearchResultsView items={results.items} page={1} totalPages={1} /></div>
      <section className="mt-14 rounded-2xl bg-graphite-50 p-6">
        <h2 className="text-xl font-bold text-graphite-900">So funktioniert die Miete</h2>
        <p className="mt-2 text-sm text-graphite-600">Angebot auswählen, Zeitraum angeben, anmelden und die Buchung über PayPal oder Banküberweisung bezahlen. Die genaue Übergabe stimmen Mieter und Vermieter direkt ab.</p>
      </section>
    </main>
    <Footer />
  </>;
}
