import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import { PayoutActions } from "@/components/dashboard/PayoutActions";
import { Wallet, TrendingUp, Percent } from "lucide-react";

export const metadata: Metadata = { title: "Einnahmen" };

export default async function EarningsPage() {
  const session = await getSession();

  const [completedAgg, payouts, user] = await Promise.all([
    prisma.booking.aggregate({
      where: {
        trailer: { ownerId: session!.sub },
        status: "COMPLETED",
        payment: { status: "PAID" },
      },
      _sum: { subtotal: true, commissionAmt: true },
    }),
    prisma.payout.findMany({ where: { ownerId: session!.sub }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUnique({
      where: { id: session!.sub },
      select: { isIdVerified: true, identitySubmittedAt: true },
    }),
  ]);

  const gross = Number(completedAgg._sum.subtotal ?? 0);
  const commission = Number(completedAgg._sum.commissionAmt ?? 0);
  const net = gross - commission;
  const alreadyRequested = payouts
    .filter((p) => p.status === "PENDING" || p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = Math.max(0, net - alreadyRequested);
  const pending = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Einnahmen</h1>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Bruttoumsatz" value={formatCurrency(gross)} icon={TrendingUp} />
        <StatCard label="Raspon-Provision" value={formatCurrency(commission)} icon={Percent} />
        <StatCard label="Netto-Auszahlung" value={formatCurrency(net)} icon={Wallet} />
      </div>

      <div className="mt-8">
        <PayoutActions
          outstanding={outstanding}
          pending={pending}
          isIdVerified={user?.isIdVerified ?? false}
          identitySubmitted={Boolean(user?.identitySubmittedAt)}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-graphite-100 bg-white p-6">
        <h2 className="font-semibold text-graphite-900">Auszahlungsverlauf</h2>
        {payouts.length === 0 ? (
          <p className="mt-3 text-sm text-graphite-500">
            Auszahlungen erscheinen hier, sobald Ihre Auszahlungsdaten hinterlegt sind und die ersten Vermietungen abgeschlossen sind.
          </p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-graphite-100 text-graphite-500">
                <th className="pb-3 font-medium">Zeitraum</th>
                <th className="pb-3 font-medium">Betrag</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-graphite-50">
                  <td className="py-3">
                    {formatDate(p.periodFrom)} – {formatDate(p.periodTo)}
                  </td>
                  <td className="py-3 font-semibold">{formatCurrency(p.amount.toString(), p.currency)}</td>
                  <td className="py-3">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
