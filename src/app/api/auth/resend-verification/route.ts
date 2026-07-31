import { NextRequest, NextResponse } from "next/server";
import { getSession, generateVerificationToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/constants";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Anmeldung erforderlich" }, { status: 401 });

  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`resend-verification:${session.sub}:${ip}`, { limit: 3, windowMs: 15 * 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte versuchen Sie es später erneut." },
      { status: 429 }
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "E-Mail-Versand ist derzeit nicht verfügbar" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return NextResponse.json({ error: "Konto nicht gefunden" }, { status: 404 });
  if (!user.email) {
    return NextResponse.json({ error: "Für dieses Konto ist keine E-Mail-Adresse hinterlegt" }, { status: 400 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "E-Mail-Adresse ist bereits bestätigt" }, { status: 400 });
  }

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  const { raw, hash } = generateVerificationToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${SITE_URL}/email-bestaetigen?token=${raw}`;
  await sendVerificationEmail(user.email, user.firstName, verifyUrl);

  return NextResponse.json({ success: true });
}
