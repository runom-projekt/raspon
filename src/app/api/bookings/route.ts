import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { bookingCreateSchema } from "@/lib/validation";
import { createBooking, BookingConflictError, BookingNotFoundError } from "@/server/services/bookingService";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { getIntegrationReadiness } from "@/lib/integrationReadiness";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sie müssen angemeldet sein, um eine Buchung vorzunehmen" }, { status: 401 });
  }
  if (getIntegrationReadiness().payments !== "configured") {
    return NextResponse.json(
      { error: "Online-Zahlungen sind derzeit nicht verfügbar" },
      { status: 503 }
    );
  }

  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`booking:${ip}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte versuchen Sie es später erneut." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Buchungsdaten", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const booking = await createBooking({
      trailerId: parsed.data.trailerId,
      renterId: session.sub,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      discountCode: parsed.data.discountCode,
    });
    return NextResponse.json({ booking });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof BookingNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Buchung konnte nicht erstellt werden" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { renterId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      trailer: { select: { title: true, slug: true, city: true, photos: { take: 1, orderBy: { position: "asc" } } } },
    },
  });

  return NextResponse.json({ bookings });
}
