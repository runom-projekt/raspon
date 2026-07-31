import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="container-page pb-16 lg:pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-graphite-900 px-8 py-16 text-center sm:px-16">
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl"
          aria-hidden="true"
        />
        <h2 className="relative font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Verdienen Sie Geld mit Ihrem Anhänger
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-graphite-300">
          Schließen Sie sich Tausenden Vermietern an, die zusätzliches Geld verdienen, indem sie ihre Anhänger vermieten, wenn sie sie nicht nutzen.
        </p>
        <div className="relative mt-8">
          <Button href="/anhaenger-vermieten" size="lg" icon={<ArrowRight size={20} />} iconPosition="right">
            Anhänger vermieten
          </Button>
        </div>
      </div>
    </section>
  );
}
