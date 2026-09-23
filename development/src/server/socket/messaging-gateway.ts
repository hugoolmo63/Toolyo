import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import type { PrismaClient } from "@prisma/client";
import { authenticateSocket, type SocketIdentity } from "@/features/messaging/infrastructure/socket-auth";
import { assertConversationAccess, markRead, sendMessage } from "@/features/messaging/application/messaging.service";
import { ConversationJoinSchema, ConversationReadSchema, MessageSendSchema } from "@/features/messaging/shared/messaging.schema";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { logger } from "@/server/lib/logger";
import { notifyMessageByEmail } from "@/features/notifications/application/notification.service";

export const conversationRoom = (conversationId: string) => `conversation:${conversationId}`;

type Ack<T = unknown> = (response: { ok: true; data: T } | { ok: false; code: string; requestId: string }) => void;

function requestId(socket: Socket): string {
  return socket.id;
}

function errorResponse(socket: Socket, error: unknown) {
  const mapped = mapErrorToTRPC(error);
  return { ok: false as const, code: mapped.code, requestId: requestId(socket) };
}

export function createMessagingGateway(httpServer: HttpServer, prisma: PrismaClient, options: { corsOrigin?: string | string[] } = {}) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: options.corsOrigin ?? true, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      socket.data.identity = await authenticateSocket(socket, prisma);
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const identity = socket.data.identity as SocketIdentity;

    socket.on("conversation:join", async (payload: unknown, ack?: Ack<{ conversationId: string }>) => {
      try {
        const input = ConversationJoinSchema.parse(payload);
        await assertConversationAccess(prisma, input.conversationId, identity.userId);
        await socket.join(conversationRoom(input.conversationId));
        ack?.({ ok: true, data: { conversationId: input.conversationId } });
      } catch (error) {
        ack?.(errorResponse(socket, error));
      }
    });

    socket.on("message:send", async (payload: unknown, ack?: Ack<{ message: unknown; deduplicated: boolean }>) => {
      try {
        const input = MessageSendSchema.parse(payload);
        const result = await sendMessage(prisma, identity.userId, input);
        io.to(conversationRoom(input.conversationId)).emit("message:created", result.message);
        if (!result.deduplicated) {
          void notifyMessageByEmail(prisma, { senderUserId: identity.userId, recipientUserId: "conversation-participants", conversationId: input.conversationId, messageId: result.message.id, preview: result.message.body ?? "Imagen adjunta" }).catch((error) => logger.warn("notification.message.email.failed", { error, conversationId: input.conversationId, messageId: result.message.id }));
        }
        ack?.({ ok: true, data: result });
      } catch (error) {
        logger.warn("messaging.message.send.failed", { error, userId: identity.userId, requestId: requestId(socket) });
        ack?.(errorResponse(socket, error));
      }
    });

    socket.on("conversation:read", async (payload: unknown, ack?: Ack<unknown>) => {
      try {
        const input = ConversationReadSchema.parse(payload);
        const result = await markRead(prisma, identity.userId, input);
        io.to(conversationRoom(input.conversationId)).emit("conversation:read-updated", result);
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.(errorResponse(socket, error));
      }
    });

  });

  return io;
}
