import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrailerCard } from "@/components/trailer/TrailerCard";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Favoriten" };

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) redirect("/anmelden");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      trailer: {
        include: {
          photos: { take: 1, orderBy: { position: "asc" } },
          owner: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return (
    <>
      <Header />
      <main className="container-page py-12">
        <h1 className="font-display text-2xl font-bold text-graphite-900 sm:text-3xl">Favoriten</h1>

        {favorites.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-graphite-200 py-20 text-center text-graphite-500">
            Sie haben noch keine Favoriten.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((f) => (
              <TrailerCard
                key={f.id}
                trailer={{
                  id: f.trailer.id,
                  slug: f.trailer.slug,
                  title: f.trailer.title,
                  city: f.trailer.city,
                  country: f.trailer.country,
                  latitude: f.trailer.latitude,
                  longitude: f.trailer.longitude,
                  coverPhotoUrl: f.trailer.photos[0]?.url ?? null,
                  pricePerHour: f.trailer.pricePerHour.toString(),
                  currency: f.trailer.currency,
                  averageRating: f.trailer.averageRating,
                  reviewCount: f.trailer.reviewCount,
                  ownerName: `${f.trailer.owner.firstName} ${f.trailer.owner.lastName.charAt(0)}.`,
                }}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
