import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTotp, decryptTotpSecret, encryptTotpSecret, hashRecoveryCode, verifyTotp } from "./totp";

describe("TOTP security", () => {
  it("matches the RFC 6238 SHA-1 test vector truncated to six digits", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    assert.equal(createTotp(secret, 1n), "287082");
    assert.equal(verifyTotp(secret, "287082", 59_000), 1n);
  });

  it("encrypts secrets with authenticated encryption", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptTotpSecret("JBSWY3DPEHPK3PXP", key);
    assert.notEqual(encrypted, "JBSWY3DPEHPK3PXP");
    assert.equal(decryptTotpSecret(encrypted, key), "JBSWY3DPEHPK3PXP");
    const parts = encrypted.split(".");
    const tag = parts[2]!;
    parts[2] = `${tag[0] === "A" ? "B" : "A"}${tag.slice(1)}`;
    assert.throws(() => decryptTotpSecret(parts.join("."), key));
  });

  it("binds recovery code hashes to a user", () => {
    assert.notEqual(hashRecoveryCode("user-a", "AAAA-BBBB"), hashRecoveryCode("user-b", "AAAA-BBBB"));
  });
});
