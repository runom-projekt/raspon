import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { FavoriteButton } from "@/components/trailer/FavoriteButton";
import { formatCurrency } from "@/lib/utils";
import type { TrailerCardData } from "@/types";

export function TrailerCard({ trailer }: { trailer: TrailerCardData }) {
  return (
    <article className="card group overflow-hidden">
      <Link href={`/anhaenger/${trailer.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-graphite-100">
          {trailer.coverPhotoUrl ? (
            <Image
              src={trailer.coverPhotoUrl}
              alt={trailer.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-graphite-300">
              Kein Foto
            </div>
          )}
          <FavoriteButton trailerId={trailer.id} />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-graphite-900">{trailer.title}</h3>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-graphite-500">
            <MapPin size={13} /> {trailer.city}, {trailer.country}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <Rating value={trailer.averageRating} reviewCount={trailer.reviewCount} />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-graphite-100 pt-3">
            <div>
              <span className="text-xs text-graphite-500">ab</span>{" "}
              <span className="font-bold text-graphite-900">
                {formatCurrency(trailer.pricePerHour, trailer.currency)}
              </span>
              <span className="text-xs text-graphite-500">/Stunde</span>
              <p className="text-xs text-graphite-400">{trailer.ownerName}</p>
            </div>
            <span className="btn-outline h-9 px-4 text-sm">Ansehen</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
