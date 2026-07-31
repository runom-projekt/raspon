import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideRenterCancellation, getReversalRetryDelayMs } from "./bookingCancellation";

const future = new Date("2030-01-02T00:00:00Z");
const now = new Date("2030-01-01T00:00:00Z");

describe("renter cancellation policy", () => {
  it("cancels an unpaid local hold immediately", () => {
    assert.deepEqual(decideRenterCancellation({ bookingStatus: "PENDING", paymentStatus: "REQUIRES_PAYMENT", hasProviderOrder: false, startDate: future, now }), { allowed: true, reversal: "NONE" });
  });
  it("cancels a pending provider order before releasing it", () => {
    assert.deepEqual(decideRenterCancellation({ bookingStatus: "PENDING", paymentStatus: "REQUIRES_PAYMENT", hasProviderOrder: true, startDate: future, now }), { allowed: true, reversal: "CANCEL_ORDER" });
  });
  it("queues a full refund for a paid confirmed booking", () => {
    assert.deepEqual(decideRenterCancellation({ bookingStatus: "CONFIRMED", paymentStatus: "PAID", hasProviderOrder: true, startDate: future, now }), { allowed: true, reversal: "FULL_REFUND" });
  });
  it("rejects cancellation after pickup time", () => {
    assert.deepEqual(decideRenterCancellation({ bookingStatus: "CONFIRMED", paymentStatus: "PAID", hasProviderOrder: true, startDate: now, now }), { allowed: false, reason: "RENTAL_STARTED" });
  });
  it("caps retry backoff at six hours", () => {
    assert.equal(getReversalRetryDelayMs(1), 60_000);
    assert.equal(getReversalRetryDelayMs(20), 6 * 60 * 60 * 1000);
  });
});
