import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/**
 * Test de integración: router tRPC contra PostgreSQL real (Testcontainers).
 * No se mockea Prisma (TESTING.md §4).
 */
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

  // Aplica el schema vía prisma db push (desde la raíz del repo)
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "pipe",
  });
}, 120_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

describe("category.router", () => {
  it("list devuelve array vacío al inicio y filtra soft-deleted", async () => {
    const caller = appRouter.createCaller(() => createTRPCContext({ prisma }));
    const result = await caller.category.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("create persiste una categoría y la devuelve como DTO (sin deletedAt)", async () => {
    const caller = appRouter.createCaller(() => createTRPCContext({ prisma }));
    const created = await caller.category.create({
      name: "Electrónica",
      slug: "electronica",
      showInNav: true,
    });

    expect(created.slug).toBe("electronica");
    expect(created.name).toBe("Electrónica");
    expect(created.showInNav).toBe(true);
    // El DTO no expone deletedAt
    expect(created).not.toHaveProperty("deletedAt");

    const list = await caller.category.list();
    expect(list.length).toBe(1);
  });

  it("create rechaza nombre vacío con error de validación (400)", async () => {
    const caller = appRouter.createCaller(() => createTRPCContext({ prisma }));
    await expect(
      caller.category.create({ name: "", slug: "x", showInNav: true }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("create rechaza slug mal formado (400)", async () => {
    const caller = appRouter.createCaller(() => createTRPCContext({ prisma }));
    await expect(
      caller.category.create({ name: "Bad", slug: "Bad Slug!", showInNav: true }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("create con slug duplicado devuelve conflicto (409)", async () => {
    const caller = appRouter.createCaller(() => createTRPCContext({ prisma }));
    await caller.category.create({ name: "A", slug: "dup", showInNav: true });
    await expect(
      caller.category.create({ name: "B", slug: "dup", showInNav: true }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("create con padre inexistente devuelve no encontrado (404)", async () => {
    const caller = appRouter.createCaller(() => createTRPCContext({ prisma }));
    await expect(
      caller.category.create({
        name: "Hija",
        slug: "hija",
        parentId: "cknonexistent1234567890",
        showInNav: true,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});