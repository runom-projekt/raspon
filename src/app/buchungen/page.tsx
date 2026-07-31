import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Meine Buchungen" };

export default async function MyBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/anmelden");

  const bookings = await prisma.booking.findMany({
    where: { renterId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      trailer: {
        select: { title: true, slug: true, city: true, photos: { take: 1, orderBy: { position: "asc" } } },
      },
    },
  });

  return (
    <>
      <Header />
      <main className="container-page py-10">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-graphite-100 bg-white p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite-400">Mein Konto</p>
            <p className="truncate text-sm text-graphite-700">{session.email}</p>
          </div>
          <LogoutButton className="shrink-0" />
        </div>
        <h1 className="mb-6 font-display text-2xl font-bold text-graphite-900">Meine Buchungen</h1>

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-graphite-200 py-20 text-center text-graphite-500">
            Sie haben noch keine Buchungen.{" "}
            <Link href="/anhaenger" className="font-semibold text-accent-600 underline">
              Anhänger finden
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <Link
                key={b.id}
                href={`/buchungen/${b.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-graphite-100 bg-white p-4 hover:shadow-card sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-graphite-100 sm:h-20 sm:w-28">
                  {b.trailer.photos[0] && (
                    <Image src={b.trailer.photos[0].url} alt={b.trailer.title} fill className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-graphite-900">{b.trailer.title}</p>
                  <p className="text-sm text-graphite-500">
                    {b.trailer.city} · {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-graphite-400">{b.code}</p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start sm:text-right">
                  <p className="font-semibold text-graphite-900">
                    {formatCurrency(b.totalAmount.toString(), b.currency)}
                  </p>
                  <span className="inline-block shrink-0 rounded-full bg-graphite-100 px-2.5 py-1 text-xs font-semibold text-graphite-700 sm:mt-1">
                    {b.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
