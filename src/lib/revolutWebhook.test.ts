import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  isFreshRevolutWebhookTimestamp,
  verifyRevolutWebhookSignature,
} from "./revolutWebhook";

describe("Revolut webhook timestamp", () => {
  const now = 1_800_000_000_000;

  it("accepts timestamps within five minutes", () => {
    assert.equal(isFreshRevolutWebhookTimestamp(String(now - 299_999), now), true);
  });

  it("rejects old, future and malformed timestamps", () => {
    assert.equal(isFreshRevolutWebhookTimestamp(String(now - 300_001), now), false);
    assert.equal(isFreshRevolutWebhookTimestamp(String(now + 300_001), now), false);
    assert.equal(isFreshRevolutWebhookTimestamp("not-a-timestamp", now), false);
  });
});

describe("Revolut webhook signature", () => {
  const rawBody = '{"event":"ORDER_COMPLETED","order_id":"00000000-0000-4000-8000-000000000000"}';
  const timestamp = "1800000000000";
  const secret = "test-webhook-secret";
  const signature = createHmac("sha256", secret)
    .update(`v1.${timestamp}.${rawBody}`)
    .digest("hex");

  it("accepts a valid signature, including during secret rotation", () => {
    assert.equal(
      verifyRevolutWebhookSignature({
        rawBody,
        timestampHeader: timestamp,
        signatureHeader: `v1=${"0".repeat(64)}, v1=${signature}`,
        secret,
      }),
      true
    );
  });

  it("rejects altered payloads and malformed signatures", () => {
    assert.equal(
      verifyRevolutWebhookSignature({
        rawBody: `${rawBody} `,
        timestampHeader: timestamp,
        signatureHeader: `v1=${signature}`,
        secret,
      }),
      false
    );
    assert.equal(
      verifyRevolutWebhookSignature({
        rawBody,
        timestampHeader: timestamp,
        signatureHeader: "v1=not-hex",
        secret,
      }),
      false
    );
  });
});
