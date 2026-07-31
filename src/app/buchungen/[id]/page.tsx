import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { PaymentPanel } from "@/components/booking/PaymentPanel";
import { CheckCircle2 } from "lucide-react";
import { CancellationPanel } from "@/components/booking/CancellationPanel";
import { ReviewForm } from "@/components/booking/ReviewForm";
import { StartConversationButton } from "@/components/booking/StartConversationButton";
import { PaymentReturnNotice } from "@/components/booking/PaymentReturnNotice";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function BookingSummaryPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/anmelden");

  const { id } = await params;
  const { payment: paymentResult } = await searchParams;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      trailer: { include: { photos: { take: 1, orderBy: { position: "asc" } }, owner: true } },
      payment: true,
      paymentReversal: true,
      review: true,
    },
  });

  if (!booking || booking.renterId !== session.sub) notFound();

  return (
    <>
      <Header />
      <main className="container-page max-w-2xl py-12">
        <PaymentReturnNotice paymentResult={paymentResult} paid={booking.payment?.status === "PAID"} />
        {booking.payment?.status === "PAID" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 size={20} /> Zahlung erfolgreich abgeschlossen. Vielen Dank!
          </div>
        )}

        <h1 className="font-display text-2xl font-bold text-graphite-900">Buchung {booking.code}</h1>
        <p className="mt-1 text-sm text-graphite-500">{booking.trailer.title}</p>

        <div className="mt-6 rounded-2xl border border-graphite-100 bg-white p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-graphite-500">Abholung</dt>
              <dd className="font-medium text-graphite-900">{formatDate(booking.startDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite-500">Rückgabe</dt>
              <dd className="font-medium text-graphite-900">{formatDate(booking.endDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite-500">Betrag</dt>
              <dd className="font-medium text-graphite-900">
                {formatCurrency(booking.totalAmount.toString(), booking.currency)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-graphite-100 pt-3">
              <dt className="text-graphite-500">Buchungsstatus</dt>
              <dd className="font-semibold text-graphite-900">{booking.status}</dd>
            </div>
            {booking.status === "PENDING" && (
              <div className="flex justify-between">
                <dt className="text-graphite-500">Zahlungsfrist</dt>
                <dd className="font-medium text-amber-700">{formatDateTime(booking.expiresAt)}</dd>
              </div>
            )}
          </dl>
        </div>
        <StartConversationButton bookingId={booking.id} recipientId={booking.trailer.owner.id} destination="/nachrichten" />

        {booking.status === "PENDING" &&
          booking.payment &&
          booking.payment.status !== "PAID" && (
          <div className="mt-6">
            <PaymentPanel bookingId={booking.id} />
          </div>
        )}

        {booking.paymentReversal && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Rückzahlung: <strong>{booking.paymentReversal.status}</strong>
          </div>
        )}
        {(["PENDING", "CONFIRMED"] as const).includes(booking.status as "PENDING" | "CONFIRMED") && booking.startDate > new Date() && (
          <CancellationPanel bookingId={booking.id} paid={booking.payment?.status === "PAID"} />
        )}
        {booking.status === "COMPLETED" && booking.payment?.status === "PAID" && !booking.review && (
          <ReviewForm bookingId={booking.id} />
        )}
        {booking.review && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Vielen Dank. Sie haben diese Vermietung mit <strong>{booking.review.rating} von 5 Sternen</strong> bewertet.
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
