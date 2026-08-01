import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeRefundRiskScore, getRunomConfig } from "./runom";

describe("computeRefundRiskScore", () => {
  it("returns 0 for a zero-amount refund", () => {
    assert.equal(computeRefundRiskScore(0, 200), 0);
  });
  it("returns exactly 0.5 at the configured auto-approve ceiling", () => {
    assert.equal(computeRefundRiskScore(200, 200), 0.5);
  });
  it("returns below 0.5 for amounts under the ceiling (auto-approve territory)", () => {
    assert.ok(computeRefundRiskScore(50, 200) < 0.5);
    assert.ok(computeRefundRiskScore(199, 200) < 0.5);
  });
  it("returns at least 0.5 for amounts at or above the ceiling (review territory)", () => {
    assert.ok(computeRefundRiskScore(200, 200) >= 0.5);
    assert.ok(computeRefundRiskScore(500, 200) >= 0.5);
  });
  it("clamps at 1 for amounts far above the ceiling", () => {
    assert.equal(computeRefundRiskScore(10_000, 200), 1);
  });
  it("rejects a negative amount", () => {
    assert.throws(() => computeRefundRiskScore(-1, 200), RangeError);
  });
  it("rejects a non-positive ceiling", () => {
    assert.throws(() => computeRefundRiskScore(100, 0), RangeError);
  });
});

describe("getRunomConfig", () => {
  it("returns null when any required variable is missing", () => {
    assert.equal(getRunomConfig({}), null);
    assert.equal(getRunomConfig({ RUNOM_API_URL: "http://x" }), null);
  });
  it("returns a normalized config (trailing slash stripped) when fully configured", () => {
    const config = getRunomConfig({
      RUNOM_API_URL: "http://127.0.0.1:3200/",
      RUNOM_AGENT_ID: "agent-1",
      RUNOM_AGENT_TOKEN: "token-1",
      RUNOM_OWNER_USER_ID: "user-1",
    });
    assert.deepEqual(config, {
      apiUrl: "http://127.0.0.1:3200",
      agentId: "agent-1",
      agentToken: "token-1",
      ownerUserId: "user-1",
    });
  });
});
