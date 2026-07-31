import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getNotificationRetryDelayMs,
  shouldRetryNotification,
} from "./notificationRetry";

describe("notification retry policy", () => {
  test("uses exponential backoff capped at six hours", () => {
    assert.equal(getNotificationRetryDelayMs(1), 60_000);
    assert.equal(getNotificationRetryDelayMs(2), 120_000);
    assert.equal(getNotificationRetryDelayMs(20), 6 * 60 * 60 * 1000);
  });

  test("stops retrying after eight attempts", () => {
    assert.equal(shouldRetryNotification(7), true);
    assert.equal(shouldRetryNotification(8), false);
  });
});
