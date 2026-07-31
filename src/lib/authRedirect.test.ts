import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeReturnTo } from "./authRedirect";

describe("safeReturnTo", () => {
  it("keeps local paths including booking dates", () => {
    assert.equal(
      safeReturnTo("/anhaenger/test?startDate=2030-06-10&endDate=2030-06-12"),
      "/anhaenger/test?startDate=2030-06-10&endDate=2030-06-12"
    );
  });

  it("rejects external and protocol-relative redirects", () => {
    assert.equal(safeReturnTo("https://example.com/phishing"), "/");
    assert.equal(safeReturnTo("//example.com/phishing"), "/");
  });
});

