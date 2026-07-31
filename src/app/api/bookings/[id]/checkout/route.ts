import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";
import { createPaymentGatewayToken, getPaymentGatewayUrl } from "@/lib/paymentGateway";
import { bookingExpiresAt, isBookingExpired } from "@/server/domain/bookingExpiry";
import { expirePendingBooking } from "@/server/services/bookingExpiryService";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { trailer: true, payment: true },
  });

  if (!booking || booking.renterId !== session.sub) {
    return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
  }
  if (!booking.payment || booking.payment.status === "PAID") {
    return NextResponse.json({ error: "Die Buchung wurde bereits bezahlt" }, { status: 400 });
  }
  if (booking.status !== "PENDING") {
    return NextResponse.json({ error: "Für diese Buchung ist keine Zahlung möglich" }, { status: 409 });
  }

  const now = new Date();
  if (isBookingExpired(booking.expiresAt, now) && !booking.payment.providerPaymentId) {
    await expirePendingBooking(booking.id, now);
    return NextResponse.json(
      { error: "Die Zahlungsfrist ist abgelaufen. Bitte erstellen Sie eine neue Buchung." },
      { status: 409 }
    );
  }

  const gatewaySecret = process.env.PAYMENT_GATEWAY_SECRET;
  if (!gatewaySecret || gatewaySecret.length < 32 || !process.env.PAYMENT_GATEWAY_URL) {
    return NextResponse.json(
      { error: "Online-Zahlungen sind derzeit nicht verfügbar." },
      { status: 503 }
    );
  }

  const lease = await prisma.booking.updateMany({
    where: {
      id: booking.id,
      status: "PENDING",
      ...(booking.payment.providerPaymentId
        ? {}
        : { expiresAt: { gt: now } }),
    },
    data: { expiresAt: bookingExpiresAt(now) },
  });
  if (lease.count !== 1) {
    return NextResponse.json(
      { error: "Die Zahlungsfrist ist abgelaufen. Bitte erstellen Sie eine neue Buchung." },
      { status: 409 }
    );
  }

  const token = createPaymentGatewayToken({
    paymentId: booking.payment.id,
    bookingCode: booking.code,
    amountMinor: booking.payment.amount.mul(100).toDecimalPlaces(0).toNumber(),
    currency: booking.payment.currency.toUpperCase(),
    returnUrl: `${SITE_URL}/buchungen/${booking.id}`,
  }, gatewaySecret);
  const gatewayUrl = getPaymentGatewayUrl();
  gatewayUrl.searchParams.set("token", token);
  return NextResponse.json({ url: gatewayUrl.toString() });
}
