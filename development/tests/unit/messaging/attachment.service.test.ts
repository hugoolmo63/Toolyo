import { describe, expect, it } from "vitest";
import { LocalObjectStorageProvider } from "@/server/integrations/storage/object-storage.provider";
import { markSocketActive, markSocketInactive, isUserActiveInConversation, resetPresence } from "@/features/messaging/infrastructure/presence.service";
import { notifyMessageIfOffline, type NotificationChannel } from "@/features/notifications/application/notification.service";

describe("messaging attachments and presence", () => {
  it("creates deterministic local presigned metadata", async () => {
    const provider = new LocalObjectStorageProvider();
    const expiresAt = new Date("2030-01-01T00:05:00.000Z");
    const result = await provider.createPresignedUpload({ storageKey: "conversations/c1/image.jpg", mimeType: "image/jpeg", byteSize: 100, expiresAt });
    expect(result.storageKey).toBe("conversations/c1/image.jpg");
    expect(result.uploadUrl).toContain("token=");
    expect(result.expiresAt).toEqual(expiresAt);
  });

  it("tracks active sockets per user and conversation", () => {
    resetPresence();
    markSocketActive("user-1", "conversation-1", "socket-1");
    markSocketActive("user-1", "conversation-1", "socket-2");
    expect(isUserActiveInConversation("user-1", "conversation-1")).toBe(true);
    markSocketInactive("user-1", "conversation-1", "socket-1");
    expect(isUserActiveInConversation("user-1", "conversation-1")).toBe(true);
    markSocketInactive("user-1", "conversation-1", "socket-2");
    expect(isUserActiveInConversation("user-1", "conversation-1")).toBe(false);
  });

  it("uses fallback notification only when the recipient is offline", async () => {
    resetPresence();
    const sent: string[] = [];
    const channel: NotificationChannel = { send: async (input) => { sent.push(input.messageId); return { providerMessageId: "fake" }; } };
    const db = { user: { findUnique: async () => ({ emailNormalized: "offline@toolyo.dev" }) } } as never;
    await expect(notifyMessageIfOffline(db, { recipientUserId: "user-1", conversationId: "conversation-1", messageId: "message-1", preview: "Hola" }, channel)).resolves.toEqual({ sent: true, reason: "fallback-sent" });
    expect(sent).toEqual(["message-1"]);
    markSocketActive("user-1", "conversation-1", "socket-1");
    await expect(notifyMessageIfOffline(db, { recipientUserId: "user-1", conversationId: "conversation-1", messageId: "message-2", preview: "Hola" }, channel)).resolves.toEqual({ sent: false, reason: "socket-active" });
    expect(sent).toEqual(["message-1"]);
    resetPresence();
  });
});
