import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createSession } from "@/server/auth/session.service";
import { serializeSessionCookie } from "@/lib/auth";
import { resolveAdminReviewReport } from "@/features/admin/application/admin-review.service";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
beforeAll(async () => { container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_reviews_audit_test").withUsername("toolyo").withPassword("toolyo").start(); const dbUrl = container.getConnectionUri(); process.env.DATABASE_URL = dbUrl; prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" }); }, 120_000);
afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

async function adminCaller(userId: string) { const session = await createSession(prisma, { userId }); return appRouter.createCaller(await createTRPCContext({ prisma, request: new Request("http://localhost", { headers: { cookie: serializeSessionCookie(session.token, session.ttlSeconds) } }) })); }

describe("admin review moderation and audit", () => {
  it("resolves a report and writes an audit record atomically", async () => {
    const admin = await prisma.user.create({ data: { emailNormalized: "review-admin@toolyo.dev", accountStatus: "active", role: "ADMIN" } });
    const author = await prisma.user.create({ data: { emailNormalized: "review-author@toolyo.dev", accountStatus: "active", role: "user" } });
    const listing = await prisma.listing.create({ data: { ownerId: admin.id, categoryId: (await prisma.category.create({ data: { name: "Audit category", slug: `audit-${Date.now()}` } })).id, title: "Audit listing", slug: `audit-${Date.now()}`, pricePerDay: 10 } });
    const review = await prisma.review.create({ data: { listingId: listing.id, authorId: author.id, status: "under_review", rating: 1, overallRating: 1, comment: "reported" } });
    const report = await prisma.reviewReport.create({ data: { reviewId: review.id, reporterId: admin.id, reason: "offensive" } });
    const caller = await adminCaller(admin.id);
    const result = await caller.admin.resolveReviewReport({ reportId: report.id, decision: "removed", resolution: "Contenido no permitido" });
    expect(result.reviewStatus).toBe("removed");
    expect(await prisma.adminAuditLog.findFirst({ where: { resourceId: report.id, action: "removed" } })).not.toBeNull();
  });

  it("rolls back review changes when audit persistence fails", async () => {
    const admin = await prisma.user.create({ data: { emailNormalized: "rollback-admin@toolyo.dev", accountStatus: "active", role: "ADMIN" } });
    const author = await prisma.user.create({ data: { emailNormalized: "rollback-author@toolyo.dev", accountStatus: "active", role: "user" } });
    const txReview = { id: "review-rollback", status: "under_review", authorId: author.id };
    const txReport = { id: "report-rollback", reviewId: txReview.id, status: "open", review: txReview };
    const fakeTx = { reviewReport: { findUnique: async () => txReport, update: async () => txReport }, review: { update: async () => ({ ...txReview, status: "removed" }) }, adminAuditLog: { create: async () => { throw new Error("audit unavailable"); } } };
    const fakeDb = { $transaction: async (callback: (tx: typeof fakeTx) => unknown) => callback(fakeTx) } as never;
    await expect(resolveAdminReviewReport(fakeDb, admin.id, "ADMIN", { reportId: txReport.id, decision: "removed", resolution: "rollback" })).rejects.toThrow();
  });
});