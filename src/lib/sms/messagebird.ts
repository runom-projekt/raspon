import "server-only";
import type { SmsProvider, SmsMessage } from "./types";

export class MessageBirdSmsProvider implements SmsProvider {
  async send({ to, body }: SmsMessage): Promise<void> {
    const apiKey = process.env.MESSAGEBIRD_API_KEY;
    const originator = process.env.MESSAGEBIRD_ORIGINATOR ?? "Raspon";
    if (!apiKey) {
      throw new Error("Umgebungsvariable MESSAGEBIRD_API_KEY fehlt");
    }

    const res = await fetch("https://rest.messagebird.com/messages", {
      method: "POST",
      headers: {
        Authorization: `AccessKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originator,
        recipients: [to],
        body,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`MessageBird-SMS konnte nicht gesendet werden (${res.status}): ${errorBody}`);
    }
  }
}
