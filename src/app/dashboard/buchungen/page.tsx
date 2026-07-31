import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BookingStatusActions } from "@/components/dashboard/BookingStatusActions";
import { StartConversationButton } from "@/components/booking/StartConversationButton";

export const metadata: Metadata = { title: "Buchungen" };

export default async function OwnerBookingsPage() {
  const session = await getSession();
  const bookings = await prisma.booking.findMany({
    where: { trailer: { ownerId: session!.sub } },
    orderBy: { createdAt: "desc" },
    include: {
      trailer: { select: { title: true, slug: true } },
      renter: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-900">Buchungen</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-graphite-100 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-graphite-100 text-graphite-500">
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Anhänger</th>
              <th className="p-4 font-medium">Mieter</th>
              <th className="p-4 font-medium">Zeitraum</th>
              <th className="p-4 font-medium">Betrag</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-graphite-50">
                <td className="p-4 font-mono text-xs">{b.code}</td>
                <td className="p-4 font-medium text-graphite-900">{b.trailer.title}</td>
                <td className="p-4">
                  {b.renter.firstName} {b.renter.lastName}
                </td>
                <td className="p-4 text-graphite-600">
                  {formatDate(b.startDate)} – {formatDate(b.endDate)}
                </td>
                <td className="p-4 font-semibold">{formatCurrency(b.totalAmount.toString(), b.currency)}</td>
                <td className="p-4">
                  <span className="rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold">
                    {b.status}
                  </span>
                </td>
                <td className="p-4">
                  <BookingStatusActions bookingId={b.id} status={b.status} />
                  <div className="mt-2"><StartConversationButton bookingId={b.id} recipientId={b.renterId} destination="/dashboard/nachrichten" compact /></div>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-graphite-500">
                  Keine Buchungen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
