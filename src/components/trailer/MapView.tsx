"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

interface MapViewProps {
  latitude: number;
  longitude: number;
  city: string;
}

const LocationMap = dynamic(
  () => import("@/components/trailer/LocationMap").then((module) => module.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center bg-graphite-50 text-sm text-graphite-500">
        Karte wird geladen…
      </div>
    ),
  }
);

export function MapView({ latitude, longitude, city }: MapViewProps) {
  const coordinatesAreValid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  return (
    <div className="overflow-hidden rounded-2xl border border-graphite-100">
      {coordinatesAreValid ? (
        <LocationMap latitude={latitude} longitude={longitude} city={city} />
      ) : (
        <div className="flex h-72 items-center justify-center bg-graphite-50 px-6 text-center text-sm text-graphite-500">
          Für diesen Anhänger sind noch keine gültigen Standortdaten hinterlegt.
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-graphite-100 p-3 text-sm text-graphite-600">
        <MapPin size={14} aria-hidden="true" /> Ungefährer Standort in der Nähe von {city}
      </div>
    </div>
  );
}
