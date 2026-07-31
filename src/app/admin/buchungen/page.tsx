import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Buchungen | Admin-Panel" };

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      trailer: { select: { title: true } },
      renter: { select: { firstName: true, lastName: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Alle Buchungen</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-graphite-100 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-graphite-100 text-graphite-500">
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Anhänger</th>
              <th className="p-4 font-medium">Mieter</th>
              <th className="p-4 font-medium">Zeitraum</th>
              <th className="p-4 font-medium">Betrag</th>
              <th className="p-4 font-medium">Provision</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-graphite-50">
                <td className="p-4 font-mono text-xs">{b.code}</td>
                <td className="p-4 font-medium text-graphite-900">{b.trailer.title}</td>
                <td className="p-4">{b.renter.firstName} {b.renter.lastName}</td>
                <td className="p-4 text-graphite-600">
                  {formatDate(b.startDate)} – {formatDate(b.endDate)}
                </td>
                <td className="p-4 font-semibold">{formatCurrency(b.totalAmount.toString(), b.currency)}</td>
                <td className="p-4 text-graphite-600">{formatCurrency(b.commissionAmt.toString(), b.currency)}</td>
                <td className="p-4">
                  <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
