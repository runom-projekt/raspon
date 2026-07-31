import type { Metadata } from "next";
import { Users, Truck, CalendarClock, Wallet, Flag, Percent } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistiken | Admin-Panel" };

export default async function AdminOverviewPage() {
  const [
    userCount,
    trailerCount,
    bookingCount,
    pendingReports,
    revenueAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.trailer.count({ where: { status: "PUBLISHED" } }),
    prisma.booking.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.booking.aggregate({
      where: { status: "COMPLETED" },
      _sum: { subtotal: true, commissionAmt: true },
    }),
  ]);

  const gmv = Number(revenueAgg._sum.subtotal ?? 0);
  const commission = Number(revenueAgg._sum.commissionAmt ?? 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Plattformstatistiken</h1>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Benutzer" value={String(userCount)} icon={Users} />
        <StatCard label="Aktive Anhänger" value={String(trailerCount)} icon={Truck} />
        <StatCard label="Buchungen gesamt" value={String(bookingCount)} icon={CalendarClock} />
        <StatCard label="Umsatz (GMV)" value={formatCurrency(gmv)} icon={Wallet} />
        <StatCard label="Plattformprovisionen" value={formatCurrency(commission)} icon={Percent} />
        <StatCard label="Offene Meldungen" value={String(pendingReports)} icon={Flag} />
      </div>
    </div>
  );
}
