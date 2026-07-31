import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSessionVersionValid } from "./sessionVersion";

describe("session revocation", () => {
  it("accepts only the exact current session version", () => {
    assert.equal(isSessionVersionValid(3, 3), true);
    assert.equal(isSessionVersionValid(2, 3), false);
    assert.equal(isSessionVersionValid(undefined, 0), false);
    assert.equal(isSessionVersionValid("3", 3), false);
  });
});
