import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { createSessionToken, generateVerificationToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/constants";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte versuchen Sie es später erneut." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Daten", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, phone, password, role } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ein Konto mit dieser E-Mail-Adresse oder Telefonnummer existiert bereits" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, phone, passwordHash, role },
  });

  const token = await createSessionToken({ sub: user.id, email: user.email, role: user.role, sessionVersion: user.sessionVersion });
  await setSessionCookie(token);

  let emailSent = false;
  if (isEmailConfigured() && user.email) {
    try {
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
      emailSent = true;
    } catch (err) {
      console.error("Verifizierungs-E-Mail konnte nicht gesendet werden:", err);
    }
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    emailSent,
  });
}
