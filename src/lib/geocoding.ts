import "server-only";

interface GeocodeInput {
  addressLine?: string;
  postalCode?: string;
  city: string;
  country: string;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// Nominatim usage policy requires an identifying User-Agent and caps
// anonymous use at ~1 request/second — fine for trailer creation/edit
// volume today. Move to a self-hosted instance if that changes.
const USER_AGENT = "Raspon/1.0 (+https://raspon.de)";

async function query(params: URLSearchParams): Promise<GeocodeResult | null> {
  params.set("format", "json");
  params.set("limit", "1");
  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const results = (await res.json().catch(() => null)) as Array<{ lat: string; lon: string }> | null;
  const first = results?.[0];
  if (!first) return null;
  const latitude = Number(first.lat);
  const longitude = Number(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export async function geocodeAddress(input: GeocodeInput): Promise<GeocodeResult | null> {
  const structured = new URLSearchParams();
  if (input.addressLine) structured.set("street", input.addressLine);
  structured.set("city", input.city);
  if (input.postalCode) structured.set("postalcode", input.postalCode);
  if (input.country) structured.set("countrycodes", input.country.toLowerCase());
  const viaStructured = await query(structured);
  if (viaStructured) return viaStructured;

  // Structured search can miss on loosely formatted street input — retry
  // as a single free-text query, which Nominatim resolves more leniently.
  const freeform = new URLSearchParams();
  const q = [input.addressLine, input.postalCode, input.city].filter(Boolean).join(", ");
  freeform.set("q", q);
  if (input.country) freeform.set("countrycodes", input.country.toLowerCase());
  return query(freeform);
}
