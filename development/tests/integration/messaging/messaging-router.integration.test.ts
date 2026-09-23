import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createSession } from "@/server/auth/session.service";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let conversationId: string;
let messageId: string;
let participantId: string;
let outsiderId: string;

beforeAll(async () => {
  container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_test").withUsername("toolyo").withPassword("toolyo").start();
  const dbUrl = container.getConnectionUri();
  process.env.DATABASE_URL = dbUrl;
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
  const participant = await prisma.user.create({ data: { emailNormalized: "message-participant@toolyo.dev", accountStatus: "active" } });
  const outsider = await prisma.user.create({ data: { emailNormalized: "message-outsider@toolyo.dev", accountStatus: "active" } });
  participantId = participant.id;
  outsiderId = outsider.id;
  const conversation = await prisma.conversation.create({ data: { participants: { create: { userId: participantId } } } });
  conversationId = conversation.id;
}, 120_000);

beforeEach(async () => {
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.updateMany({ data: { lastReadMessageId: null, lastReadAt: null } });
  messageId = "";
});

afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

async function callerFor(userId: string) {
  const session = await createSession(prisma, { userId });
  return appRouter.createCaller(() => createTRPCContext({ prisma, request: new Request("http://localhost", { headers: { cookie: `toolyo_session=${session.token}` } }) }));
}

describe("messaging tRPC integration", () => {
  it("lists messages with cursor and marks the conversation read", async () => {
    const participantCaller = await callerFor(participantId);
    const message = await prisma.message.create({ data: { conversationId, senderId: participantId, clientMessageId: "router-message-1", body: "Mensaje persistido" } });
    messageId = message.id;
    const result = await participantCaller.messaging.listMessages({ conversationId, limit: 20 });
    expect(result.items[0]?.id).toBe(messageId);
    const read = await participantCaller.messaging.markRead({ conversationId, messageId });
    expect(read.messageId).toBe(messageId);
    expect((await prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId: participantId } } }))?.lastReadMessageId).toBe(messageId);
  });

  it("denies history and read access to a non-participant", async () => {
    const outsiderCaller = await callerFor(outsiderId);
    await expect(outsiderCaller.messaging.listMessages({ conversationId })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("provides a thin unread count query without opening a socket", async () => {
    const participantCaller = await callerFor(participantId);
    await prisma.message.create({ data: { conversationId, senderId: outsiderId, clientMessageId: "unread-1", body: "No leído" } });
    await prisma.message.create({ data: { conversationId, senderId: outsiderId, clientMessageId: "unread-2", body: "Otro no leído" } });
    await expect(participantCaller.messaging.getUnreadCount({ conversationId })).resolves.toEqual({ count: 2 });
    await participantCaller.messaging.markRead({ conversationId, messageId: (await prisma.message.findFirstOrThrow({ where: { conversationId }, orderBy: { createdAt: "desc" } })).id });
    await expect(participantCaller.messaging.getUnreadCount({ conversationId })).resolves.toEqual({ count: 0 });
  });

  it("persists and deduplicates messages through tRPC", async () => {
    const participantCaller = await callerFor(participantId);
    const input = { conversationId, clientMessageId: "trpc-send-1", body: "Mensaje por tRPC", attachmentIds: [] };
    const first = await participantCaller.messaging.sendMessage(input);
    const second = await participantCaller.messaging.sendMessage(input);
    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.message.id).toBe(first.message.id);
    expect(await prisma.message.count({ where: { conversationId, clientMessageId: input.clientMessageId } })).toBe(1);
  });
});
