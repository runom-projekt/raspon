import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decryptSensitiveValue, encryptSensitiveValue } from "./sensitiveValue";

describe("encrypted sensitive values", () => {
  const key = Buffer.alloc(32, 7).toString("base64");

  it("round-trips without storing the plaintext", () => {
    const encrypted = encryptSensitiveValue("one-time-reset-token", key);
    assert.ok(!encrypted.includes("one-time-reset-token"));
    assert.equal(decryptSensitiveValue(encrypted, key), "one-time-reset-token");
  });

  it("rejects tampering", () => {
    const encrypted = encryptSensitiveValue("secret", key);
    const parts = encrypted.split(".");
    const ciphertext = parts[3]!;
    parts[3] = `${ciphertext[0] === "A" ? "B" : "A"}${ciphertext.slice(1)}`;
    assert.throws(() => decryptSensitiveValue(parts.join("."), key));
  });
});
