import { Check } from "lucide-react";
import { WHY_US_ITEMS } from "@/lib/constants";

export function WhyUs() {
  return (
    <section className="container-page py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-graphite-900 sm:text-4xl">
          Warum wir?
        </h2>
        <p className="mt-3 text-graphite-600">
          Wir schaffen Vertrauen zwischen Vermietern und Mietern — bei jedem Schritt.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_US_ITEMS.map((item) => (
          <div key={item.title} className="flex gap-4 rounded-2xl border border-graphite-100 p-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
              <Check size={18} />
            </span>
            <div>
              <h3 className="font-semibold text-graphite-900">{item.title}</h3>
              <p className="mt-1 text-sm text-graphite-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
