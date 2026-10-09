import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Search } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Anhänger einfach online mieten und vermieten
          </span>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-graphite-900 sm:text-5xl lg:text-6xl">
            Verdienen Sie Geld mit Ihrem Anhänger.
          </h1>
          <p className="mt-6 max-w-lg text-balance text-lg text-graphite-600">
            Vermieten Sie Ihren Anhänger oder finden Sie ein passendes Angebot in Ihrer Nähe.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/anhaenger-vermieten" size="lg" icon={<ArrowRight size={20} />} iconPosition="right">
              Anhänger vermieten
            </Button>
            <Button href="/anhaenger" variant="outline" size="lg" icon={<Search size={18} />}>
              Anhänger finden
            </Button>
          </div>

          <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-graphite-100 pt-8">
            <div>
              <dt className="text-lg font-bold text-graphite-900 sm:text-xl">Flexibel</dt>
              <dd className="mt-1 text-sm text-graphite-500">Zeitraum frei wählen</dd>
            </div>
            <div>
              <dt className="text-lg font-bold text-graphite-900 sm:text-xl">Transparent</dt>
              <dd className="mt-1 text-sm text-graphite-500">Preise direkt vergleichen</dd>
            </div>
            <div>
              <dt className="text-lg font-bold text-graphite-900 sm:text-xl">Lokal</dt>
              <dd className="mt-1 text-sm text-graphite-500">Angebote auf der Karte</dd>
            </div>
          </dl>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute -z-10 h-[420px] w-[420px] rounded-full bg-accent-50 blur-3xl" aria-hidden="true" />
          <div className="w-full max-w-lg animate-float overflow-hidden rounded-2xl shadow-card">
            <Image
              src="/hero-trailer.jpg"
              alt="Raspon Anhänger"
              width={1536}
              height={1024}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
