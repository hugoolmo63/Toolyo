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
let outsiderId: string;
let listingId: string;

beforeAll(async () => {
  container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_test").withUsername("toolyo").withPassword("toolyo").start();
  const dbUrl = container.getConnectionUri();
  process.env.DATABASE_URL = dbUrl;
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
  const owner = await prisma.user.create({ data: { emailNormalized: "router-owner@toolyo.dev", accountStatus: "active" } });
  const renter = await prisma.user.create({ data: { emailNormalized: "router-renter@toolyo.dev", accountStatus: "active" } });
  const outsider = await prisma.user.create({ data: { emailNormalized: "router-outsider@toolyo.dev", accountStatus: "active" } });
  ownerId = owner.id; renterId = renter.id; outsiderId = outsider.id;
  const category = await prisma.category.create({ data: { name: "Router category", slug: "router-category" } });
  listingId = (await prisma.listing.create({ data: { ownerId, categoryId: category.id, title: "Router listing", slug: "router-listing", pricePerDay: 30, status: "published" } })).id;
}, 120_000);

beforeEach(async () => {
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.conversation.deleteMany();
});

afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

async function callerFor(userId: string) {
  const session = await createSession(prisma, { userId });
  return appRouter.createCaller(() => createTRPCContext({ prisma, request: new Request("http://localhost", { headers: { cookie: `toolyo_session=${session.token}` } }) }));
}

describe("booking router integration", () => {
  it("accepts and rejects only pending requests by the owner and writes history", async () => {
    const renterCaller = await callerFor(renterId);
    const ownerCaller = await callerFor(ownerId);
    const booking = await renterCaller.booking.request({ listingId, startDate: "2030-09-01", endDate: "2030-09-03", idempotencyKey: "router-accept" });
    await expect(renterCaller.booking.accept({ bookingId: booking.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const accepted = await ownerCaller.booking.accept({ bookingId: booking.id });
    expect(accepted.status).toBe("accepted");
    expect(await prisma.bookingStatusHistory.count({ where: { bookingId: booking.id } })).toBe(2);

    const rejectedBooking = await renterCaller.booking.request({ listingId, startDate: "2030-10-01", endDate: "2030-10-03", idempotencyKey: "router-reject" });
    const rejected = await ownerCaller.booking.reject({ bookingId: rejectedBooking.id, reason: "Fechas no disponibles" });
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toBe("Fechas no disponibles");
  });

  it("lists and gets only bookings belonging to the actor", async () => {
    const renterCaller = await callerFor(renterId);
    const outsiderCaller = await callerFor(outsiderId);
    const booking = await renterCaller.booking.request({ listingId, startDate: "2030-11-01", endDate: "2030-11-03", idempotencyKey: "router-list" });
    const list = await renterCaller.booking.list({});
    expect(list.items.map((item) => item.id)).toContain(booking.id);
    expect((await renterCaller.booking.getById({ bookingId: booking.id })).conversationId).toBe(booking.conversationId);
    await expect(outsiderCaller.booking.getById({ bookingId: booking.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
