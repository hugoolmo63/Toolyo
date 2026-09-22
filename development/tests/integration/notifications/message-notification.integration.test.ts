import { describe, expect, it } from "vitest";
import { markSocketActive, resetPresence } from "@/features/messaging/infrastructure/presence.service";
import { notifyMessageIfOffline, type NotificationChannel } from "@/features/notifications/application/notification.service";

describe("offline message notifications", () => {
  it("sends fallback once when no conversation socket is active", async () => {
    resetPresence();
    const calls: string[] = [];
    const channel: NotificationChannel = { send: async ({ messageId }) => { calls.push(messageId); return { providerMessageId: `fake:${messageId}` }; } };
    const db = { user: { findUnique: async () => ({ emailNormalized: "recipient@toolyo.dev" }) } } as never;
    await notifyMessageIfOffline(db, { recipientUserId: "recipient", conversationId: "conversation", messageId: "message-1", preview: "Texto" }, channel);
    expect(calls).toEqual(["message-1"]);
  });

  it("does not send fallback while the recipient has an active socket", async () => {
    resetPresence();
    markSocketActive("recipient", "conversation", "socket-1");
    const channel: NotificationChannel = { send: async () => { throw new Error("must not send"); } };
    const db = { user: { findUnique: async () => ({ emailNormalized: "recipient@toolyo.dev" }) } } as never;
    await expect(notifyMessageIfOffline(db, { recipientUserId: "recipient", conversationId: "conversation", messageId: "message-2", preview: "Texto" }, channel)).resolves.toEqual({ sent: false, reason: "socket-active" });
    resetPresence();
  });
});
