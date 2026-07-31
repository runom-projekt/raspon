import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Search } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-600">
            Nr. 1 für Anhängervermietung in Deutschland
          </span>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-graphite-900 sm:text-5xl lg:text-6xl">
            Verdienen Sie Geld mit Ihrem Anhänger.
          </h1>
          <p className="mt-6 max-w-lg text-balance text-lg text-graphite-600">
            Vermieten Sie Ihren Anhänger oder mieten Sie einen von Hunderten in Ihrer Nähe verfügbaren Anhängern.
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
              <dt className="text-2xl font-bold text-graphite-900 sm:text-3xl">12.000+</dt>
              <dd className="mt-1 text-sm text-graphite-500">Anhänger im Angebot</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-graphite-900 sm:text-3xl">98%</dt>
              <dd className="mt-1 text-sm text-graphite-500">zufriedene Kunden</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-graphite-900 sm:text-3xl">150+</dt>
              <dd className="mt-1 text-sm text-graphite-500">Städte in Deutschland</dd>
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
