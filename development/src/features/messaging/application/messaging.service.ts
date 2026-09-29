import { Prisma, type PrismaClient } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationError } from "@/server/lib/errors/domain-errors";
import { countUnreadMessages, isConversationParticipant, listMessages as listMessageRows, markConversationRead, findMessageByClientId, createMessage, toMessagePayload, findPublishedListing, findListingConversation, createListingConversation, getConversationSummary, listUserConversations } from "../infrastructure/messaging.repository";
import { attachConfirmedUploads } from "./attachment.service";
import { notifyMessageByEmail } from "@/features/notifications/application/notification.service";
import type { ConversationGetOrCreateInput, ConversationListInput, ListMessagesInput, MarkReadInput, MessageSendInput } from "../shared/messaging.schema";

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

interface ConversationSummaryRow {
  id: string;
  listing: { id: string; title: string; slug: string } | null;
  participants: { userId: string; lastReadAt: Date | null; user: { id: string; displayName: string | null } }[];
  booking?: { id: string; status: string; startDate: Date; endDate: Date; totalPrice: Prisma.Decimal; currencyCode: string; renterId: string; ownerId: string; rejectionReason: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}

function toConversationSummary(row: ConversationSummaryRow, userId: string) {
  const me = row.participants.find((participant) => participant.userId === userId);
  const other = row.participants.find((participant) => participant.userId !== userId);
  return {
    id: row.id,
    listing: row.listing,
    participants: row.participants.map((participant) => participant.user),
    me: me?.user ?? null,
    otherParticipant: other?.user ?? null,
    booking: row.booking
      ? {
          id: row.booking.id,
          status: row.booking.status,
          startDate: row.booking.startDate.toISOString().slice(0, 10),
          endDate: row.booking.endDate.toISOString().slice(0, 10),
          totalPrice: row.booking.totalPrice.toString(),
          currencyCode: row.booking.currencyCode,
          renterId: row.booking.renterId,
          ownerId: row.booking.ownerId,
          rejectionReason: row.booking.rejectionReason,
        }
      : null,
    lastReadAt: me?.lastReadAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getOrCreateListingConversation(db: PrismaClient, userId: string, input: ConversationGetOrCreateInput) {
  const listing = await findPublishedListing(db, input.listingId);
  if (!listing) throw new NotFoundError("Listing no encontrado o no disponible");
  if (listing.ownerId === userId) throw new ForbiddenError("No puedes iniciar una conversación sobre tu propio listing");

  const existing = await findListingConversation(db, listing.id, userId, listing.ownerId);
  if (existing) return { conversationId: existing.id, created: false };

  const conversation = await createListingConversation(db, listing.id, [userId, listing.ownerId]);
  return { conversationId: conversation.id, created: true };
}

export async function getConversation(db: PrismaClient, userId: string, conversationId: string) {
  await assertConversationAccess(db, conversationId, userId);
  const row = await getConversationSummary(db, conversationId);
  if (!row) throw new NotFoundError("Conversación no encontrada");
  return toConversationSummary(row, userId);
}

export async function listConversations(db: PrismaClient, userId: string, input: ConversationListInput) {
  const rows = await listUserConversations(db, userId, input.limit);
  return rows.map((row) => {
    const summary = toConversationSummary(row, userId);
    const lastMessage = row.messages[0];
    const me = row.participants.find((participant) => participant.userId === userId);
    return {
      ...summary,
      lastMessage: lastMessage
        ? { id: lastMessage.id, senderId: lastMessage.senderId, body: lastMessage.body, createdAt: lastMessage.createdAt.toISOString() }
        : null,
      hasUnread: Boolean(lastMessage && lastMessage.senderId !== userId && (!me?.lastReadAt || lastMessage.createdAt > me.lastReadAt)),
    };
  });
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
