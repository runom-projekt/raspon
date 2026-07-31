"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  city: string;
}

const locationIcon = L.icon({
  iconUrl: "/markers/pin-green.png",
  iconSize: [38, 51],
  iconAnchor: [19, 51],
  popupAnchor: [0, -51],
});

export function LocationMap({ latitude, longitude, city }: LocationMapProps) {
  const center = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);
  const externalMapUrl = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}#map=14/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`;

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="h-72 w-full"
      aria-label={`Karte der Umgebung von ${city}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center} icon={locationIcon}>
        <Popup>
          <strong>{city}</strong>
          <br />
          Ungefährer Standort
          <br />
          <a href={externalMapUrl} target="_blank" rel="noopener noreferrer">
            Größere Karte öffnen
          </a>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
