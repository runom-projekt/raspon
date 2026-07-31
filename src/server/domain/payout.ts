export type PayoutStatus = "PENDING" | "PAID" | "FAILED";

const transitions = new Set(["PENDING:PAID", "PENDING:FAILED", "FAILED:PENDING"]);

export function canTransitionPayoutStatus(from: string, to: PayoutStatus) {
  return transitions.has(`${from}:${to}`);
}

export function calculateOutstandingPayout(
  completedSubtotal: number,
  completedCommission: number,
  reservedPayouts: number
) {
  return Math.round((completedSubtotal - completedCommission - reservedPayouts) * 100) / 100;
}
