import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server as HttpServer } from "node:http";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { createSession } from "@/server/auth/session.service";
import { createMessagingGateway } from "@/server/socket";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let httpServer: HttpServer;
let port: number;
let participantId: string;
let secondParticipantId: string;
let outsiderId: string;
let conversationId: string;
let otherConversationId: string;
let participantToken: string;
let secondParticipantToken: string;
let outsiderToken: string;

beforeAll(async () => {
  container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_test").withUsername("toolyo").withPassword("toolyo").start();
  const dbUrl = container.getConnectionUri();
  process.env.DATABASE_URL = dbUrl;
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });

  const participant = await prisma.user.create({ data: { emailNormalized: "socket-participant@toolyo.dev", accountStatus: "active" } });
  const secondParticipant = await prisma.user.create({ data: { emailNormalized: "socket-second@toolyo.dev", accountStatus: "active" } });
  const outsider = await prisma.user.create({ data: { emailNormalized: "socket-outsider@toolyo.dev", accountStatus: "active" } });
  participantId = participant.id; secondParticipantId = secondParticipant.id; outsiderId = outsider.id;
  const firstConversation = await prisma.conversation.create({ data: { participants: { create: [{ userId: participantId }, { userId: secondParticipantId }] } } });
  const secondConversation = await prisma.conversation.create({ data: { participants: { create: { userId: outsiderId } } } });
  conversationId = firstConversation.id;
  otherConversationId = secondConversation.id;
  participantToken = (await createSession(prisma, { userId: participantId })).token;
  secondParticipantToken = (await createSession(prisma, { userId: secondParticipantId })).token;
  outsiderToken = (await createSession(prisma, { userId: outsiderId })).token;

  httpServer = createServer();
  createMessagingGateway(httpServer, prisma, { corsOrigin: "*" });
  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", () => resolve()));
  port = (httpServer.address() as { port: number }).port;
}, 120_000);

beforeEach(async () => {
  await prisma.message.deleteMany();
});

afterAll(async () => {
  await prisma?.$disconnect();
  await new Promise<void>((resolve) => httpServer?.close(() => resolve()));
  await container?.stop();
});

function connect(token: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = createClient(`http://127.0.0.1:${port}`, { auth: { sessionToken: token }, transports: ["websocket"] });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });
}

function emitAck<T>(socket: ClientSocket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => socket.emit(event, payload, (response: { ok: boolean; data?: T; code?: string }) => response.ok ? resolve(response.data as T) : reject(new Error(response.code))));
}

describe("Socket.io messaging gateway", () => {
  it("authenticates sessions and applies ABAC to private rooms", async () => {
    const participant = await connect(participantToken);
    await expect(emitAck(participant, "conversation:join", { conversationId })).resolves.toMatchObject({ conversationId });
    await expect(emitAck(participant, "conversation:join", { conversationId: otherConversationId })).rejects.toThrow("FORBIDDEN");
    const outsider = await connect(outsiderToken);
    await expect(emitAck(outsider, "conversation:join", { conversationId })).rejects.toThrow("FORBIDDEN");
    participant.disconnect(); outsider.disconnect();
  });

  it("persists before broadcast, ACKs, and deduplicates clientMessageId", async () => {
    const sender = await connect(participantToken);
    const receiver = await connect(secondParticipantToken);
    await emitAck(sender, "conversation:join", { conversationId });
    await emitAck(receiver, "conversation:join", { conversationId });
    const received: unknown[] = [];
    receiver.on("message:created", (message) => received.push(message));
    const payload = { conversationId, clientMessageId: "socket-client-message-1", body: "Hola desde Socket.io" };
    const first = await emitAck<{ message: { id: string }; deduplicated: boolean }>(sender, "message:send", payload);
    const second = await emitAck<{ message: { id: string }; deduplicated: boolean }>(sender, "message:send", payload);
    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.message.id).toBe(first.message.id);
    expect(await prisma.message.count({ where: { conversationId, clientMessageId: payload.clientMessageId } })).toBe(1);
    expect(received).toHaveLength(2);
    sender.disconnect(); receiver.disconnect();
  });

  it("emits read updates only after an authorized read", async () => {
    const sender = await connect(participantToken);
    const receiver = await connect(secondParticipantToken);
    await emitAck(sender, "conversation:join", { conversationId });
    await emitAck(receiver, "conversation:join", { conversationId });
    const sent = await emitAck<{ message: { id: string } }>(sender, "message:send", { conversationId, clientMessageId: "socket-read-1", body: "Marca leído" });
    const updates: unknown[] = [];
    sender.on("conversation:read-updated", (value) => updates.push(value));
    await emitAck(receiver, "conversation:read", { conversationId, messageId: sent.message.id });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ conversationId, messageId: sent.message.id, userId: secondParticipantId });
    sender.disconnect(); receiver.disconnect();
  });
});
