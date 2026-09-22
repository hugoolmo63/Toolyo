import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgis/postgis:15-3.4-alpine")
    .withDatabase("toolyo_test")
    .withUsername("toolyo")
    .withPassword("toolyo")
    .start();

  const dbUrl = container.getConnectionUri();
  process.env.DATABASE_URL = dbUrl;

  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "pipe",
  });
}, 120_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

describe("Session table constraints", () => {
  it("crea una sesión válida asociada a un usuario", async () => {
    const user = await prisma.user.create({
      data: {
        emailNormalized: "session-test@toolyo.dev",
        accountStatus: "active",
        passwordCredential: { create: { passwordHash: "hash:placeholder" } },
      },
    });

    const session = await prisma.session.create({
      data: {
        token: "unique-test-token-" + Date.now(),
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600_000),
        ip: "127.0.0.1",
        userAgent: "vitest/1.0",
      },
    });

    expect(session.id).toBeDefined();
    expect(session.token).toMatch(/^unique-test-token-/);
    expect(session.revokedAt).toBeNull();
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.updatedAt).toBeInstanceOf(Date);
  });

  it("rechaza token duplicado (unique constraint)", async () => {
    const user = await prisma.user.create({
      data: { emailNormalized: "dup-token@toolyo.dev", accountStatus: "active" },
    });

    const token = "duplicate-token-" + Date.now();
    await prisma.session.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
    });

    await expect(
      prisma.session.create({
        data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
      }),
    ).rejects.toThrow(/unique/i);
  });

  it("elimina sesiones en cascade al borrar el usuario (onDelete: Cascade)", async () => {
    const user = await prisma.user.create({
      data: { emailNormalized: "cascade@toolyo.dev", accountStatus: "active" },
    });

    const token = "cascade-token-" + Date.now();
    await prisma.session.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const remaining = await prisma.session.findUnique({ where: { token } });
    expect(remaining).toBeNull();
  });

  it("permite marcar revokedAt para revocar una sesión", async () => {
    const user = await prisma.user.create({
      data: { emailNormalized: "revoke@toolyo.dev", accountStatus: "active" },
    });

    const token = "revoke-token-" + Date.now();
    const session = await prisma.session.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
    });

    const now = new Date();
    const updated = await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: now },
    });

    expect(updated.revokedAt).toBeInstanceOf(Date);
    expect(updated.revokedAt?.toISOString()).toBe(now.toISOString());
  });

  it("consulta sesiones activas filtrando por revokedAt IS NULL y expiresAt > now", async () => {
    const user = await prisma.user.create({
      data: { emailNormalized: "active-query@toolyo.dev", accountStatus: "active" },
    });

    const activeToken = "active-" + Date.now();
    const revokedToken = "revoked-" + Date.now();
    const expiredToken = "expired-" + Date.now();

    await prisma.session.create({
      data: { token: activeToken, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
    });
    await prisma.session.create({
      data: { token: revokedToken, userId: user.id, expiresAt: new Date(Date.now() + 3600_000), revokedAt: new Date() },
    });
    await prisma.session.create({
      data: { token: expiredToken, userId: user.id, expiresAt: new Date(Date.now() - 1000) },
    });

    const validSessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    expect(validSessions).toHaveLength(1);
    expect(validSessions[0]!.token).toBe(activeToken);
  });
});
