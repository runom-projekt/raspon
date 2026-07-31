import type { BookingStatus, PaymentStatus } from "@prisma/client";

export type BookingActor = "RENTER" | "OWNER" | "ADMIN" | "PAYMENT_PROVIDER";

type Transition = {
  from: BookingStatus;
  to: BookingStatus;
  actors: readonly BookingActor[];
};

const transitions: readonly Transition[] = [
  { from: "PENDING", to: "CONFIRMED", actors: ["PAYMENT_PROVIDER"] },
  { from: "PENDING", to: "DECLINED", actors: ["OWNER", "ADMIN"] },
  { from: "CONFIRMED", to: "ACTIVE", actors: ["OWNER", "ADMIN"] },
  { from: "ACTIVE", to: "COMPLETED", actors: ["OWNER", "ADMIN"] },
];

export function canTransitionBookingStatus(
  from: BookingStatus,
  to: BookingStatus,
  actor: BookingActor
): boolean {
  return transitions.some(
    (transition) =>
      transition.from === from &&
      transition.to === to &&
      transition.actors.includes(actor)
  );
}

export type BookingLifecycleDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "TRANSITION_NOT_ALLOWED"
        | "PAYMENT_REQUIRED"
        | "PAYMENT_IN_PROGRESS"
        | "PICKUP_TOO_EARLY"
        | "PICKUP_PERIOD_ENDED"
        | "RETURN_TOO_EARLY";
    };

export function decideBookingLifecycleTransition({
  from,
  to,
  actor,
  paymentStatus,
  hasProviderOrder,
  startDate,
  endDate,
  now,
}: {
  from: BookingStatus;
  to: BookingStatus;
  actor: BookingActor;
  paymentStatus: PaymentStatus;
  hasProviderOrder: boolean;
  startDate: Date;
  endDate: Date;
  now: Date;
}): BookingLifecycleDecision {
  if (!canTransitionBookingStatus(from, to, actor)) {
    return { allowed: false, reason: "TRANSITION_NOT_ALLOWED" };
  }
  if (to === "DECLINED" && hasProviderOrder) {
    return { allowed: false, reason: "PAYMENT_IN_PROGRESS" };
  }
  if (to === "ACTIVE" || to === "COMPLETED") {
    if (paymentStatus !== "PAID") return { allowed: false, reason: "PAYMENT_REQUIRED" };
  }
  if (actor !== "ADMIN" && to === "ACTIVE") {
    if (now < startDate) return { allowed: false, reason: "PICKUP_TOO_EARLY" };
    if (now > endDate) return { allowed: false, reason: "PICKUP_PERIOD_ENDED" };
  }
  if (actor !== "ADMIN" && to === "COMPLETED" && now < endDate) {
    return { allowed: false, reason: "RETURN_TOO_EARLY" };
  }
  return { allowed: true };
}
