import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createSession } from "@/server/auth/session.service";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let ownerId: string;
let renterId: string;
let listingId: string;

beforeAll(async () => {
  container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_test").withUsername("toolyo").withPassword("toolyo").start();
  const dbUrl = container.getConnectionUri();
  process.env.DATABASE_URL = dbUrl;
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });

  const owner = await prisma.user.create({ data: { emailNormalized: "booking-owner@toolyo.dev", accountStatus: "active", displayName: "Owner" } });
  const renter = await prisma.user.create({ data: { emailNormalized: "booking-renter@toolyo.dev", accountStatus: "active", displayName: "Renter" } });
  ownerId = owner.id;
  renterId = renter.id;
  const category = await prisma.category.create({ data: { name: "Booking category", slug: "booking-category" } });
  const listing = await prisma.listing.create({ data: { ownerId, categoryId: category.id, title: "Booking listing", slug: "booking-listing", pricePerDay: 20, status: "published" } });
  listingId = listing.id;
}, 120_000);

beforeEach(async () => {
  await prisma.messageAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.$executeRawUnsafe('ALTER TABLE "BookingStatusHistory" DISABLE TRIGGER booking_status_history_immutable');
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.$executeRawUnsafe('ALTER TABLE "BookingStatusHistory" ENABLE TRIGGER booking_status_history_immutable');
  await prisma.conversationParticipant.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.conversation.deleteMany();
});

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

async function callerFor(userId: string) {
  const session = await createSession(prisma, { userId });
  return appRouter.createCaller(() => createTRPCContext({ prisma, request: new Request("http://localhost", { headers: { cookie: `toolyo_session=${session.token}` } }) }));
}

describe("booking.request integration", () => {
  it("creates booking, history, conversation and both participants atomically", async () => {
    const caller = await callerFor(renterId);
    const result = await caller.booking.request({ listingId, startDate: "2030-06-01", endDate: "2030-06-04", idempotencyKey: "request-integration-1" });
    expect(result.status).toBe("pending");
    expect(result.financials).toMatchObject({ pricePerDay: "20", totalDays: 3, subtotal: "60", serviceFee: "6", totalPrice: "66" });
    expect(await prisma.conversationParticipant.count({ where: { conversationId: result.conversationId } })).toBe(2);
    expect(await prisma.bookingStatusHistory.count({ where: { bookingId: result.id } })).toBe(1);
  });

  it("returns the existing booking for an idempotent retry", async () => {
    const caller = await callerFor(renterId);
    const input = { listingId, startDate: "2030-07-01", endDate: "2030-07-03", idempotencyKey: "request-integration-2" };
    const first = await caller.booking.request(input);
    const second = await caller.booking.request(input);
    expect(second.id).toBe(first.id);
    expect(second.deduplicated).toBe(true);
    expect(await prisma.booking.count()).toBe(1);
    expect(await prisma.conversation.count()).toBe(1);
  });

  it("rejects an overlapping request without creating a partial conversation", async () => {
    const caller = await callerFor(renterId);
    await caller.booking.request({ listingId, startDate: "2030-08-01", endDate: "2030-08-04", idempotencyKey: "request-integration-3" });
    await expect(caller.booking.request({ listingId, startDate: "2030-08-03", endDate: "2030-08-05", idempotencyKey: "request-integration-4" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await prisma.conversation.count()).toBe(1);
  });
});
