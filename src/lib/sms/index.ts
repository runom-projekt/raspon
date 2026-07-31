import "server-only";
import type { SmsProvider } from "./types";
import { MessageBirdSmsProvider } from "./messagebird";

export type { SmsProvider, SmsMessage } from "./types";

export function isSmsConfigured(): boolean {
  return Boolean(process.env.MESSAGEBIRD_API_KEY);
}

// Weitere Anbieter (z. B. Vonage) können hier ergänzt werden — einfach die
// SmsProvider-Schnittstelle implementieren und je nach SMS_PROVIDER zurückgeben.
export function getSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER ?? "messagebird";
  switch (provider) {
    case "messagebird":
      return new MessageBirdSmsProvider();
    default:
      throw new Error(`Unbekannter SMS-Anbieter: ${provider}`);
  }
}
