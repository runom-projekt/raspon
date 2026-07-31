export const MAX_NOTIFICATION_ATTEMPTS = 8;

export function getNotificationRetryDelayMs(attempt: number): number {
  const normalizedAttempt = Math.max(1, Math.floor(attempt));
  return Math.min(6 * 60 * 60 * 1000, 60_000 * 2 ** (normalizedAttempt - 1));
}

export function shouldRetryNotification(attempt: number): boolean {
  return attempt < MAX_NOTIFICATION_ATTEMPTS;
}
