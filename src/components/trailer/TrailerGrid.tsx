import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrailerCard } from "@/components/trailer/TrailerCard";
import { getFeaturedTrailers } from "@/server/services/trailerService";

export async function TrailerGrid() {
  const trailers = await getFeaturedTrailers(8);

  return (
    <section className="container-page py-16 lg:py-24">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-graphite-900 sm:text-4xl">
            Verfügbare Anhänger
          </h2>
          <p className="mt-2 text-graphite-600">Für Sie ausgewählt aus Tausenden Angeboten in Ihrer Nähe.</p>
        </div>
        <Link
          href="/anhaenger"
          className="hidden items-center gap-1 text-sm font-semibold text-graphite-900 hover:text-accent-600 sm:flex"
        >
          Alle ansehen <ArrowRight size={16} />
        </Link>
      </div>

      {trailers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-graphite-200 py-20 text-center text-graphite-500">
          Bald erscheinen hier die ersten Anhänger. Seien Sie der erste Vermieter —{" "}
          <Link href="/anhaenger-vermieten" className="font-semibold text-accent-600 underline">
            Anhänger hinzufügen
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trailers.map((trailer) => (
            <TrailerCard key={trailer.id} trailer={trailer} />
          ))}
        </div>
      )}
    </section>
  );
}
