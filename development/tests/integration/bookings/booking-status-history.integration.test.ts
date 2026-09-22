import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { acceptBooking, rejectBooking } from "@/features/bookings/application/booking.service";
import { bookingStatusHistoryTransitions } from "../../fixtures/booking-status-history.fixtures";

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
  const owner = await prisma.user.create({ data: { emailNormalized: "history-owner@toolyo.dev", accountStatus: "active" } });
  const renter = await prisma.user.create({ data: { emailNormalized: "history-renter@toolyo.dev", accountStatus: "active" } });
  ownerId = owner.id; renterId = renter.id;
  const category = await prisma.category.create({ data: { name: "History category", slug: "history-category" } });
  listingId = (await prisma.listing.create({ data: { ownerId, categoryId: category.id, title: "History listing", slug: "history-listing", pricePerDay: 20, status: "published" } })).id;
}, 120_000);

beforeEach(async () => {
  // Test isolation needs a privileged cleanup path; production writes remain
  // protected by the immutable trigger.
  await prisma.$executeRawUnsafe('ALTER TABLE "BookingStatusHistory" DISABLE TRIGGER booking_status_history_immutable');
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.$executeRawUnsafe('ALTER TABLE "BookingStatusHistory" ENABLE TRIGGER booking_status_history_immutable');
  await prisma.conversationParticipant.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.conversation.deleteMany();
});

afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

describe("booking status history", () => {
  it("records immutable initial and transition rows atomically", async () => {
    const conversation = await prisma.conversation.create({ data: { listingId, participants: { create: [{ userId: ownerId }, { userId: renterId }] } } });
    const booking = await prisma.booking.create({ data: { listingId, renterId, ownerId, conversationId: conversation.id, startDate: new Date("2037-01-01"), endDate: new Date("2037-01-02"), pricePerDay: 20, totalDays: 1, subtotal: 20, serviceFee: 2, totalPrice: 22, idempotencyKey: "history-test" } });
    await prisma.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: null, toStatus: "pending", changedById: renterId, reason: bookingStatusHistoryTransitions[0]!.reason } });
    await acceptBooking(prisma, ownerId, { bookingId: booking.id });
    const rows = await prisma.bookingStatusHistory.findMany({ where: { bookingId: booking.id }, orderBy: { createdAt: "asc" } });
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => [row.fromStatus, row.toStatus, row.changedById])).toEqual([[null, "pending", renterId], ["pending", "accepted", ownerId]]);
    const accepted = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    await expect(prisma.bookingStatusHistory.delete({ where: { id: rows[0]!.id } })).rejects.toThrow("BookingStatusHistory is immutable");
    expect(await prisma.bookingStatusHistory.count({ where: { bookingId: accepted.id } })).toBe(2);
  });

  it("records rejection reason and actor", async () => {
    const conversation = await prisma.conversation.create({ data: { listingId, participants: { create: [{ userId: ownerId }, { userId: renterId }] } } });
    const booking = await prisma.booking.create({ data: { listingId, renterId, ownerId, conversationId: conversation.id, startDate: new Date("2037-02-01"), endDate: new Date("2037-02-02"), pricePerDay: 20, totalDays: 1, subtotal: 20, serviceFee: 2, totalPrice: 22, idempotencyKey: "history-reject-test" } });
    await prisma.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: null, toStatus: "pending", changedById: renterId } });
    await rejectBooking(prisma, ownerId, { bookingId: booking.id, reason: "No disponible" });
    await expect(prisma.bookingStatusHistory.findFirstOrThrow({ where: { bookingId: booking.id, toStatus: "rejected" } })).resolves.toMatchObject({ changedById: ownerId, reason: "No disponible" });
  });
});
