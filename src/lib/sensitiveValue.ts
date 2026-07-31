import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function encryptionKey(value = process.env.TWO_FACTOR_ENCRYPTION_KEY): Buffer {
  if (!value) throw new Error("TWO_FACTOR_ENCRYPTION_KEY is missing");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("TWO_FACTOR_ENCRYPTION_KEY must be 32 bytes in base64");
  return key;
}

export function encryptSensitiveValue(value: string, keyValue?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(keyValue), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSensitiveValue(value: string, keyValue?: string): string {
  const [version, iv, tag, ciphertext, extra] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext || extra) throw new Error("Invalid encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(keyValue), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}
