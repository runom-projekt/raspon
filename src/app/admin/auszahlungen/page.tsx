import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StatusToggleButton } from "@/components/admin/StatusToggleButton";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Auszahlungen | Admin-Panel" };

export default async function AdminPayoutsPage() {
  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { firstName: true, lastName: true, email: true } },
      booking: { select: { code: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Auszahlungen</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-graphite-100 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-graphite-100 text-graphite-500">
              <th className="p-4 font-medium">Vermieter</th>
              <th className="p-4 font-medium">Zeitraum</th>
              <th className="p-4 font-medium">Buchung</th>
              <th className="p-4 font-medium">Betrag</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Angefordert</th>
              <th className="p-4 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b border-graphite-50">
                <td className="p-4 font-medium text-graphite-900">
                  {p.owner.firstName} {p.owner.lastName}
                  <div className="text-xs font-normal text-graphite-500">{p.owner.email}</div>
                </td>
                <td className="p-4 text-graphite-600">
                  {formatDate(p.periodFrom)} – {formatDate(p.periodTo)}
                </td>
                <td className="p-4 font-mono text-xs text-graphite-600">{p.booking?.code ?? "Sammelauszahlung"}</td>
                <td className="p-4 font-semibold">{formatCurrency(p.amount.toString(), p.currency)}</td>
                <td className="p-4">
                  <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">{p.status}</span>
                </td>
                <td className="p-4 text-graphite-500">{formatDate(p.createdAt)}</td>
                <td className="p-4">
                  {p.status === "PENDING" && (
                    <div className="flex gap-2">
                      <StatusToggleButton
                        endpoint={`/api/admin/payouts/${p.id}/status`}
                        targetStatus="PAID"
                        label="Als bezahlt markieren"
                      />
                      <StatusToggleButton
                        endpoint={`/api/admin/payouts/${p.id}/status`}
                        targetStatus="FAILED"
                        label="Fehlgeschlagen"
                        variant="danger"
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-graphite-400">
                  Noch keine Auszahlungsanfragen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
