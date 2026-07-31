import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BlockDatesForm } from "@/components/dashboard/BlockDatesForm";
import { TrailerPhotosManager } from "@/components/dashboard/TrailerPhotosManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ManageTrailerPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  const trailer = await prisma.trailer.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" } },
      blockedDates: { orderBy: { startDate: "asc" } },
      bookings: {
        orderBy: { startDate: "desc" },
        take: 20,
        include: { renter: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!trailer || (trailer.ownerId !== session!.sub && session!.role !== "ADMIN")) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite-900">{trailer.title}</h1>
        <p className="mt-1 text-sm text-graphite-500">
          {trailer.city}, {trailer.country} · {formatCurrency(trailer.pricePerDay.toString(), trailer.currency)}/Tag
        </p>
      </div>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Fotos</h2>
        <div className="mt-4">
          <TrailerPhotosManager trailerId={trailer.id} initialPhotos={trailer.photos} />
        </div>
      </section>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Termine blockieren</h2>
        <p className="mt-1 text-sm text-graphite-500">
          Blockieren Sie Termine, an denen der Anhänger nicht zur Vermietung verfügbar ist.
        </p>
        <div className="mt-4">
          <BlockDatesForm trailerId={trailer.id} />
        </div>
        {trailer.blockedDates.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {trailer.blockedDates.map((bd) => (
              <li key={bd.id} className="flex justify-between rounded-lg bg-graphite-50 px-3 py-2">
                <span>
                  {formatDate(bd.startDate)} – {formatDate(bd.endDate)}
                </span>
                <span className="text-graphite-500">{bd.reason ?? "Kein Grund angegeben"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Buchungen für diesen Anhänger</h2>
        {trailer.bookings.length === 0 ? (
          <p className="mt-3 text-sm text-graphite-500">Keine Buchungen.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-graphite-100 text-graphite-500">
                <th className="pb-3 font-medium">Mieter</th>
                <th className="pb-3 font-medium">Zeitraum</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {trailer.bookings.map((b) => (
                <tr key={b.id} className="border-b border-graphite-50">
                  <td className="py-3">{b.renter.firstName} {b.renter.lastName}</td>
                  <td className="py-3 text-graphite-600">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 font-semibold">{formatCurrency(b.totalAmount.toString(), b.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
