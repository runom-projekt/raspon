import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getOrCreateRequestId } from "./requestId";

describe("getOrCreateRequestId", () => {
  it("keeps a valid UUID request ID", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    assert.equal(getOrCreateRequestId(id, () => "unused"), id);
  });

  it("replaces missing or malformed values", () => {
    const generated = "018f65a0-cafe-7000-8000-000000000001";
    assert.equal(getOrCreateRequestId(null, () => generated), generated);
    assert.equal(getOrCreateRequestId("attacker-controlled", () => generated), generated);
  });
});

