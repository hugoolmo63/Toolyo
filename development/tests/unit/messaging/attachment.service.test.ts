import { describe, expect, it } from "vitest";
import { LocalObjectStorageProvider } from "@/server/integrations/storage/object-storage.provider";
import { notifyMessageByEmail, type MessageEmailProvider } from "@/features/notifications/application/notification.service";

describe("messaging attachments and presence", () => {
  it("creates deterministic local presigned metadata", async () => {
    const provider = new LocalObjectStorageProvider();
    const expiresAt = new Date("2030-01-01T00:05:00.000Z");
    const result = await provider.createPresignedUpload({ storageKey: "conversations/c1/image.jpg", mimeType: "image/jpeg", byteSize: 100, expiresAt });
    expect(result.storageKey).toBe("conversations/c1/image.jpg");
    expect(result.uploadUrl).toContain("token=");
    expect(result.expiresAt).toEqual(expiresAt);
  });

  it("sends email to all conversation participants except the sender", async () => {
    const sent: string[] = [];
    const provider: MessageEmailProvider = { sendMessageNotification: async ({ to }) => { sent.push(to); return { providerMessageId: "fake" }; } };
    const db = { conversationParticipant: { findMany: async () => [{ user: { id: "recipient", emailNormalized: "recipient@toolyo.dev" } }] } } as never;
    await expect(notifyMessageByEmail(db, { senderUserId: "sender", recipientUserId: "ignored", conversationId: "conversation-1", messageId: "message-1", preview: "Hola" }, provider)).resolves.toEqual({ sent: 1, failed: 0 });
    expect(sent).toEqual(["recipient@toolyo.dev"]);
  });

  it("does not propagate email provider failures", async () => {
    const provider: MessageEmailProvider = { sendMessageNotification: async () => { throw new Error("provider unavailable"); } };
    const db = { conversationParticipant: { findMany: async () => [{ user: { id: "recipient", emailNormalized: "recipient@toolyo.dev" } }] } } as never;
    await expect(notifyMessageByEmail(db, { senderUserId: "sender", recipientUserId: "ignored", conversationId: "conversation-1", messageId: "message-2", preview: "Hola" }, provider)).resolves.toEqual({ sent: 0, failed: 1 });
  });
});
