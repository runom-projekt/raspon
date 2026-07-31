export const BOOKING_PAYMENT_WINDOW_MS = 30 * 60 * 1000;

export function bookingExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + BOOKING_PAYMENT_WINDOW_MS);
}

export function isBookingExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
