import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isSessionVersionValid } from "@/lib/sessionVersion";

const SESSION_COOKIE = "raspon_session";
const TWO_FACTOR_SETUP_COOKIE = "raspon_2fa_setup";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const TWO_FACTOR_SETUP_DURATION_SECONDS = 10 * 60;

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Umgebungsvariable JWT_SECRET fehlt");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // userId
  email: string | null;
  role: UserRole;
  mfa?: boolean;
  sessionVersion?: number;
  [key: string]: unknown;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createTwoFactorSetupToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, purpose: "two_factor_setup" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TWO_FACTOR_SETUP_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function setTwoFactorSetupCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_SETUP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TWO_FACTOR_SETUP_DURATION_SECONDS,
  });
}

export async function getTwoFactorSetupUserId(): Promise<string | null> {
  const token = (await cookies()).get(TWO_FACTOR_SETUP_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.purpose === "two_factor_setup" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function clearTwoFactorSetupCookie() {
  (await cookies()).delete(TWO_FACTOR_SETUP_COOKIE);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  // JWT potwierdza autentyczność sesji, ale bieżące uprawnienia pochodzą z bazy.
  // Dzięki temu zawieszenie konta i zmiana roli działają bez oczekiwania na wygaśnięcie tokenu.
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, status: true, twoFactorEnabled: true, sessionVersion: true },
  });
  if (!user || user.status === "SUSPENDED") return null;
  if (!isSessionVersionValid(payload.sessionVersion, user.sessionVersion)) return null;
  if (user.role === "ADMIN" && (!user.twoFactorEnabled || payload.mfa !== true)) return null;

  return {
    ...payload,
    sub: user.id,
    email: user.email,
    role: user.role,
  };
}


export function generateVerificationToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashVerificationToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export { SESSION_COOKIE, TWO_FACTOR_SETUP_COOKIE };
