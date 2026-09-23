import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { createAttachmentUpload, confirmAttachment } from "@/features/messaging/application/attachment.service";
import { attachConfirmedUploads } from "@/features/messaging/application/attachment.service";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let userId: string;
let conversationId: string;

beforeAll(async () => {
  container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_test").withUsername("toolyo").withPassword("toolyo").start();
  const dbUrl = container.getConnectionUri();
  process.env.DATABASE_URL = dbUrl;
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
  const user = await prisma.user.create({ data: { emailNormalized: "attachment-test@toolyo.dev", accountStatus: "active" } });
  userId = user.id;
  conversationId = (await prisma.conversation.create({ data: { participants: { create: { userId } } } })).id;
}, 120_000);

beforeEach(async () => {
  await prisma.messageAttachment.deleteMany();
  await prisma.attachmentUpload.deleteMany();
  await prisma.message.deleteMany();
});

afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

describe("messaging attachments integration", () => {
  it("creates and confirms an upload, then associates metadata with a message", async () => {
    const upload = await createAttachmentUpload(prisma, userId, { conversationId, mimeType: "image/jpeg", byteSize: 1024, width: 800, height: 600, checksum: "checksum-1" });
    expect(upload.uploadUrl).toContain("token=");
    const confirmed = await confirmAttachment(prisma, userId, { attachmentId: upload.attachmentId, checksum: "checksum-1" });
    const message = await prisma.message.create({ data: { conversationId, senderId: userId, clientMessageId: "attachment-message-1", type: "image" } });
    const attachments = await attachConfirmedUploads(prisma, userId, conversationId, message.id, [confirmed.id]);
    expect(attachments).toHaveLength(1);
    expect((await prisma.messageAttachment.findUnique({ where: { id: attachments[0]!.id } }))?.uploadId).toBe(upload.attachmentId);
  });

  it("rejects confirmation by another user", async () => {
    const upload = await createAttachmentUpload(prisma, userId, { conversationId, mimeType: "image/png", byteSize: 100 });
    await expect(confirmAttachment(prisma, "another-user", { attachmentId: upload.attachmentId })).rejects.toMatchObject({ code: "forbidden" });
  });
});
