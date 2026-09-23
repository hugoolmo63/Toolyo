import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { acceptBooking, rejectBooking } from "@/features/bookings/application/booking.service";

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
  const owner = await prisma.user.create({ data: { emailNormalized: "perf-owner@toolyo.dev", accountStatus: "active" } });
  const renter = await prisma.user.create({ data: { emailNormalized: "perf-renter@toolyo.dev", accountStatus: "active" } });
  ownerId = owner.id; renterId = renter.id;
  const category = await prisma.category.create({ data: { name: "Performance category", slug: "performance-category" } });
  listingId = (await prisma.listing.create({ data: { ownerId, categoryId: category.id, title: "Performance listing", slug: "performance-listing", pricePerDay: 20, status: "published" } })).id;
}, 120_000);

afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

describe("booking transition performance", () => {
  it("keeps accept/reject p95 below two seconds over 100 operations", async () => {
    const durations: number[] = [];
    for (let index = 0; index < 100; index += 1) {
      const start = new Date(Date.UTC(2036, 0, 1 + index * 3));
      const end = new Date(Date.UTC(2036, 0, 2 + index * 3));
      const conversation = await prisma.conversation.create({ data: { listingId, participants: { create: [{ userId: ownerId }, { userId: renterId }] } } });
      const booking = await prisma.booking.create({ data: { listingId, renterId, ownerId, conversationId: conversation.id, startDate: start, endDate: end, pricePerDay: 20, totalDays: 1, subtotal: 20, serviceFee: 2, totalPrice: 22, idempotencyKey: `performance-${index}` } });
      await prisma.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: null, toStatus: "pending", changedById: renterId } });
      const began = performance.now();
      if (index % 2 === 0) await acceptBooking(prisma, ownerId, { bookingId: booking.id });
      else await rejectBooking(prisma, ownerId, { bookingId: booking.id, reason: "Benchmark" });
      durations.push(performance.now() - began);
    }
    durations.sort((left, right) => left - right);
    const percentile = (ratio: number) => durations[Math.min(durations.length - 1, Math.ceil(durations.length * ratio) - 1)]!;
    const metrics = { count: durations.length, p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99), maxMs: durations.at(-1)! };
    console.info("BOOKING_TRANSITION_METRICS", JSON.stringify(metrics));
    expect(metrics.count).toBe(100);
    expect(metrics.p95Ms).toBeLessThan(2000);
  });
});
