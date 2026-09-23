import { Prisma, type PrismaClient } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationError } from "@/server/lib/errors/domain-errors";
import { countUnreadMessages, isConversationParticipant, listMessages as listMessageRows, markConversationRead, findMessageByClientId, createMessage, toMessagePayload } from "../infrastructure/messaging.repository";
import { attachConfirmedUploads } from "./attachment.service";
import { notifyMessageByEmail } from "@/features/notifications/application/notification.service";
import type { ListMessagesInput, MarkReadInput, MessageSendInput } from "../shared/messaging.schema";

function decodeCursor(cursor?: string): { createdAt: Date; id: string } | undefined {
  if (!cursor) return undefined;
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { createdAt?: string; id?: string };
    if (!value.createdAt || !value.id || Number.isNaN(new Date(value.createdAt).getTime())) throw new Error("invalid");
    return { createdAt: new Date(value.createdAt), id: value.id };
  } catch {
    throw new ValidationError("El cursor no es válido");
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id }), "utf8").toString("base64url");
}

export async function assertConversationAccess(db: PrismaClient, conversationId: string, userId: string): Promise<void> {
  if (!(await isConversationParticipant(db, conversationId, userId))) throw new ForbiddenError("No perteneces a esta conversación");
}

export async function sendMessage(db: PrismaClient, userId: string, input: MessageSendInput) {
  await assertConversationAccess(db, input.conversationId, userId);
  const existing = await findMessageByClientId(db, input.conversationId, userId, input.clientMessageId);
  if (existing) return { message: toMessagePayload(existing), deduplicated: true };
  const message = await db.$transaction(async (tx) => {
    const created = await createMessage(tx, { conversationId: input.conversationId, senderId: userId, clientMessageId: input.clientMessageId, body: input.body?.trim() });
    await attachConfirmedUploads(tx as PrismaClient, userId, input.conversationId, created.id, input.attachmentIds);
    return tx.message.findUniqueOrThrow({ where: { id: created.id }, include: { sender: { select: { id: true, displayName: true } }, attachments: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } } } });
  });
  // Email is deliberately outside the transaction and fire-and-forget: provider
  // latency/failure must never block or roll back message persistence.
  void notifyMessageByEmail(db, {
    senderUserId: userId,
    recipientUserId: "conversation-participants",
    conversationId: input.conversationId,
    messageId: message.id,
    preview: message.body ?? "Imagen adjunta",
  }).catch(() => undefined);
  return { message: toMessagePayload(message), deduplicated: false };
}

export async function listMessages(db: PrismaClient, userId: string, input: ListMessagesInput) {
  await assertConversationAccess(db, input.conversationId, userId);
  const rows = await listMessageRows(db, input.conversationId, input.limit, decodeCursor(input.cursor));
  const hasMore = rows.length > input.limit;
  const items = (hasMore ? rows.slice(0, input.limit) : rows).map(toMessagePayload);
  const last = items.at(-1);
  return { items, nextCursor: hasMore && last ? encodeCursor(new Date(last.createdAt), last.id) : null };
}

export async function markRead(db: PrismaClient, userId: string, input: MarkReadInput) {
  await assertConversationAccess(db, input.conversationId, userId);
  const result = await markConversationRead(db, input.conversationId, userId, input.messageId);
  if (!result) throw new NotFoundError("Mensaje no encontrado");
  return { conversationId: result.conversationId, userId: result.userId, messageId: result.lastReadMessageId, readAt: result.lastReadAt?.toISOString() ?? null };
}

export async function getUnreadCount(db: PrismaClient, userId: string, conversationId?: string) {
  return { count: await countUnreadMessages(db, userId, conversationId) };
}
