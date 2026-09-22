import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

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

describe("auth.router", () => {
  it("expone los documentos legales vigentes para el registro", async () => {
    const caller = appRouter.createCaller(() => createTRPCContext({ prisma }));

    const documents = await caller.auth.getRegistrationLegalDocuments();

    expect(documents).toHaveLength(2);
    expect(documents.map((document) => document.documentType)).toEqual(["terms", "privacy"]);
    expect(documents.every((document) => document.version === "2026-08")).toBe(true);
  });

  it("crea una cuenta usando los ids de documentos vigentes", async () => {
    const caller = appRouter.createCaller(() => createTRPCContext({ prisma }));
    const [terms, privacy] = await caller.auth.getRegistrationLegalDocuments();

    const result = await caller.auth.registerWithPassword({
      email: "router.fake@toolyo.dev",
      password: "Password12345!",
      termsDocumentId: terms!.id,
      privacyDocumentId: privacy!.id,
      marketingAccepted: false,
    });

    expect(result.accountStatus).toBe("pending");
    const storedUser = await prisma.user.findUnique({ where: { id: result.userId }, include: { legalAcceptances: true } });
    expect(storedUser?.legalAcceptances).toHaveLength(2);
  });
});