import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createSession } from "@/server/auth/session.service";
import { serializeSessionCookie } from "@/lib/auth";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
beforeAll(async () => { container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_kyc_test").withUsername("toolyo").withPassword("toolyo").start(); const dbUrl = container.getConnectionUri(); process.env.DATABASE_URL = dbUrl; prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" }); }, 120_000);
afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

async function callerFor(userId: string) { const session = await createSession(prisma, { userId }); return appRouter.createCaller(await createTRPCContext({ prisma, request: new Request("http://localhost", { headers: { cookie: serializeSessionCookie(session.token, session.ttlSeconds) } }) })); }

describe("admin users and KYC", () => {
  it("lists users, reviews KYC, suspends/reactivates and enforces RBAC", async () => {
    const admin = await prisma.user.create({ data: { emailNormalized: "kyc-admin@toolyo.dev", accountStatus: "active", role: "ADMIN" } });
    const moderator = await prisma.user.create({ data: { emailNormalized: "kyc-mod@toolyo.dev", accountStatus: "active", role: "MODERATOR" } });
    const target = await prisma.user.create({ data: { emailNormalized: "kyc-target@toolyo.dev", accountStatus: "active", role: "user" } });
    const verification = await prisma.identityVerification.create({ data: { userId: target.id, provider: "test", providerReference: `test-${target.id}`, status: "pending", termsVersion: "test" } });
    const adminCaller = await callerFor(admin.id);
    const modCaller = await callerFor(moderator.id);
    await expect(adminCaller.admin.listUsers({ limit: 10 })).resolves.toMatchObject({ items: expect.any(Array) });
    await expect(adminCaller.admin.reviewKyc({ verificationId: verification.id, decision: "verified", reason: "Documentación válida" })).resolves.toMatchObject({ status: "verified" });
    await expect(adminCaller.admin.suspendUser({ userId: target.id, reason: "Revisión administrativa" })).resolves.toMatchObject({ accountStatus: "suspended" });
    await expect(adminCaller.admin.reactivateUser({ userId: target.id })).resolves.toMatchObject({ accountStatus: "active" });
    await expect(modCaller.admin.getUserKycDetails({ verificationId: verification.id })).resolves.toMatchObject({ status: "verified" });
  });
});