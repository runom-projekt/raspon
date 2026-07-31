import type { TrailerCategory } from "@prisma/client";

export const APP_NAME = "Raspon";
export const APP_DESCRIPTION =
  "Raspon — die europäische Plattform für Anhängervermietung. Finden oder vermieten Sie einen Anhänger in wenigen Minuten.";
export const DEFAULT_COMMISSION_PCT = 15;

export const TRAILER_CATEGORIES: Record<
  TrailerCategory,
  { label: string; slug: string; icon: string }
> = {
  CARGO: { label: "Lastenanhänger", slug: "lastenanhaenger", icon: "package" },
  CAR_TRANSPORTER: { label: "Autotransporter", slug: "autotransporter", icon: "truck" },
  MOTORCYCLE: { label: "Motorradanhänger", slug: "motorradanhaenger", icon: "bike" },
  HORSE: { label: "Pferdeanhänger", slug: "pferdeanhaenger", icon: "shapes" },
  CAMPING: { label: "Wohnwagen", slug: "wohnwagen", icon: "tent" },
  TIPPER: { label: "Kipperanhänger", slug: "kipperanhaenger", icon: "truck-loading" },
  FLATBED: { label: "Tieflader", slug: "tieflader", icon: "layout-grid" },
  SPECIALIZED: { label: "Spezialanhänger", slug: "spezialanhaenger", icon: "wrench" },
  OTHER: { label: "Sonstige", slug: "sonstige", icon: "more-horizontal" },
};

export const EQUIPMENT_OPTIONS = [
  { value: "auflaufbremse", label: "Auflaufbremse" },
  { value: "rampe", label: "Ladrampe" },
  { value: "plane", label: "Plane" },
  { value: "ladebordwand", label: "Ladebordwand" },
  { value: "anhaengerkupplung", label: "Anhängerkupplung" },
  { value: "led-beleuchtung", label: "LED-Beleuchtung" },
  { value: "ersatzrad", label: "Ersatzrad" },
  { value: "gps-sicherung", label: "GPS-Sicherung" },
  { value: "waermeisolierung", label: "Wärmeisolierung" },
  { value: "elektrik-12v", label: "12V-Elektrik" },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Anhänger finden",
    description: "Durchsuchen Sie Hunderte verfügbarer Anhänger in Ihrer Nähe und wählen Sie den passenden aus.",
  },
  {
    step: 2,
    title: "Online buchen",
    description: "Wählen Sie den Zeitraum, bezahlen Sie sicher online und erhalten Sie eine sofortige Bestätigung.",
  },
  {
    step: 3,
    title: "Abholen",
    description: "Treffen Sie den Vermieter, prüfen Sie den Zustand des Anhängers und fahren Sie los.",
  },
  {
    step: 4,
    title: "Zurückgeben",
    description: "Geben Sie den Anhänger am vereinbarten Ort und zur vereinbarten Zeit zurück und hinterlassen Sie eine Bewertung.",
  },
];

export const WHY_US_ITEMS = [
  { title: "Tausende Anhänger", description: "Die größte Auswahl an Anhängern in Deutschland und Europa." },
  { title: "Niedrige Preise", description: "Wettbewerbsfähige Preise direkt von den Eigentümern." },
  { title: "Sichere Zahlungen", description: "Online-Zahlungen geschützt und vollständig verschlüsselt." },
  { title: "Verifizierte Vermieter", description: "Jeder Vermieter durchläuft einen Verifizierungsprozess." },
  { title: "Kaution als Schutz", description: "Kaution und geprüfte Anzeigen sichern Mieter und Vermieter ab." },
  { title: "Support", description: "Unser Support-Team ist 7 Tage die Woche erreichbar." },
];

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://raspon.de";
