import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decidePaymentCompletion } from "./paymentCompletion";

describe("payment completion compensation", () => {
  it("confirms a pending booking", () => {
    assert.equal(decidePaymentCompletion("PENDING", "REQUIRES_PAYMENT"), "CONFIRM_BOOKING");
  });

  it("queues a refund after cancellation or rejection", () => {
    assert.equal(decidePaymentCompletion("CANCELLED", "REQUIRES_PAYMENT"), "QUEUE_REFUND");
    assert.equal(decidePaymentCompletion("DECLINED", "AUTHORIZED"), "QUEUE_REFUND");
  });

  it("treats duplicate completion for an established booking idempotently", () => {
    assert.equal(decidePaymentCompletion("CONFIRMED", "PAID"), "ACCEPT_EXISTING");
    assert.equal(decidePaymentCompletion("ACTIVE", "PAID"), "ACCEPT_EXISTING");
    assert.equal(decidePaymentCompletion("COMPLETED", "PAID"), "ACCEPT_EXISTING");
  });
});
