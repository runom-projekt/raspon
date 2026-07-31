"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TRAILER_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const activeCategory = searchParams.get("category") ?? "";

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/anhaenger?${params.toString()}`);
  }

  return (
    <aside className="hidden h-fit rounded-2xl border border-graphite-100 p-5 lg:block">
      <h2 className="font-semibold text-graphite-900">Filter</h2>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-graphite-700">Kategorie</h3>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              onClick={() => updateParams({ category: undefined })}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-graphite-50",
                !activeCategory && "bg-accent-50 font-semibold text-accent-600"
              )}
            >
              Alle
            </button>
          </li>
          {Object.entries(TRAILER_CATEGORIES).map(([key, cat]) => (
            <li key={key}>
              <button
                onClick={() => updateParams({ category: key })}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-graphite-50",
                  activeCategory === key && "bg-accent-50 font-semibold text-accent-600"
                )}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-graphite-100 pt-5">
        <h3 className="text-sm font-semibold text-graphite-700">Preis pro Stunde (€)</h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="input h-10 px-3 text-sm"
            aria-label="Mindestpreis"
          />
          <span className="text-graphite-400">—</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="input h-10 px-3 text-sm"
            aria-label="Höchstpreis"
          />
        </div>
        <button
          onClick={() => updateParams({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined })}
          className="btn-secondary mt-4 h-10 w-full text-sm"
        >
          Anwenden
        </button>
      </div>
    </aside>
  );
}
