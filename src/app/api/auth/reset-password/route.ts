import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashVerificationToken } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limited = await rateLimit(`reset-password:${ip}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte versuchen Sie es später erneut." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Der Link oder das neue Passwort ist ungültig.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tokenHash = hashVerificationToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetToken || resetToken.expiresAt <= new Date()) {
    if (resetToken) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    }
    return NextResponse.json(
      { error: "Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  try {
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.deleteMany({
        where: { id: resetToken.id, expiresAt: { gt: new Date() } },
      });
      if (consumed.count !== 1) {
        throw new Error("RESET_TOKEN_ALREADY_CONSUMED");
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });
      await tx.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RESET_TOKEN_ALREADY_CONSUMED") {
      return NextResponse.json(
        { error: "Der Link wurde bereits verwendet. Bitte fordern Sie einen neuen an." },
        { status: 400 }
      );
    }
    throw error;
  }

  return NextResponse.json({ success: true });
}
