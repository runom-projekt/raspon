import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { TRAILER_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Meine Anhänger" };

const statusLabels: Record<string, { label: string; variant: "default" | "accent" | "success" | "outline" }> = {
  DRAFT: { label: "Entwurf", variant: "outline" },
  PENDING_REVIEW: { label: "Wird geprüft", variant: "accent" },
  PUBLISHED: { label: "Veröffentlicht", variant: "success" },
  SUSPENDED: { label: "Gesperrt", variant: "default" },
  ARCHIVED: { label: "Archiviert", variant: "default" },
};

export default async function OwnerTrailersPage() {
  const session = await getSession();
  const trailers = await prisma.trailer.findMany({
    where: { ownerId: session!.sub, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: { photos: { take: 1, orderBy: { position: "asc" } } },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-graphite-900">Meine Anhänger</h1>
        <Button href="/dashboard/anhaenger/neu">Anhänger hinzufügen</Button>
      </div>

      {trailers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-graphite-200 bg-white py-20 text-center text-graphite-500">
          Sie haben noch keine Anhänger.{" "}
          <Link href="/dashboard/anhaenger/neu" className="font-semibold text-accent-600 underline">
            Ersten Anhänger hinzufügen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trailers.map((trailer) => {
            const status = statusLabels[trailer.status];
            return (
              <div key={trailer.id} className="card overflow-hidden">
                <div className="relative aspect-[4/3] bg-graphite-100">
                  {trailer.photos[0] && (
                    <Image src={trailer.photos[0].url} alt={trailer.title} fill className="object-cover" />
                  )}
                  {status && (
                    <Badge variant={status.variant} className="absolute left-3 top-3">
                      {status.label}
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-graphite-500">{TRAILER_CATEGORIES[trailer.category].label}</p>
                  <h3 className="font-semibold text-graphite-900">{trailer.title}</h3>
                  <p className="mt-1 text-sm text-graphite-600">
                    {formatCurrency(trailer.pricePerDay.toString(), trailer.currency)} / Tag
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/dashboard/anhaenger/${trailer.id}`} className="btn-outline h-9 flex-1 text-sm">
                      Verwalten
                    </Link>
                    <Link href={`/anhaenger/${trailer.slug}`} className="btn-ghost h-9 px-3 text-sm">
                      Vorschau
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
