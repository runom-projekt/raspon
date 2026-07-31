import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getClientIp } from "./clientIp";

describe("getClientIp", () => {
  it("ignores proxy headers when proxy trust is disabled", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.5, 203.0.113.10",
    });
    assert.equal(getClientIp(headers, false), "unknown");
  });

  it("prefers the address overwritten by the trusted nginx proxy", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "1.2.3.4, 203.0.113.10",
    });
    assert.equal(getClientIp(headers, true), "203.0.113.10");
  });

  it("uses only the closest valid forwarded address as a fallback", () => {
    const headers = new Headers({
      "x-forwarded-for": "attacker-controlled, 2001:db8::1",
    });
    assert.equal(getClientIp(headers, true), "2001:db8::1");
  });

  it("rejects malformed addresses", () => {
    assert.equal(
      getClientIp(new Headers({ "x-real-ip": "not-an-ip" }), true),
      "unknown"
    );
  });
});
