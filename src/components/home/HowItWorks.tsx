import { Search, CalendarCheck, Key, RotateCcw } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";

const icons = [Search, CalendarCheck, Key, RotateCcw];

export function HowItWorks() {
  return (
    <section className="bg-graphite-50 py-16 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-graphite-900 sm:text-4xl">
So funktioniert es
          </h2>
          <p className="mt-3 text-graphite-600">Anhänger mieten war noch nie so einfach.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((item, i) => {
            const Icon = icons[i] ?? Search;
            return (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-soft">
                  <Icon size={26} className="text-accent-500" />
                </div>
                <span className="mt-4 block font-display text-sm font-bold text-accent-500">
                  SCHRITT {item.step}
                </span>
                <h3 className="mt-1 font-semibold text-graphite-900">{item.title}</h3>
                <p className="mt-2 text-sm text-graphite-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
