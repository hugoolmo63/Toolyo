import type { Prisma, PrismaClient } from "@prisma/client";

type Database = PrismaClient | Prisma.TransactionClient;

export async function createConversationFixture(
  db: Database,
  overrides: Partial<Prisma.ConversationUncheckedCreateInput> = {},
) {
  return db.conversation.create({
    data: {
      id: overrides.id ?? "fixture-conversation",
      listingId: overrides.listingId,
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
      deletedAt: overrides.deletedAt,
    },
  });
}

export async function addConversationParticipantFixture(
  db: Database,
  conversationId = "fixture-conversation",
  userId = "fixture-renter",
) {
  return db.conversationParticipant.create({
    data: { conversationId, userId },
  });
}

export async function createMessageFixture(
  db: Database,
  overrides: Partial<Prisma.MessageUncheckedCreateInput> = {},
) {
  return db.message.create({
    data: {
      id: overrides.id ?? "fixture-message",
      conversationId: overrides.conversationId ?? "fixture-conversation",
      senderId: overrides.senderId ?? "fixture-renter",
      clientMessageId: overrides.clientMessageId ?? "fixture-client-message",
      type: overrides.type ?? "text",
      body: overrides.body ?? "Mensaje de prueba",
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
      deletedAt: overrides.deletedAt,
    },
  });
}
