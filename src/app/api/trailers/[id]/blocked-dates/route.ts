import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lockTrailerSchedule } from "@/server/services/bookingService";
import { z } from "zod";

const schema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().max(500).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Das Enddatum muss nach dem Startdatum liegen",
    path: ["endDate"],
  });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const { id } = await params;
  const trailer = await prisma.trailer.findUnique({ where: { id } });
  if (!trailer || (trailer.ownerId !== session.sub && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const blockedDate = await prisma.$transaction(async (tx) => {
    await lockTrailerSchedule(tx, id);

    const overlappingBooking = await tx.booking.findFirst({
      where: {
        trailerId: id,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        startDate: { lt: parsed.data.endDate },
        endDate: { gt: parsed.data.startDate },
      },
      select: { id: true },
    });
    if (overlappingBooking) return null;

    return tx.blockedDate.create({
      data: { trailerId: id, ...parsed.data },
    });
  });

  if (!blockedDate) {
    return NextResponse.json(
      { error: "Für diesen Zeitraum liegt bereits eine Buchung vor" },
      { status: 409 }
    );
  }

  return NextResponse.json({ blockedDate });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blockedDates = await prisma.blockedDate.findMany({ where: { trailerId: id } });
  return NextResponse.json({ blockedDates });
}
