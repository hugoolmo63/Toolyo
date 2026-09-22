import type { PrismaClient } from "@prisma/client";
import { logger } from "@/server/lib/logger";
import { isUserActiveInConversation } from "@/features/messaging/infrastructure/presence.service";
import type { MessageNotification } from "../shared/notification.schema";

export interface NotificationChannel {
  send(input: MessageNotification & { email: string }): Promise<{ providerMessageId: string }>;
}

export const consoleNotificationChannel: NotificationChannel = {
  async send(input) {
    logger.info("notification.message.fallback", { recipientUserId: input.recipientUserId, conversationId: input.conversationId, messageId: input.messageId });
    return { providerMessageId: `console-notification:${input.messageId}` };
  },
};

export async function notifyMessageIfOffline(db: PrismaClient, input: MessageNotification, channel: NotificationChannel = consoleNotificationChannel): Promise<{ sent: boolean; reason: "socket-active" | "fallback-sent" }> {
  if (isUserActiveInConversation(input.recipientUserId, input.conversationId)) return { sent: false, reason: "socket-active" };
  const recipient = await db.user.findUnique({ where: { id: input.recipientUserId }, select: { emailNormalized: true } });
  if (!recipient) return { sent: false, reason: "fallback-sent" };
  await channel.send({ ...input, email: recipient.emailNormalized });
  return { sent: true, reason: "fallback-sent" };
}
