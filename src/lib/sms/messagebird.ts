import "server-only";
import type { SmsProvider, SmsMessage } from "./types";

export class MessageBirdSmsProvider implements SmsProvider {
  async send({ to, body }: SmsMessage): Promise<void> {
    const apiKey = process.env.MESSAGEBIRD_API_KEY;
    const workspaceId = process.env.MESSAGEBIRD_WORKSPACE_ID;
    const channelId = process.env.MESSAGEBIRD_CHANNEL_ID;
    if (!apiKey || !workspaceId || !channelId) {
      throw new Error(
        "Umgebungsvariable MESSAGEBIRD_API_KEY, MESSAGEBIRD_WORKSPACE_ID oder MESSAGEBIRD_CHANNEL_ID fehlt"
      );
    }

    const res = await fetch(
      `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `AccessKey ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: { contacts: [{ identifierValue: to }] },
          body: { type: "text", text: { text: body } },
        }),
      }
    );

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Bird-SMS konnte nicht gesendet werden (${res.status}): ${errorBody}`);
    }
  }
}
