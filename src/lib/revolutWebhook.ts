import { createHmac, timingSafeEqual } from "crypto";

export const REVOLUT_WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

export function isFreshRevolutWebhookTimestamp(
  timestampHeader: string | null,
  nowMs = Date.now()
): boolean {
  if (!timestampHeader || !/^\d+$/.test(timestampHeader)) return false;
  const timestampMs = Number(timestampHeader);
  return (
    Number.isSafeInteger(timestampMs) &&
    Math.abs(nowMs - timestampMs) <= REVOLUT_WEBHOOK_TOLERANCE_MS
  );
}

export function verifyRevolutWebhookSignature({
  rawBody,
  signatureHeader,
  timestampHeader,
  secret,
}: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
}): boolean {
  if (!signatureHeader || !timestampHeader) return false;

  const payloadToSign = `v1.${timestampHeader}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(payloadToSign).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatureHeader.split(",").some((part) => {
    const signature = part.trim();
    if (!/^v1=[0-9a-f]{64}$/i.test(signature)) return false;
    const providedBuffer = Buffer.from(signature.slice(3), "hex");
    return timingSafeEqual(providedBuffer, expectedBuffer);
  });
}

