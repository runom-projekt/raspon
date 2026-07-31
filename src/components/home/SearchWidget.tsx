"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MapPin, Calendar, Truck, Search } from "lucide-react";
import { TRAILER_CATEGORIES } from "@/lib/constants";

export function SearchWidget() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (pickupDate) params.set("pickupDate", pickupDate);
    if (returnDate) params.set("returnDate", returnDate);
    if (category) params.set("category", category);
    router.push(`/anhaenger?${params.toString()}`);
  }

  return (
    <section className="relative z-10 -mt-6 pb-4 sm:-mt-10">
      <div className="container-page">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-graphite-100 bg-white p-4 shadow-premium sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end lg:gap-2 lg:p-3"
        >
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-graphite-500">
              <MapPin size={14} /> Standort
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Berlin, München, Hamburg…"
              className="input"
              aria-label="Standort"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-graphite-500">
              <Calendar size={14} /> Abholdatum
            </span>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="input"
              aria-label="Abholdatum"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-graphite-500">
              <Calendar size={14} /> Rückgabedatum
            </span>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="input"
              aria-label="Rückgabedatum"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-graphite-500">
              <Truck size={14} /> Anhängertyp
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input appearance-none"
              aria-label="Anhängertyp"
            >
              <option value="">Alle Typen</option>
              {Object.entries(TRAILER_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="btn-primary h-12 w-full lg:w-auto lg:px-8">
            <Search size={18} />
            <span className="lg:hidden">Suchen</span>
          </button>
        </form>
      </div>
    </section>
  );
}
