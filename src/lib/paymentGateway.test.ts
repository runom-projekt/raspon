import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPaymentGatewayToken, signGatewayCallback, verifyGatewayCallback, verifyPaymentGatewayToken } from "./paymentGateway";

const secret = "s".repeat(32);
const now = Date.parse("2030-01-01T00:00:00Z");

describe("HMS payment gateway protocol", () => {
  it("signs and validates short-lived checkout claims", () => {
    const token = createPaymentGatewayToken({ paymentId: "pay_1", bookingCode: "RSP-ABC", amountMinor: 1234, currency: "EUR", returnUrl: "https://raspon.de/buchungen/1" }, secret, now);
    assert.equal(verifyPaymentGatewayToken(token, secret, now)?.amountMinor, 1234);
    assert.equal(verifyPaymentGatewayToken(token, secret, now + 15 * 60 * 1000 + 1), null);
    assert.equal(verifyPaymentGatewayToken(`${token}x`, secret, now), null);
  });
  it("rejects stale and modified callbacks", () => {
    const body = JSON.stringify({ eventId: "evt_1" });
    const timestamp = String(now);
    const signed = signGatewayCallback(body, timestamp, secret);
    assert.equal(verifyGatewayCallback({ rawBody: body, timestamp, suppliedSignature: signed, secret, nowMs: now }), true);
    assert.equal(verifyGatewayCallback({ rawBody: `${body} `, timestamp, suppliedSignature: signed, secret, nowMs: now }), false);
    assert.equal(verifyGatewayCallback({ rawBody: body, timestamp, suppliedSignature: signed, secret, nowMs: now + 300_001 }), false);
  });
});
