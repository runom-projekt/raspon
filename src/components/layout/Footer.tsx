import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { TRAILER_CATEGORIES } from "@/lib/constants";

const categoryEntries = Object.entries(TRAILER_CATEGORIES);

export function Footer() {
  return (
    <footer className="border-t border-graphite-100 bg-graphite-950 text-graphite-300">
      <div className="container-page grid grid-cols-2 gap-10 py-16 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-xl font-bold text-white">Raspon</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-graphite-400">
            Die größte europäische Plattform für Anhängervermietung. Mieten oder vermieten — sicher und bequem.
          </p>
          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Linkedin, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-graphite-900 text-graphite-300 hover:bg-accent-500 hover:text-white"
                aria-label="Soziale Medien"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Kategorien</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {categoryEntries.slice(0, 6).map(([key, cat]) => (
              <li key={key}>
                <Link href={`/anhaenger?category=${key}`} className="hover:text-white">
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Unternehmen</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href="/ueber-uns" className="hover:text-white">Über uns</Link></li>
            <li><Link href="/so-funktionierts" className="hover:text-white">So funktioniert es</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/karriere" className="hover:text-white">Karriere</Link></li>
            <li><Link href="/kontakt" className="hover:text-white">Kontakt</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Support</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href="/hilfe" className="hover:text-white">Hilfe-Center</Link></li>
            <li><Link href="/versicherung" className="hover:text-white">Versicherung</Link></li>
            <li><Link href="/sicherheit" className="hover:text-white">Sicherheit</Link></li>
            <li><Link href="/agb" className="hover:text-white">AGB</Link></li>
            <li><Link href="/widerruf" className="hover:text-white">Widerrufsbelehrung</Link></li>
            <li><Link href="/datenschutz" className="hover:text-white">Datenschutzerklärung</Link></li>
            <li><Link href="/impressum" className="hover:text-white">Impressum</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Für Vermieter</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href="/anhaenger-vermieten" className="hover:text-white">Anhänger vermieten</Link></li>
            <li><Link href="/dashboard/einnahmen" className="hover:text-white">Geld verdienen</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Vermieter-Dashboard</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-graphite-900">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-xs text-graphite-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Raspon. Alle Rechte vorbehalten.</p>
          <div className="flex gap-6">
            <Link href="/impressum" className="hover:text-white">Impressum</Link>
            <Link href="/agb" className="hover:text-white">AGB</Link>
            <Link href="/datenschutz" className="hover:text-white">Datenschutz</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
