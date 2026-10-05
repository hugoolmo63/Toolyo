import { describe, expect, it } from "vitest";
import { notifyMessageByPush } from "@/features/notifications/application/notification.service";
import type { PushProvider } from "@/server/integrations/push/push.provider";

function stubDb(tokens: { id: string; token: string; platform: "android" | "ios" }[]) {
  return {
    conversationParticipant: {
      findMany: async () => [{ userId: "recipient" }],
    },
    devicePushToken: {
      findMany: async () => tokens,
      updateMany: async () => ({ count: 0 }),
    },
  } as never;
}

const message = {
  senderUserId: "sender",
  recipientUserId: "conversation-participants",
  conversationId: "conversation-1",
  messageId: "message-1",
  preview: "Hola",
};

describe("notifyMessageByPush", () => {
  it("sends a push per active device", async () => {
    const sent: string[] = [];
    const provider: PushProvider = {
      send: async ({ token }) => {
        sent.push(token);
        return { providerMessageId: `fake:${token}` };
      },
    };

    const result = await notifyMessageByPush(
      stubDb([
        { id: "d1", token: "token-a", platform: "android" },
        { id: "d2", token: "token-b", platform: "ios" },
      ]),
      message,
      provider,
    );

    expect(sent).toEqual(["token-a", "token-b"]);
    expect(result).toEqual({ sent: 2, failed: 0, revoked: 0 });
  });

  it("does not fail the caller when the provider rejects", async () => {
    const provider: PushProvider = { send: async () => { throw new Error("provider unavailable"); } };
    const result = await notifyMessageByPush(
      stubDb([{ id: "d1", token: "token-a", platform: "android" }]),
      message,
      provider,
    );
    expect(result).toEqual({ sent: 0, failed: 1, revoked: 0 });
  });

  it("revokes tokens reported as invalid by the provider", async () => {
    let revokedIds: string[] = [];
    const db = {
      conversationParticipant: { findMany: async () => [{ userId: "recipient" }] },
      devicePushToken: {
        findMany: async () => [{ id: "d1", token: "stale", platform: "android" }],
        updateMany: async (args: { where: { id: { in: string[] } } }) => {
          revokedIds = args.where.id.in;
          return { count: revokedIds.length };
        },
      },
    } as never;

    const provider: PushProvider = {
      send: async () => {
        throw new Error("UNREGISTERED: registration-token-not-registered");
      },
    };

    const result = await notifyMessageByPush(db, message, provider);
    expect(revokedIds).toEqual(["d1"]);
    expect(result.revoked).toBe(1);
  });

  it("does nothing when there are no recipients", async () => {
    const db = { conversationParticipant: { findMany: async () => [] } } as never;
    const provider: PushProvider = { send: async () => ({ providerMessageId: "x" }) };
    await expect(notifyMessageByPush(db, message, provider)).resolves.toEqual({ sent: 0, failed: 0, revoked: 0 });
  });
});
