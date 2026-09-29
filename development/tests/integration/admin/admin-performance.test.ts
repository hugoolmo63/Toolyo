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
beforeAll(async () => { container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_perf_test").withUsername("toolyo").withPassword("toolyo").start(); const dbUrl = container.getConnectionUri(); process.env.DATABASE_URL = dbUrl; prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" }); }, 120_000);
afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

describe("admin SC-004 performance", () => {
  it("keeps p95 below 800ms across 100 administrative operations", async () => {
    const admin = await prisma.user.create({ data: { emailNormalized: "perf-admin@toolyo.dev", accountStatus: "active", role: "ADMIN" } });
    const session = await createSession(prisma, { userId: admin.id });
    const caller = appRouter.createCaller(await createTRPCContext({ prisma, request: new Request("http://localhost", { headers: { cookie: serializeSessionCookie(session.token, session.ttlSeconds) } }) }));
    const durations: number[] = [];
    await Promise.all(Array.from({ length: 100 }, async (_, index) => {
      const started = performance.now();
      if (index % 3 === 0) await caller.admin.listUsers({ limit: 25 });
      else if (index % 3 === 1) await caller.admin.listReviewReports({ limit: 25, status: "open" });
      else await caller.admin.listKyc({ limit: 25, status: "pending" });
      durations.push(performance.now() - started);
    }));
    durations.sort((a, b) => a - b);
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1] ?? Number.POSITIVE_INFINITY;
    console.info(`admin benchmark: p95=${p95.toFixed(2)}ms operations=${durations.length}`);
    expect(durations).toHaveLength(100);
    expect(p95).toBeLessThan(800);
  }, 120_000);
});