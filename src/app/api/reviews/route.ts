import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reviewCreateSchema } from "@/lib/validation";
import { createBookingReview, ReviewError } from "@/server/services/reviewService";

const responseByCode = {
  NOT_FOUND: [404, "Buchung nicht gefunden"],
  FORBIDDEN: [404, "Buchung nicht gefunden"],
  BOOKING_NOT_COMPLETED: [409, "Sie können nur abgeschlossene Vermietungen bewerten"],
  PAYMENT_REQUIRED: [409, "Nur vollständig bezahlte Vermietungen können bewertet werden"],
  ALREADY_REVIEWED: [409, "Diese Buchung wurde bereits bewertet"],
} as const;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });
  const parsed = reviewCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  try {
    const review = await createBookingReview({
      ...parsed.data,
      actor: session,
      requestId: req.headers.get("x-request-id"),
    });
    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof ReviewError) {
      const [status, message] = responseByCode[error.code];
      return NextResponse.json({ error: message }, { status });
    }
    throw error;
  }
}
