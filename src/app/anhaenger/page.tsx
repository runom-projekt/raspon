import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FilterSidebar } from "@/components/trailer/FilterSidebar";
import { SearchResultsView } from "@/components/trailer/SearchResultsView";
import { searchTrailers } from "@/server/services/trailerService";
import { trailerSearchSchema } from "@/lib/validation";
import type { TrailerCategory } from "@prisma/client";
import { SlidersHorizontal } from "lucide-react";

export const metadata: Metadata = {
  title: "Anhänger zum Mieten finden",
  description:
    "Durchsuchen Sie Tausende verfügbare Anhänger in Ihrer Nähe — Lastenanhänger, Autotransporter, Wohnwagen und mehr. Online buchen in wenigen Minuten.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TrailerSearchPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const parsed = trailerSearchSchema.safeParse({
    location: rawParams.location,
    category: rawParams.category,
    pickupDate: rawParams.pickupDate,
    returnDate: rawParams.returnDate,
    minPrice: rawParams.minPrice,
    maxPrice: rawParams.maxPrice,
    page: rawParams.page,
  });

  const filters = parsed.success ? parsed.data : { page: 1 };

  const results = await searchTrailers({
    location: filters.location,
    category: filters.category as TrailerCategory | undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    page: filters.page,
  });

  return (
    <>
      <Header />
      <main className="container-page py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-graphite-900 sm:text-3xl">
              {filters.location ? `Anhänger in: ${filters.location}` : "Alle Anhänger"}
            </h1>
            <p className="mt-1 text-sm text-graphite-500">
              {results.total} {results.total === 1 ? "Anhänger" : "Anhänger"} gefunden
            </p>
          </div>
          <button className="btn-outline h-11 gap-2 px-5 text-sm lg:hidden">
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <FilterSidebar />

          <SearchResultsView items={results.items} page={results.page} totalPages={results.totalPages} />
        </div>
      </main>
      <Footer />
    </>
  );
}
