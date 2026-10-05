import type { PrismaClient } from "@prisma/client";
import { logger } from "@/server/lib/logger";
import { getEmailProvider, type EmailProvider } from "@/server/integrations/email/email.provider";
import {
  getPushProvider,
  isInvalidTokenError,
  type PushProvider,
} from "@/server/integrations/push/push.provider";
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

/**
 * Envía notificaciones push a los dispositivos activos de los destinatarios
 * (014-app-movil-multiplataforma, FR-012). Se ejecuta fuera de la transacción del
 * mensaje: un fallo del proveedor nunca revierte la persistencia. Los tokens
 * inválidos se marcan como revocados (data-model.md).
 */
export async function notifyMessageByPush(
  db: PrismaClient,
  input: MessageNotification,
  provider: PushProvider = getPushProvider(),
): Promise<{ sent: number; failed: number; revoked: number }> {
  const recipients = await db.conversationParticipant.findMany({
    where: { conversationId: input.conversationId, userId: { not: input.senderUserId } },
    select: { userId: true },
  });
  const userIds = recipients.map((participant) => participant.userId);
  if (userIds.length === 0) {
    return { sent: 0, failed: 0, revoked: 0 };
  }

  const tokens = await db.devicePushToken.findMany({
    where: { userId: { in: userIds }, revokedAt: null, notificationsEnabled: true },
    select: { id: true, token: true, platform: true },
  });

  const results = await Promise.allSettled(
    tokens.map((device) =>
      provider.send({
        token: device.token,
        platform: device.platform,
        title: "Nuevo mensaje en Toolyo",
        body: input.preview,
        data: {
          conversationId: input.conversationId,
          messageId: input.messageId,
          path: `/messages/${input.conversationId}`,
        },
      }),
    ),
  );

  const invalidIds: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "rejected" && isInvalidTokenError(result.reason)) {
      const device = tokens[index];
      if (device) invalidIds.push(device.id);
    }
  });

  if (invalidIds.length > 0) {
    await db.devicePushToken.updateMany({
      where: { id: { in: invalidIds } },
      data: { revokedAt: new Date(), notificationsEnabled: false },
    });
  }

  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) {
    logger.warn("notification.message.push.failed", {
      conversationId: input.conversationId,
      messageId: input.messageId,
      failed,
    });
  }

  return { sent: results.length - failed, failed, revoked: invalidIds.length };
}
