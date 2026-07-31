import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptTotpSecret, hashRecoveryCode, verifyTotp } from "@/lib/totp";

export async function verifyAndConsumeSecondFactor(userId: string, encryptedSecret: string, suppliedCode: string): Promise<boolean> {
  const code = suppliedCode.trim().toUpperCase();
  if (/^\d{6}$/.test(code)) {
    let step: bigint | null = null;
    try {
      step = verifyTotp(decryptTotpSecret(encryptedSecret), code);
    } catch {
      return false;
    }
    if (step === null) return false;
    const consumed = await prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ twoFactorLastUsedStep: null }, { twoFactorLastUsedStep: { lt: step } }],
      },
      data: { twoFactorLastUsedStep: step },
    });
    return consumed.count === 1;
  }

  const consumed = await prisma.twoFactorRecoveryCode.updateMany({
    where: { userId, codeHash: hashRecoveryCode(userId, code), usedAt: null },
    data: { usedAt: new Date() },
  });
  return consumed.count === 1;
}
