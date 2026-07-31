import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Gallery } from "@/components/trailer/Gallery";
import { SpecsTable } from "@/components/trailer/SpecsTable";
import { BookingWidget } from "@/components/trailer/BookingWidget";
import { OwnerCard } from "@/components/trailer/OwnerCard";
import { ReviewsList } from "@/components/trailer/ReviewsList";
import { MapView } from "@/components/trailer/MapView";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { getTrailerBySlug } from "@/server/services/trailerService";
import { TRAILER_CATEGORIES } from "@/lib/constants";
import { EQUIPMENT_OPTIONS } from "@/lib/constants";
import { SITE_URL } from "@/lib/constants";
import { MapPin } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ReportTrailerButton } from "@/components/trailer/ReportTrailerButton";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trailer = await getTrailerBySlug(slug);
  if (!trailer) return {};

  return {
    title: trailer.title,
    description: trailer.description.slice(0, 155),
    alternates: { canonical: `${SITE_URL}/anhaenger/${trailer.slug}` },
    openGraph: {
      title: trailer.title,
      description: trailer.description.slice(0, 155),
      images: trailer.photos[0] ? [{ url: trailer.photos[0].url }] : undefined,
    },
  };
}

export default async function TrailerDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const session = await getSession();
  const { startDate = "", endDate = "" } = await searchParams;
  const trailer = await getTrailerBySlug(slug);

  if (!trailer || trailer.status !== "PUBLISHED") notFound();

  const equipmentLabels = trailer.equipment
    .map((value) => EQUIPMENT_OPTIONS.find((e) => e.value === value)?.label)
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: trailer.title,
    description: trailer.description,
    image: trailer.photos.map((p) => p.url),
    category: TRAILER_CATEGORIES[trailer.category].label,
    offers: {
      "@type": "Offer",
      priceCurrency: trailer.currency,
      price: trailer.pricePerDay.toString(),
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/anhaenger/${trailer.slug}`,
    },
    aggregateRating:
      trailer.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: trailer.averageRating,
            reviewCount: trailer.reviewCount,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="container-page py-8">
        <div className="mb-4">
          <Badge variant="accent">{TRAILER_CATEGORIES[trailer.category].label}</Badge>
          <h1 className="mt-3 font-display text-2xl font-bold text-graphite-900 sm:text-3xl">
            {trailer.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-graphite-600">
            <Rating value={trailer.averageRating} reviewCount={trailer.reviewCount} />
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {trailer.city}, {trailer.country}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            <Gallery photos={trailer.photos} title={trailer.title} />

            <section>
              <h2 className="font-display text-xl font-bold text-graphite-900">Beschreibung</h2>
              <p className="mt-3 whitespace-pre-line text-graphite-700">{trailer.description}</p>
            </section>

            {equipmentLabels.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold text-graphite-900">Ausstattung</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {equipmentLabels.map((label) => (
                    <Badge key={label}>{label}</Badge>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-graphite-900">Technische Daten</h2>
              <SpecsTable
                manufacturer={trailer.manufacturer}
                model={trailer.model}
                productionYear={trailer.productionYear}
                weightKg={trailer.weightKg}
                grossWeightKg={trailer.grossWeightKg}
                payloadKg={trailer.payloadKg}
                lengthCm={trailer.lengthCm}
                widthCm={trailer.widthCm}
                heightCm={trailer.heightCm}
              />
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-graphite-900">Standort</h2>
              <MapView latitude={trailer.latitude} longitude={trailer.longitude} city={trailer.city} />
            </section>

            <OwnerCard
              firstName={trailer.owner.firstName}
              lastName={trailer.owner.lastName}
              avatarUrl={trailer.owner.avatarUrl}
              isIdVerified={trailer.owner.isIdVerified}
              memberSince={trailer.owner.createdAt}
            />
            {session?.sub !== trailer.ownerId && <ReportTrailerButton trailerId={trailer.id} signedIn={Boolean(session)} />}

            <ReviewsList
              reviews={trailer.reviews}
              averageRating={trailer.averageRating}
              reviewCount={trailer.reviewCount}
            />
          </div>

          <div>
              <BookingWidget
                trailerId={trailer.id}
                pricePerDay={trailer.pricePerDay.toString()}
                depositAmount={trailer.depositAmount.toString()}
                currency={trailer.currency}
                initialStartDate={startDate}
                initialEndDate={endDate}
              />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
