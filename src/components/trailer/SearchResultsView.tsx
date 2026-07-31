"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrailerCard } from "@/components/trailer/TrailerCard";
import type { TrailerCardData } from "@/types";

const ResultsMap = dynamic(() => import("@/components/trailer/ResultsMap").then((m) => m.ResultsMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-2xl border border-graphite-100 bg-graphite-50 text-sm text-graphite-400">
      Karte wird geladen…
    </div>
  ),
});

interface SearchResultsViewProps {
  items: TrailerCardData[];
  page: number;
  totalPages: number;
}

export function SearchResultsView({ items, page, totalPages }: SearchResultsViewProps) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-full border border-graphite-200 p-1">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              view === "list" ? "bg-graphite-900 text-white" : "text-graphite-600 hover:bg-graphite-50"
            )}
          >
            <List size={15} /> Liste
          </button>
          <button
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              view === "map" ? "bg-graphite-900 text-white" : "text-graphite-600 hover:bg-graphite-50"
            )}
          >
            <MapIcon size={15} /> Karte
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-graphite-200 py-20 text-center text-graphite-500">
          Keine Anhänger entsprechen den Kriterien. Versuchen Sie, die Suchfilter zu ändern.
        </div>
      ) : view === "list" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((trailer) => (
            <TrailerCard key={trailer.id} trailer={trailer} />
          ))}
        </div>
      ) : (
        <ResultsMap items={items} />
      )}

      {view === "list" && totalPages > 1 && (
        <nav className="mt-10 flex justify-center gap-2" aria-label="Ergebnisseiten">
          {Array.from({ length: totalPages }).map((_, i) => (
            <a
              key={i}
              href={`?page=${i + 1}`}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                page === i + 1 ? "bg-graphite-900 text-white" : "text-graphite-600 hover:bg-graphite-100"
              )}
            >
              {i + 1}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
