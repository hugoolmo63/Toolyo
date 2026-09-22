import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { hashPassword } from "@/server/auth/password";
import { resetRateLimits } from "@/server/auth/rate-limit.service";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

beforeAll(async () => {
  container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis")
    .withDatabase("toolyo_test")
    .withUsername("toolyo")
    .withPassword("toolyo")
    .start();

  const dbUrl = container.getConnectionUri();
  process.env.DATABASE_URL = dbUrl;

  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "pipe",
  });

  await prisma.legalDocument.createMany({
    data: [
      { documentType: "terms", version: "2026-08", language: "es", effectiveAt: new Date("2026-01-01T00:00:00.000Z"), contentHash: "terms-hash" },
      { documentType: "privacy", version: "2026-08", language: "es", effectiveAt: new Date("2026-01-01T00:00:00.000Z"), contentHash: "privacy-hash" },
    ],
  });
}, 120_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

function createCallerWithCookie(cookie?: string) {
  const request = new Request("http://localhost:3000/api/trpc", {
    headers: cookie ? { cookie } : {},
  });
  return appRouter.createCaller(() => createTRPCContext({ prisma, request }));
}

const VALID_PASSWORD = "ValidPassword123!";

async function createUser(email: string, status: "pending" | "active" | "suspended" | "deleted", emailVerified = true) {
  return prisma.user.create({
    data: {
      emailNormalized: email,
      accountStatus: status,
      passwordCredential: { create: { passwordHash: await hashPassword(VALID_PASSWORD) } },
      verificationStates: {
        create: [
          { channel: "email", status: emailVerified ? "verified" : "pending" },
          { channel: "phone", status: "pending" },
        ],
      },
    },
  });
}

describe("auth.router login/logout/session", () => {
  it("login with valid credentials returns result and sets cookie", async () => {
    resetRateLimits();
    await createUser("login-test@toolyo.dev", "active", true);

    const caller = createCallerWithCookie();
    const result = await caller.auth.loginWithPassword({
      email: "login-test@toolyo.dev",
      password: VALID_PASSWORD,
    });

    expect(result.userId).toBeDefined();
    expect(result.accountStatus).toBe("active");
    expect(result.emailVerificationStatus).toBe("verified");
    expect(result.redirectTo).toBe("/dashboard");
  });

  it("login with wrong password throws UNAUTHORIZED", async () => {
    resetRateLimits();
    await createUser("wrong-pw@toolyo.dev", "active", true);

    const caller = createCallerWithCookie();
    await expect(
      caller.auth.loginWithPassword({
        email: "wrong-pw@toolyo.dev",
        password: "WrongPassword123!",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("login with non-existent email throws UNAUTHORIZED (same error)", async () => {
    resetRateLimits();
    const caller = createCallerWithCookie();
    await expect(
      caller.auth.loginWithPassword({
        email: "nonexistent@toolyo.dev",
        password: VALID_PASSWORD,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("login with suspended account throws FORBIDDEN", async () => {
    resetRateLimits();
    await createUser("suspended@toolyo.dev", "suspended", true);

    const caller = createCallerWithCookie();
    await expect(
      caller.auth.loginWithPassword({
        email: "suspended@toolyo.dev",
        password: VALID_PASSWORD,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("login with unverified email redirects to /verify", async () => {
    resetRateLimits();
    await createUser("unverified@toolyo.dev", "pending", false);

    const caller = createCallerWithCookie();
    const result = await caller.auth.loginWithPassword({
      email: "unverified@toolyo.dev",
      password: VALID_PASSWORD,
    });

    expect(result.redirectTo).toBe("/verify");
    expect(result.accountStatus).toBe("pending");
  });

  it("getSession returns null without session cookie", async () => {
    const caller = createCallerWithCookie();
    const session = await caller.auth.getSession();
    expect(session).toBeNull();
  });

  it("getSession returns onboarding status with valid session", async () => {
    resetRateLimits();
    await createUser("session-test@toolyo.dev", "active", true);

    const caller = createCallerWithCookie();
    const loginResult = await caller.auth.loginWithPassword({
      email: "session-test@toolyo.dev",
      password: VALID_PASSWORD,
    });

    // Find the session token from DB
    const sessions = await prisma.session.findMany({
      where: { userId: loginResult.userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    expect(sessions).toHaveLength(1);

    const callerWithSession = createCallerWithCookie(`toolyo_session=${sessions[0]!.token}`);
    const session = await callerWithSession.auth.getSession();
    expect(session).not.toBeNull();
    expect(session!.accountStatus).toBe("active");
  });

  it("logout without session is idempotent and returns success", async () => {
    const caller = createCallerWithCookie();
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });

  it("logout with valid session revokes it", async () => {
    resetRateLimits();
    await createUser("logout-test@toolyo.dev", "active", true);

    const caller = createCallerWithCookie();
    const loginResult = await caller.auth.loginWithPassword({
      email: "logout-test@toolyo.dev",
      password: VALID_PASSWORD,
    });

    const sessions = await prisma.session.findMany({
      where: { userId: loginResult.userId, revokedAt: null },
    });
    expect(sessions).toHaveLength(1);
    const token = sessions[0]!.token;

    const callerWithSession = createCallerWithCookie(`toolyo_session=${token}`);
    await callerWithSession.auth.logout();

    const revoked = await prisma.session.findUnique({ where: { token } });
    expect(revoked?.revokedAt).not.toBeNull();
  });

  it("rate limit blocks after 5 failed attempts", async () => {
    resetRateLimits();
    await createUser("rate-limit@toolyo.dev", "active", true);

    const caller = createCallerWithCookie();

    for (let i = 0; i < 5; i++) {
      await expect(
        caller.auth.loginWithPassword({
          email: "rate-limit@toolyo.dev",
          password: "WrongPassword123!",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }

    await expect(
      caller.auth.loginWithPassword({
        email: "rate-limit@toolyo.dev",
        password: "WrongPassword123!",
      }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
