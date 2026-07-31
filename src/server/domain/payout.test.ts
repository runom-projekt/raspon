import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateOutstandingPayout, canTransitionPayoutStatus } from "./payout";

describe("payout accounting", () => {
  it("subtracts commission and already reserved payouts", () => {
    assert.equal(calculateOutstandingPayout(100, 15, 25), 60);
    assert.equal(calculateOutstandingPayout(10.1, 1.01, 0), 9.09);
  });

  it("permits only explicit payout status transitions", () => {
    assert.equal(canTransitionPayoutStatus("PENDING", "PAID"), true);
    assert.equal(canTransitionPayoutStatus("PENDING", "FAILED"), true);
    assert.equal(canTransitionPayoutStatus("FAILED", "PENDING"), true);
    assert.equal(canTransitionPayoutStatus("PAID", "PENDING"), false);
    assert.equal(canTransitionPayoutStatus("PAID", "FAILED"), false);
  });
});
