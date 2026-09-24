import { Prisma, type PrismaClient } from "@prisma/client";

export type MessagingDb = PrismaClient | Prisma.TransactionClient;

const messageInclude = {
  sender: { select: { id: true, displayName: true } },
  attachments: { where: { deletedAt: null }, orderBy: { createdAt: "asc" as const } },
} as const;

const conversationInclude = {
  listing: { select: { id: true, title: true, slug: true } },
  participants: { include: { user: { select: { id: true, displayName: true } } } },
} as const;

export async function findPublishedListing(db: MessagingDb, listingId: string) {
  return db.listing.findFirst({
    where: { id: listingId, status: "published", deletedAt: null },
    select: { id: true, ownerId: true, title: true, slug: true },
  });
}

export async function findListingConversation(db: MessagingDb, listingId: string, userId: string, ownerId: string) {
  return db.conversation.findFirst({
    where: {
      listingId,
      deletedAt: null,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: ownerId } } },
      ],
    },
    select: { id: true, booking: { select: { id: true } } },
  });
}

export async function createListingConversation(db: MessagingDb, listingId: string, userIds: [string, string]) {
  return db.conversation.create({
    data: {
      listingId,
      participants: { create: userIds.map((userId) => ({ userId })) },
    },
    select: { id: true },
  });
}

export async function getConversationSummary(db: MessagingDb, conversationId: string) {
  return db.conversation.findFirst({
    where: { id: conversationId, deletedAt: null },
    include: {
      ...conversationInclude,
      booking: { select: { id: true, status: true, startDate: true, endDate: true, totalPrice: true, currencyCode: true } },
    },
  });
}

export async function listUserConversations(db: MessagingDb, userId: string, limit: number) {
  return db.conversation.findMany({
    where: { deletedAt: null, participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      ...conversationInclude,
      messages: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { id: true, senderId: true, body: true, createdAt: true },
      },
    },
  });
}

export async function isConversationParticipant(db: MessagingDb, conversationId: string, userId: string): Promise<boolean> {
  const participant = await db.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { userId: true } });
  return participant !== null;
}

export async function findMessageByClientId(db: MessagingDb, conversationId: string, senderId: string, clientMessageId: string) {
  return db.message.findUnique({ where: { conversationId_senderId_clientMessageId: { conversationId, senderId, clientMessageId } }, include: messageInclude });
}

export async function createMessage(db: MessagingDb, data: { conversationId: string; senderId: string; clientMessageId: string; body?: string }) {
  return db.message.create({ data: { ...data, type: data.body ? "text" : "image" }, include: messageInclude });
}

export async function listMessages(db: MessagingDb, conversationId: string, limit: number, cursor?: { createdAt: Date; id: string }) {
  return db.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
      ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: messageInclude,
  });
}

export async function markConversationRead(db: MessagingDb, conversationId: string, userId: string, messageId: string) {
  const message = await db.message.findFirst({ where: { id: messageId, conversationId, deletedAt: null }, select: { id: true, createdAt: true } });
  if (!message) return null;
  return db.conversationParticipant.update({ where: { conversationId_userId: { conversationId, userId } }, data: { lastReadMessageId: message.id, lastReadAt: new Date() }, select: { conversationId: true, userId: true, lastReadMessageId: true, lastReadAt: true } });
}

export async function countUnreadMessages(db: MessagingDb, userId: string, conversationId?: string): Promise<number> {
  const participants = await db.conversationParticipant.findMany({
    where: { userId, ...(conversationId ? { conversationId } : {}) },
    select: { conversationId: true, lastReadAt: true },
  });

  let total = 0;
  for (const participant of participants) {
    total += await db.message.count({
      where: {
        conversationId: participant.conversationId,
        senderId: { not: userId },
        deletedAt: null,
        ...(participant.lastReadAt ? { createdAt: { gt: participant.lastReadAt } } : {}),
      },
    });
  }
  return total;
}

export function toMessagePayload(message: Prisma.MessageGetPayload<{ include: typeof messageInclude }>) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    clientMessageId: message.clientMessageId,
    type: message.type,
    body: message.body,
    attachments: message.attachments,
    sender: message.sender,
    createdAt: message.createdAt.toISOString(),
  };
}
