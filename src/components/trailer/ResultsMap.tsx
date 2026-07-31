"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { TrailerCardData } from "@/types";

function pinIcon(url: string) {
  return L.icon({
    iconUrl: url,
    iconSize: [38, 51],
    iconAnchor: [19, 51],
    popupAnchor: [0, -51],
  });
}

const greenIcon = pinIcon("/markers/pin-green.png");
const redIcon = pinIcon("/markers/pin-red.png");

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0]!, 12);
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    }
  }, [map, positions]);

  return null;
}

export function ResultsMap({ items }: { items: TrailerCardData[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const mappableItems = useMemo(
    () => items.filter((item) =>
      Number.isFinite(item.latitude) &&
      Number.isFinite(item.longitude) &&
      item.latitude >= -90 &&
      item.latitude <= 90 &&
      item.longitude >= -180 &&
      item.longitude <= 180
    ),
    [items]
  );
  const positions = useMemo<[number, number][]>(
    () => mappableItems.map((item) => [item.latitude, item.longitude]),
    [mappableItems]
  );

  if (mappableItems.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-graphite-200 text-graphite-500">
        Keine Anhänger zum Anzeigen auf der Karte.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-graphite-100">
      <MapContainer center={positions[0]!} zoom={11} scrollWheelZoom className="h-[520px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        {mappableItems.map((item) => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={hoveredId === item.id ? redIcon : greenIcon}
            eventHandlers={{
              mouseover: () => setHoveredId(item.id),
              mouseout: () => setHoveredId(null),
            }}
          >
            <Popup minWidth={220}>
              <Link href={`/anhaenger/${item.slug}`} className="block">
                <div className="relative mb-2 aspect-[4/3] w-full overflow-hidden rounded-lg bg-graphite-100">
                  {item.coverPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverPhotoUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-graphite-400">
                      Kein Foto
                    </div>
                  )}
                </div>
                <p className="line-clamp-1 text-sm font-semibold text-graphite-900">{item.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-graphite-500">
                  <MapPin size={11} /> {item.city}, {item.country}
                </p>
                <p className="mt-1 text-sm font-bold text-graphite-900">
                  {formatCurrency(item.pricePerHour, item.currency)}
                  <span className="text-xs font-normal text-graphite-500">/Stunde</span>
                </p>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
