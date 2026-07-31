import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isEmailConfigured } from "@/lib/email";
import { enqueuePasswordReset } from "@/server/services/passwordResetDeliveryService";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const GENERIC_MESSAGE =
  "Wenn ein Konto mit dieser E-Mail-Adresse existiert, erhalten Sie in Kürze einen Link.";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`forgot-password:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte versuchen Sie es später erneut." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.email) {
    return NextResponse.json(
      { message: GENERIC_MESSAGE, deliveryDelayed: !isEmailConfigured() },
      { status: 202 }
    );
  }

  const { raw, hash } = generateVerificationToken();
  await enqueuePasswordReset(user.id, hash, raw, new Date(Date.now() + TOKEN_TTL_MS));
  return NextResponse.json({ message: GENERIC_MESSAGE, deliveryDelayed: !isEmailConfigured() }, { status: 202 });
}
