import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { generate } from "otplib";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createSession } from "@/server/auth/session.service";
import { serializeSessionCookie } from "@/lib/auth";
import { encryptTotpSecret, getPendingTotpSecretForTests } from "@/features/admin/application/totp.service";
import { createTotpSecret } from "@/features/admin/infrastructure/totp.provider";
import { hashPassword } from "@/server/auth/password";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

beforeAll(async () => {
  container = await new PostgreSqlContainer(process.env.TEST_POSTGRES_IMAGE ?? "toolyo-postgres:15-pgvector-postgis").withDatabase("toolyo_admin_test").withUsername("toolyo").withPassword("toolyo").start();
  const dbUrl = container.getConnectionUri();
  process.env.DATABASE_URL = dbUrl;
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "pipe" });
}, 120_000);

afterAll(async () => { await prisma?.$disconnect(); await container?.stop(); });

async function adminCaller(userId: string) {
  const session = await createSession(prisma, { userId });
  const request = new Request("http://localhost/api/trpc", { headers: { cookie: serializeSessionCookie(session.token, session.ttlSeconds) } });
  return appRouter.createCaller(await createTRPCContext({ prisma, request }));
}

describe("admin authentication and RBAC", () => {
  it("sets up, confirms and revokes TOTP with a real PostgreSQL database", async () => {
    const user = await prisma.user.create({ data: { emailNormalized: "admin-setup@toolyo.dev", accountStatus: "active", role: "ADMIN" } });
    const caller = await adminCaller(user.id);
    const setup = await caller.admin.startTotpSetup({ confirmation: "integration" });
    expect(setup.qrDataUrl).toMatch(/^data:image\/png/);
    expect(setup.setupId).toBeTruthy();
    const setupSecret = getPendingTotpSecretForTests(setup.setupId);
    const setupCode = await generate({ secret: setupSecret! });
    await expect(caller.admin.confirmTotpSetup({ setupId: setup.setupId, code: setupCode })).resolves.toMatchObject({ enabled: true });
    await expect(caller.admin.revokeTotp({ reason: "integration cleanup" })).resolves.toMatchObject({ revoked: true });
  });

  it("creates a PENDING_2FA challenge and consumes it only once", async () => {
    const secret = createTotpSecret();
    const passwordHash = await hashPassword("AdminPassword123!");
    const user = await prisma.user.create({ data: { emailNormalized: "admin-login@toolyo.dev", accountStatus: "active", role: "ADMIN", passwordCredential: { create: { passwordHash } }, totpCredential: { create: { secretCiphertext: encryptTotpSecret(secret), keyVersion: "v1", isEnabled: true, enabledAt: new Date() } } } });
    const request = new Request("http://localhost/api/trpc");
    const caller = appRouter.createCaller(await createTRPCContext({ prisma, request }));
    const login = await caller.auth.loginWithPassword({ email: user.emailNormalized, password: "AdminPassword123!" });
    expect(login.sessionState).toBe("PENDING_2FA");
    expect(login.challengeId).toBeTruthy();
    const code = await generate({ secret });
    const verified = await caller.admin.verifyTotp({ challengeId: login.challengeId!, code });
    expect(verified.sessionState).toBe("AUTHENTICATED");
    await expect(caller.admin.verifyTotp({ challengeId: login.challengeId!, code })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects administrative access for a regular user", async () => {
    const user = await prisma.user.create({ data: { emailNormalized: "regular-admin-test@toolyo.dev", accountStatus: "active", role: "user" } });
    const caller = await adminCaller(user.id);
    await expect(caller.admin.startTotpSetup({ confirmation: "blocked" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});