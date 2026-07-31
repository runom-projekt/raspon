import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  BookingLifecycleError,
  transitionBookingLifecycle,
} from "@/server/services/bookingLifecycleService";

const schema = z.object({ status: z.enum(["DECLINED", "ACTIVE", "COMPLETED"]) });

const statusForCode: Record<string, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  PAYMENT_INCONSISTENT: 409,
  TRANSITION_NOT_ALLOWED: 409,
  PAYMENT_REQUIRED: 409,
  PAYMENT_IN_PROGRESS: 409,
  PICKUP_TOO_EARLY: 409,
  PICKUP_PERIOD_ENDED: 409,
  RETURN_TOO_EARLY: 409,
  CONCURRENT_CHANGE: 409,
};

const messageForCode: Record<string, string> = {
  NOT_FOUND: "Buchung nicht gefunden",
  FORBIDDEN: "Keine Berechtigung",
  PAYMENT_INCONSISTENT: "Die Zahlungsdaten der Buchung sind unvollständig",
  TRANSITION_NOT_ALLOWED: "Dieser Statuswechsel ist nicht erlaubt",
  PAYMENT_REQUIRED: "Die Buchung muss zuerst vollständig bezahlt sein",
  PAYMENT_IN_PROGRESS: "Die Zahlung wird bereits verarbeitet; die Buchung kann jetzt nicht abgelehnt werden",
  PICKUP_TOO_EARLY: "Die Abholung kann erst zum vereinbarten Mietbeginn bestätigt werden",
  PICKUP_PERIOD_ENDED: "Der Abholzeitraum ist bereits abgelaufen; bitte den Support kontaktieren",
  RETURN_TOO_EARLY: "Die Rückgabe kann erst zum vereinbarten Mietende bestätigt werden",
  CONCURRENT_CHANGE: "Die Buchung wurde zwischenzeitlich geändert",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  try {
    const { id } = await params;
    const booking = await transitionBookingLifecycle({
      bookingId: id,
      targetStatus: parsed.data.status,
      actor: session,
      requestId: req.headers.get("x-request-id"),
    });
    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof BookingLifecycleError) {
      return NextResponse.json(
        { error: messageForCode[error.code] ?? "Buchung konnte nicht aktualisiert werden" },
        { status: statusForCode[error.code] ?? 409 }
      );
    }
    throw error;
  }
}
