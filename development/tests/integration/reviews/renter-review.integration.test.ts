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
let categoryId: string;

beforeAll(async () => {
  container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_test").withUsername("toolyo").withPassword("toolyo").start();
  const dbUrl = container.getConnectionUri();
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
  ownerId = (await prisma.user.create({ data: { emailNormalized: "review-owner@toolyo.dev", accountStatus: "active" } })).id;
  renterId = (await prisma.user.create({ data: { emailNormalized: "review-renter@toolyo.dev", accountStatus: "active" } })).id;
  categoryId = (await prisma.category.create({ data: { name: "Review category", slug: "review-category" } })).id;
  listingId = (await prisma.listing.create({ data: { ownerId, categoryId, title: "Review listing", slug: "review-listing", pricePerDay: 30, status: "published" } })).id;
}, 120_000);

beforeEach(async () => {
  await prisma.$executeRawUnsafe('ALTER TABLE "BookingStatusHistory" DISABLE TRIGGER booking_status_history_immutable');
  await prisma.reviewCategoryScore.deleteMany();
  await prisma.review.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.$executeRawUnsafe('ALTER TABLE "BookingStatusHistory" ENABLE TRIGGER booking_status_history_immutable');
  await prisma.conversationParticipant.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.conversation.deleteMany();
});

afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

async function callerFor(userId: string) {
  const session = await createSession(prisma, { userId });
  const ctx = await createTRPCContext({ prisma, request: new Request("http://localhost", { headers: { cookie: `toolyo_session=${session.token}` } }) });
  return appRouter.createCaller(ctx);
}

async function createCompletedBooking() {
  const conversation = await prisma.conversation.create({ data: { listingId, participants: { create: [{ userId: renterId }, { userId: ownerId }] } } });
  return prisma.booking.create({ data: {
    listingId, renterId, ownerId, conversationId: conversation.id, startDate: new Date("2030-01-01"), endDate: new Date("2030-01-04"), status: "completed", completedAt: new Date("2030-01-04T12:00:00Z"), pricePerDay: 30, totalDays: 3, subtotal: 90, serviceFee: 9, totalPrice: 99, idempotencyKey: `review-${Date.now()}`,
    statusHistory: { create: { fromStatus: null, toStatus: "completed", changedById: ownerId } },
  } });
}

const scores = [
  { category: "communication", rating: 5 },
  { category: "punctuality", rating: 4 },
  { category: "product_condition", rating: 5 },
];
const ownerScores = [
  { category: "communication", rating: 5 },
  { category: "punctuality", rating: 4 },
  { category: "product_care", rating: 5 },
];

describe("reviews.createRenterReview", () => {
  it("creates a pending/hidden renter review and exposes it to the author", async () => {
    const booking = await createCompletedBooking();
    const renter = await callerFor(renterId);
    const created = await renter.reviews.createRenterReview({ bookingId: booking.id, overallRating: 5, categoryScores: scores, comment: "Todo perfecto" });
    expect(created.status).toBe("hidden");
    expect(created.publicationReason).toBe("awaiting_other_review");
    const pending = await renter.reviews.getPendingForBooking({ bookingId: booking.id });
    expect(pending.status).toBe("hidden");
    expect(pending.review?.comment).toBe("Todo perfecto");
    expect((await prisma.review.findUnique({ where: { id: created.id } }))?.expiresAt).toEqual(new Date("2030-01-18T12:00:00.000Z"));
  });

  it("publishes both reviews together when the counterpart is submitted", async () => {
    const booking = await createCompletedBooking();
    const renter = await callerFor(renterId);
    const owner = await callerFor(ownerId);
    await renter.reviews.createRenterReview({ bookingId: booking.id, overallRating: 5, categoryScores: scores });
    const second = await owner.reviews.createOwnerReview({ bookingId: booking.id, overallRating: 4, categoryScores: ownerScores });
    expect(second.status).toBe("published");
    expect(second.publicationReason).toBe("both_reviews_submitted");
    const reviews = await prisma.review.findMany({ where: { bookingId: booking.id }, orderBy: { direction: "asc" } });
    expect(reviews).toHaveLength(2);
    expect(reviews.every((review) => review.status === "published")).toBe(true);
    expect(reviews[0]?.publishedAt).toEqual(reviews[1]?.publishedAt);
  });

  it("rejects a duplicate renter review", async () => {
    const booking = await createCompletedBooking();
    const renter = await callerFor(renterId);
    const input = { bookingId: booking.id, overallRating: 5, categoryScores: scores };
    await renter.reviews.createRenterReview(input);
    await expect(renter.reviews.createRenterReview(input)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects a renter review after the 14-day window", async () => {
    const conversation = await prisma.conversation.create({ data: { listingId, participants: { create: [{ userId: renterId }, { userId: ownerId }] } } });
    const booking = await prisma.booking.create({ data: {
      listingId, renterId, ownerId, conversationId: conversation.id, startDate: new Date("2026-01-01"), endDate: new Date("2026-01-04"), status: "completed", completedAt: new Date("2020-01-04T12:00:00Z"), pricePerDay: 30, totalDays: 3, subtotal: 90, serviceFee: 9, totalPrice: 99, idempotencyKey: `expired-${Date.now()}`,
    } });
    const renter = await callerFor(renterId);
    await expect(renter.reviews.createRenterReview({ bookingId: booking.id, overallRating: 5, categoryScores: scores })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("does not allow an owner or outsider to submit the renter review", async () => {
    const booking = await createCompletedBooking();
    const owner = await callerFor(ownerId);
    await expect(owner.reviews.createRenterReview({ bookingId: booking.id, overallRating: 5, categoryScores: scores })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates a hidden owner review with owner-only categories", async () => {
    const booking = await createCompletedBooking();
    const owner = await callerFor(ownerId);
    const created = await owner.reviews.createOwnerReview({ bookingId: booking.id, overallRating: 4, categoryScores: ownerScores, comment: "Entrega puntual" });
    expect(created.status).toBe("hidden");
    expect(created.direction).toBe("owner_to_renter");
    expect(created.categoryScores.map((score) => score.category)).toEqual(["communication", "punctuality", "product_care"]);
    await expect(owner.reviews.createOwnerReview({ bookingId: booking.id, overallRating: 4, categoryScores: ownerScores })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("blocks the renter from using createOwnerReview", async () => {
    const booking = await createCompletedBooking();
    const renter = await callerFor(renterId);
    await expect(renter.reviews.createOwnerReview({ bookingId: booking.id, overallRating: 4, categoryScores: ownerScores })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("public reputation counts only published reviews", async () => {
    const booking = await createCompletedBooking();
    await prisma.review.create({ data: { bookingId: booking.id, listingId, authorId: renterId, revieweeId: ownerId, direction: "renter_to_owner", status: "published", rating: 5, overallRating: 5, categoryScores: { create: scores } } });
    await prisma.review.create({ data: { bookingId: booking.id, listingId, authorId: ownerId, revieweeId: renterId, direction: "owner_to_renter", status: "hidden", rating: 1, overallRating: 1, categoryScores: { create: ownerScores } } });
    const publicCaller = appRouter.createCaller(await createTRPCContext({ prisma, request: new Request("http://localhost") }));
    const reputation = await publicCaller.reviews.getListingReputation({ listingId });
    expect(reputation.reviewCount).toBe(1);
    expect(reputation.averageRating).toBe(5);
  });
});