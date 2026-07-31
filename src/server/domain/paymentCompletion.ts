import type { BookingStatus, PaymentStatus } from "@prisma/client";

export type PaymentCompletionAction = "CONFIRM_BOOKING" | "ACCEPT_EXISTING" | "QUEUE_REFUND";

export function decidePaymentCompletion(
  bookingStatus: BookingStatus,
  paymentStatus: PaymentStatus
): PaymentCompletionAction {
  if (bookingStatus === "CANCELLED" || bookingStatus === "DECLINED") return "QUEUE_REFUND";
  if (bookingStatus === "PENDING") return "CONFIRM_BOOKING";
  // A repeated provider event for an already running booking must be idempotent.
  // Payment status is included explicitly so callers cannot accidentally infer
  // lifecycle state from the provider event alone.
  void paymentStatus;
  return "ACCEPT_EXISTING";
}
