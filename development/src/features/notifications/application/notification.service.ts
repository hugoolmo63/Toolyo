import type { PrismaClient } from "@prisma/client";
import { logger } from "@/server/lib/logger";
import { getEmailProvider, type EmailProvider } from "@/server/integrations/email/email.provider";
import type { MessageNotification } from "../shared/notification.schema";

export type MessageEmailProvider = Pick<EmailProvider, "sendMessageNotification">;

/**
 * Sends email notifications after the message has been committed.
 * Provider failures are logged and intentionally never propagated to the
 * tRPC response or the message transaction.
 */
export async function notifyMessageByEmail(
  db: PrismaClient,
  input: MessageNotification,
  provider: MessageEmailProvider = getEmailProvider(),
): Promise<{ sent: number; failed: number }> {
  const recipients = await db.conversationParticipant.findMany({
    where: { conversationId: input.conversationId, userId: { not: input.senderUserId } },
    select: { user: { select: { id: true, emailNormalized: true } } },
  });

  const results = await Promise.allSettled(recipients.map(({ user }) => provider.sendMessageNotification({
    to: user.emailNormalized,
    conversationId: input.conversationId,
    messageId: input.messageId,
    preview: input.preview,
  })));

  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) logger.warn("notification.message.email.failed", { conversationId: input.conversationId, messageId: input.messageId, failed });
  return { sent: results.length - failed, failed };
}
