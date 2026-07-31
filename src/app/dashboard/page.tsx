import type { Metadata } from "next";
import Link from "next/link";
import { Truck, CalendarClock, Wallet, Star } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Vermieter-Dashboard" };

export default async function DashboardOverviewPage() {
  const session = await getSession();
  const ownerId = session!.sub;

  const [trailerCount, activeBookings, earningsAgg, recentBookings, avgRatingAgg] = await Promise.all([
    prisma.trailer.count({ where: { ownerId } }),
    prisma.booking.count({
      where: { trailer: { ownerId }, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } },
    }),
    prisma.booking.aggregate({
      where: { trailer: { ownerId }, status: "COMPLETED" },
      _sum: { subtotal: true, commissionAmt: true },
    }),
    prisma.booking.findMany({
      where: { trailer: { ownerId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { trailer: { select: { title: true } }, renter: { select: { firstName: true, lastName: true } } },
    }),
    prisma.trailer.aggregate({ where: { ownerId }, _avg: { averageRating: true } }),
  ]);

  const netEarnings =
    (earningsAgg._sum.subtotal ? Number(earningsAgg._sum.subtotal) : 0) -
    (earningsAgg._sum.commissionAmt ? Number(earningsAgg._sum.commissionAmt) : 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-graphite-900">Übersicht</h1>
          <p className="mt-1 text-sm text-graphite-500">Willkommen zurück, {session!.email}</p>
        </div>
        <Button href="/dashboard/anhaenger/neu" size="md">
          Anhänger hinzufügen
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Meine Anhänger" value={String(trailerCount)} icon={Truck} />
        <StatCard label="Aktive Buchungen" value={String(activeBookings)} icon={CalendarClock} />
        <StatCard label="Einnahmen (netto)" value={formatCurrency(netEarnings)} icon={Wallet} />
        <StatCard
          label="Durchschnittsbewertung"
          value={(avgRatingAgg._avg.averageRating ?? 0).toFixed(1)}
          icon={Star}
        />
      </div>

      <div className="mt-10 rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Letzte Buchungen</h2>
        {recentBookings.length === 0 ? (
          <p className="mt-4 text-sm text-graphite-500">Sie haben noch keine Buchungen.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-graphite-100 text-graphite-500">
                <th className="pb-3 font-medium">Anhänger</th>
                <th className="pb-3 font-medium">Mieter</th>
                <th className="pb-3 font-medium">Zeitraum</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-b border-graphite-50">
                  <td className="py-3 font-medium text-graphite-900">{b.trailer.title}</td>
                  <td className="py-3 text-graphite-600">
                    {b.renter.firstName} {b.renter.lastName}
                  </td>
                  <td className="py-3 text-graphite-600">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold text-graphite-700">
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-graphite-900">
                    {formatCurrency(b.totalAmount.toString(), b.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link href="/dashboard/buchungen" className="mt-4 inline-block text-sm font-semibold text-accent-600">
          Alle Buchungen ansehen →
        </Link>
      </div>
    </div>
  );
}
