"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  alt: string | null;
}

export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = photos[activeIndex];

  if (photos.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-graphite-100 text-graphite-400">
        Keine Fotos
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-graphite-100">
        <Image
          src={active?.url ?? photos[0]!.url}
          alt={active?.alt ?? title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2",
                i === activeIndex ? "border-accent-500" : "border-transparent"
              )}
              aria-label={`Foto ${i + 1}`}
            >
              <Image src={photo.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
