import type { BookingStatus, PaymentStatus } from "@prisma/client";

export type CancellationDecision =
  | { allowed: true; reversal: "NONE" | "CANCEL_ORDER" | "FULL_REFUND" }
  | { allowed: false; reason: "ALREADY_FINAL" | "RENTAL_STARTED" | "PAYMENT_INCONSISTENT" };

export function decideRenterCancellation({
  bookingStatus,
  paymentStatus,
  hasProviderOrder,
  startDate,
  now,
}: {
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  hasProviderOrder: boolean;
  startDate: Date;
  now: Date;
}): CancellationDecision {
  if (["CANCELLED", "DECLINED", "COMPLETED"].includes(bookingStatus)) {
    return { allowed: false, reason: "ALREADY_FINAL" };
  }
  if (bookingStatus === "ACTIVE" || startDate <= now) {
    return { allowed: false, reason: "RENTAL_STARTED" };
  }
  if (bookingStatus === "PENDING") {
    if (paymentStatus === "PAID") {
      return { allowed: false, reason: "PAYMENT_INCONSISTENT" };
    }
    return { allowed: true, reversal: hasProviderOrder ? "CANCEL_ORDER" : "NONE" };
  }
  if (bookingStatus === "CONFIRMED" && paymentStatus === "PAID" && hasProviderOrder) {
    return { allowed: true, reversal: "FULL_REFUND" };
  }
  return { allowed: false, reason: "PAYMENT_INCONSISTENT" };
}

export function getReversalRetryDelayMs(attempt: number): number {
  const normalized = Math.max(1, Math.floor(attempt));
  return Math.min(6 * 60 * 60 * 1000, 60_000 * 2 ** (normalized - 1));
}
