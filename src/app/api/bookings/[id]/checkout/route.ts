import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";
import { createPayPalOrder } from "@/lib/paypal";
import { createPaymentGatewayToken } from "@/lib/paymentGateway";
import { isBookingExpired } from "@/server/domain/bookingExpiry";
import { expirePendingBooking } from "@/server/services/bookingExpiryService";

const requestSchema = z.object({ method: z.enum(["PAYPAL", "BANK_TRANSFER"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte wählen Sie eine Zahlungsmethode" }, { status: 400 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { payment: true } });
  if (!booking || booking.renterId !== session.sub) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
  if (!booking.payment || booking.payment.status === "PAID") return NextResponse.json({ error: "Die Buchung wurde bereits bezahlt" }, { status: 400 });
  if (booking.status !== "PENDING") return NextResponse.json({ error: "Für diese Buchung ist keine Zahlung möglich" }, { status: 409 });

  const now = new Date();
  if (isBookingExpired(booking.expiresAt, now) && !booking.payment.providerPaymentId) {
    await expirePendingBooking(booking.id, now);
    return NextResponse.json({ error: "Die Zahlungsfrist ist abgelaufen. Bitte erstellen Sie eine neue Buchung." }, { status: 409 });
  }

  if (parsed.data.method === "BANK_TRANSFER") {
    const accountHolder = process.env.BANK_TRANSFER_ACCOUNT_HOLDER;
    const iban = process.env.BANK_TRANSFER_IBAN;
    if (!accountHolder || !iban) return NextResponse.json({ error: "Banküberweisung ist derzeit nicht verfügbar" }, { status: 503 });
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.payment.update({ where: { id: booking.payment.id }, data: { provider: "BANK_TRANSFER", providerPaymentId: null, providerCaptureId: null } }),
      prisma.booking.update({ where: { id: booking.id }, data: { expiresAt } }),
    ]);
    return NextResponse.json({ method: "BANK_TRANSFER", transfer: { accountHolder, iban, bic: process.env.BANK_TRANSFER_BIC ?? null, reference: booking.code, expiresAt } });
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return NextResponse.json({ error: "PayPal ist derzeit nicht verfügbar" }, { status: 503 });
  const stateSecret = process.env.PAYMENT_GATEWAY_SECRET;
  if (!stateSecret || stateSecret.length < 32) return NextResponse.json({ error: "PayPal ist derzeit nicht verfügbar" }, { status: 503 });
  const state = createPaymentGatewayToken({ paymentId: booking.payment.id, bookingCode: booking.code, amountMinor: booking.payment.amount.mul(100).toDecimalPlaces(0).toNumber(), currency: booking.payment.currency.toUpperCase(), returnUrl: `${SITE_URL}/buchungen/${booking.id}` }, stateSecret);
  const order = await createPayPalOrder({ paymentId: booking.payment.id, bookingCode: booking.code, amount: booking.payment.amount.toFixed(2), currency: booking.payment.currency.toUpperCase(), returnUrl: `${SITE_URL}/api/payments/paypal/return?state=${encodeURIComponent(state)}`, cancelUrl: `${SITE_URL}/buchungen/${booking.id}?payment=cancelled` });
  await prisma.$transaction([
    prisma.payment.update({ where: { id: booking.payment.id }, data: { provider: "PAYPAL", providerPaymentId: order.id, providerCaptureId: null } }),
    prisma.booking.update({ where: { id: booking.id }, data: { expiresAt: new Date(now.getTime() + 30 * 60 * 1000) } }),
  ]);
  return NextResponse.json({ method: "PAYPAL", url: order.approveUrl });
}
