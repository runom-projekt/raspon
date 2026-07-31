import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { createSessionToken, createTwoFactorSetupToken, setSessionCookie, setTwoFactorSetupCookie, verifyPassword } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";
import { verifyAndConsumeSecondFactor } from "@/server/services/twoFactorService";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Zu viele Anmeldeversuche. Bitte versuchen Sie es in ein paar Minuten erneut." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const { identifier, password, twoFactorCode } = parsed.data;
  const isEmail = identifier.includes("@");
  const user = isEmail
    ? await prisma.user.findUnique({ where: { email: identifier.trim().toLowerCase() } })
    : await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } });

  // Bewusst generische Fehlermeldung — wir verraten nicht, ob das Konto existiert.
  const invalidCredentials = () =>
    NextResponse.json({ error: "Ungültige Anmeldedaten" }, { status: 401 });

  if (!user) return invalidCredentials();

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) return invalidCredentials();

  if (user.status === "SUSPENDED") {
    return NextResponse.json({ error: "Das Konto wurde gesperrt. Bitte kontaktieren Sie den Support." }, { status: 403 });
  }

  if (user.role === "ADMIN") {
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      await setTwoFactorSetupCookie(await createTwoFactorSetupToken(user.id));
      return NextResponse.json({ requiresTwoFactorSetup: true });
    }
    if (!twoFactorCode) return NextResponse.json({ requiresTwoFactor: true });
    if (!(await verifyAndConsumeSecondFactor(user.id, user.twoFactorSecret, twoFactorCode))) {
      return NextResponse.json({ error: "Ungültiger oder bereits verwendeter Sicherheitscode" }, { status: 401 });
    }
  }

  const token = await createSessionToken({ sub: user.id, email: user.email, role: user.role, mfa: user.role === "ADMIN", sessionVersion: user.sessionVersion });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
  });
}
