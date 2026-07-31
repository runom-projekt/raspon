import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  clearTwoFactorSetupCookie,
  createSessionToken,
  getTwoFactorSetupUserId,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createOtpAuthUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotp,
} from "@/lib/totp";
import { appendAuditLog } from "@/server/services/auditService";

const confirmSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

async function setupUser() {
  const userId = await getTwoFactorSetupUserId();
  if (!userId) return null;
  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", status: "ACTIVE", twoFactorEnabled: false },
    select: { id: true, email: true, role: true, twoFactorSecret: true, sessionVersion: true },
  });
}

export async function GET() {
  const user = await setupUser();
  if (!user) return NextResponse.json({ error: "Einrichtungssitzung abgelaufen" }, { status: 401 });
  let secret: string;
  if (user.twoFactorSecret) {
    try { secret = decryptTotpSecret(user.twoFactorSecret); }
    catch { return NextResponse.json({ error: "2FA-Konfiguration ist beschädigt" }, { status: 500 }); }
  } else {
    secret = generateTotpSecret();
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: encryptTotpSecret(secret) } });
  }
  return NextResponse.json(
    { secret, otpAuthUri: createOtpAuthUri({ secret, email: user.email }) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const user = await setupUser();
  if (!user?.twoFactorSecret) return NextResponse.json({ error: "Einrichtungssitzung abgelaufen" }, { status: 401 });
  const parsed = confirmSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Sicherheitscode" }, { status: 400 });

  let step: bigint | null = null;
  try { step = verifyTotp(decryptTotpSecret(user.twoFactorSecret), parsed.data.code); }
  catch { return NextResponse.json({ error: "2FA-Konfiguration ist beschädigt" }, { status: 500 }); }
  if (step === null) return NextResponse.json({ error: "Ungültiger Sicherheitscode" }, { status: 401 });

  const recoveryCodes = generateRecoveryCodes();
  await prisma.$transaction(async (tx) => {
    const enabled = await tx.user.updateMany({
      where: { id: user.id, twoFactorEnabled: false },
      data: { twoFactorEnabled: true, twoFactorLastUsedStep: step },
    });
    if (enabled.count !== 1) throw new Error("TWO_FACTOR_ALREADY_ENABLED");
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } });
    await tx.twoFactorRecoveryCode.createMany({
      data: recoveryCodes.map((code) => ({ userId: user.id, codeHash: hashRecoveryCode(user.id, code) })),
    });
    await appendAuditLog(tx, {
      actor: { sub: user.id, email: user.email, role: "ADMIN" },
      requestId: req.headers.get("x-request-id"),
      action: "TWO_FACTOR_ENABLED",
      entityType: "User",
      entityId: user.id,
      changes: { recoveryCodeCount: recoveryCodes.length },
    });
  });
  await setSessionCookie(await createSessionToken({ sub: user.id, email: user.email, role: "ADMIN", mfa: true, sessionVersion: user.sessionVersion }));
  await clearTwoFactorSetupCookie();
  return NextResponse.json({ recoveryCodes }, { headers: { "Cache-Control": "no-store" } });
}
