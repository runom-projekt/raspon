import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BookingStatus } from "@prisma/client";
import {
  canTransitionBookingStatus,
  decideBookingLifecycleTransition,
  type BookingActor,
} from "./bookingStatus";

const statuses: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
];
const actors: BookingActor[] = ["RENTER", "OWNER", "ADMIN", "PAYMENT_PROVIDER"];

const allowed = new Set([
  "PENDING:CONFIRMED:PAYMENT_PROVIDER",
  "PENDING:DECLINED:OWNER",
  "PENDING:DECLINED:ADMIN",
  "CONFIRMED:ACTIVE:OWNER",
  "CONFIRMED:ACTIVE:ADMIN",
  "ACTIVE:COMPLETED:OWNER",
  "ACTIVE:COMPLETED:ADMIN",
]);

describe("booking status transitions", () => {
  for (const from of statuses) {
    for (const to of statuses) {
      for (const actor of actors) {
        const key = `${from}:${to}:${actor}`;
        it(`${key} is ${allowed.has(key) ? "allowed" : "rejected"}`, () => {
          assert.equal(canTransitionBookingStatus(from, to, actor), allowed.has(key));
        });
      }
    }
  }
});

describe("booking lifecycle safeguards", () => {
  const base = {
    actor: "OWNER" as const,
    paymentStatus: "PAID" as const,
    hasProviderOrder: true,
    startDate: new Date("2030-01-10T10:00:00Z"),
    endDate: new Date("2030-01-12T10:00:00Z"),
  };

  it("requires a paid booking and the pickup window before activation", () => {
    assert.deepEqual(decideBookingLifecycleTransition({ ...base, from: "CONFIRMED", to: "ACTIVE", paymentStatus: "AUTHORIZED", now: base.startDate }), { allowed: false, reason: "PAYMENT_REQUIRED" });
    assert.deepEqual(decideBookingLifecycleTransition({ ...base, from: "CONFIRMED", to: "ACTIVE", now: new Date("2030-01-10T09:59:59Z") }), { allowed: false, reason: "PICKUP_TOO_EARLY" });
    assert.deepEqual(decideBookingLifecycleTransition({ ...base, from: "CONFIRMED", to: "ACTIVE", now: base.startDate }), { allowed: true });
  });

  it("prevents an owner from releasing earnings before the scheduled return", () => {
    assert.deepEqual(decideBookingLifecycleTransition({ ...base, from: "ACTIVE", to: "COMPLETED", now: new Date("2030-01-12T09:59:59Z") }), { allowed: false, reason: "RETURN_TOO_EARLY" });
    assert.deepEqual(decideBookingLifecycleTransition({ ...base, from: "ACTIVE", to: "COMPLETED", now: base.endDate }), { allowed: true });
  });

  it("does not decline a booking once a provider order exists", () => {
    assert.deepEqual(decideBookingLifecycleTransition({ ...base, from: "PENDING", to: "DECLINED", paymentStatus: "REQUIRES_PAYMENT", now: new Date(), hasProviderOrder: true }), { allowed: false, reason: "PAYMENT_IN_PROGRESS" });
  });
});
