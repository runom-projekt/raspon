import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  BOOKING_PAYMENT_WINDOW_MS,
  bookingExpiresAt,
  isBookingExpired,
} from "./bookingExpiry";

describe("booking payment expiry", () => {
  test("reserves the schedule for exactly thirty minutes", () => {
    const createdAt = new Date("2030-01-01T10:00:00.000Z");
    assert.equal(
      bookingExpiresAt(createdAt).toISOString(),
      "2030-01-01T10:30:00.000Z"
    );
    assert.equal(
      bookingExpiresAt(createdAt).getTime() - createdAt.getTime(),
      BOOKING_PAYMENT_WINDOW_MS
    );
  });

  test("expires at the boundary, not one millisecond earlier", () => {
    const expiresAt = new Date("2030-01-01T10:30:00.000Z");
    assert.equal(isBookingExpired(expiresAt, new Date(expiresAt.getTime() - 1)), false);
    assert.equal(isBookingExpired(expiresAt, expiresAt), true);
  });
});
