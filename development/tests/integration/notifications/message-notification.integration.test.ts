import { describe, expect, it } from "vitest";
import { notifyMessageByEmail, type MessageEmailProvider } from "@/features/notifications/application/notification.service";

describe("offline message notifications", () => {
  it("sends an email notification through the provider", async () => {
    const calls: string[] = [];
    const provider: MessageEmailProvider = { sendMessageNotification: async ({ messageId }) => { calls.push(messageId); return { providerMessageId: `fake:${messageId}` }; } };
    const db = { conversationParticipant: { findMany: async () => [{ user: { id: "recipient", emailNormalized: "recipient@toolyo.dev" } }] } } as never;
    await notifyMessageByEmail(db, { senderUserId: "sender", recipientUserId: "ignored", conversationId: "conversation", messageId: "message-1", preview: "Texto" }, provider);
    expect(calls).toEqual(["message-1"]);
  });

  it("does not fail the caller when an email provider rejects", async () => {
    const provider: MessageEmailProvider = { sendMessageNotification: async () => { throw new Error("provider unavailable"); } };
    const db = { conversationParticipant: { findMany: async () => [{ user: { id: "recipient", emailNormalized: "recipient@toolyo.dev" } }] } } as never;
    await expect(notifyMessageByEmail(db, { senderUserId: "sender", recipientUserId: "ignored", conversationId: "conversation", messageId: "message-2", preview: "Texto" }, provider)).resolves.toEqual({ sent: 0, failed: 1 });
  });
});
