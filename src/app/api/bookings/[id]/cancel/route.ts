import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { cancelBookingByRenter, BookingCancellationError } from "@/server/services/bookingCancellationService";

const schema = z.object({ reason: z.string().trim().max(1000).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  try {
    const { id } = await params;
    const result = await cancelBookingByRenter({ bookingId: id, actor: session, reason: parsed.data.reason, requestId: req.headers.get("x-request-id") });
    if (result.outcome === "pending_review") {
      return NextResponse.json({
        cancelled: false,
        pendingReview: true,
        message: "Die Rückzahlung wird geprüft. Sie erhalten eine Benachrichtigung, sobald die Stornierung abgeschlossen ist.",
      }, { status: 202 });
    }
    return NextResponse.json({ cancelled: true, reversal: result.reversal });
  } catch (error) {
    if (!(error instanceof BookingCancellationError)) throw error;
    const responses: Record<string, [string, number]> = {
      NOT_FOUND: ["Buchung nicht gefunden", 404], FORBIDDEN: ["Keine Berechtigung", 403],
      RENTAL_STARTED: ["Nach Beginn der Abholung ist eine automatische Stornierung nicht mehr möglich.", 409],
      ALREADY_FINAL: ["Diese Buchung ist bereits abgeschlossen oder storniert.", 409],
      PAYMENT_INCONSISTENT: ["Der Zahlungsstatus muss vor der Stornierung geprüft werden.", 409],
      CONCURRENT_CHANGE: ["Die Buchung wurde zwischenzeitlich geändert.", 409],
    };
    if (error.code.startsWith("REFUND_REVIEW_")) {
      return NextResponse.json({ error: "Die Rückerstattungsprüfung ist derzeit nicht verfügbar. Bitte kontaktieren Sie den Support." }, { status: 503 });
    }
    const [message, status] = responses[error.code] ?? ["Stornierung nicht möglich", 409];
    return NextResponse.json({ error: message }, { status });
  }
}
