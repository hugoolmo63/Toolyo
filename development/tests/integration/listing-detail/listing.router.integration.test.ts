import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { resetRateLimits } from "@/server/auth/rate-limit.service";
import { clearViewDedupCache } from "@/features/listing-detail/application/listing-detail.service";

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

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "pipe",
  });
}, 120_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

import {
  getListingBySlug,
  getSimilarListings,
  incrementView,
} from "@/features/listing-detail/application/listing-detail.service";

async function setupTestData() {
  const owner = await prisma.user.create({
    data: {
      emailNormalized: "detail-test@toolyo.dev",
      accountStatus: "active",
      passwordCredential: { create: { passwordHash: "hash:placeholder" } },
      verificationStates: {
        create: { channel: "identity", status: "verified", verifiedAt: new Date() },
      },
    },
  });

  const cat = await prisma.category.create({
    data: { name: "Detail Category", slug: "detail-cat", showInNav: true },
  });

  // Listing publicado con PostGIS
  const lat = 40.4168;
  const lng = -3.7038;
  await prisma.$executeRaw`
    INSERT INTO "Listing" (
      "id", "ownerId", "categoryId", "title", "slug", "description", "pricePerDay",
      "location", "lat", "lng", "addressText", "city", "status", "ratingAverage",
      "reviewCount", "viewCount", "isInstantBooking", "createdAt", "updatedAt"
    ) VALUES (
      'detail-listing-1', ${owner.id}, ${cat.id}, 'Detail Listing', 'detail-slug-1',
      'Descripción de prueba', 50,
      ST_GeomFromText(${`POINT(${lng} ${lat})`}, 4326),
      ${lat}, ${lng}, 'Centro', 'Madrid', 'published', 4.5,
      10, 100, true, NOW(), NOW()
    )
  `;
  await prisma.listingPhoto.create({
    data: { listingId: "detail-listing-1", url: "https://example.com/photo1.jpg", altText: "Foto 1", order: 0 },
  });
  await prisma.listingPhoto.create({
    data: { listingId: "detail-listing-1", url: "https://example.com/photo2.jpg", altText: "Foto 2", order: 1 },
  });
  await prisma.listingAvailability.create({
    data: { listingId: "detail-listing-1", blockedDate: new Date("2026-12-25T00:00:00Z") },
  });

  // Listing similar en la misma categoría
  await prisma.$executeRaw`
    INSERT INTO "Listing" (
      "id", "ownerId", "categoryId", "title", "slug", "pricePerDay",
      "location", "lat", "lng", "city", "status", "ratingAverage",
      "reviewCount", "viewCount", "createdAt", "updatedAt"
    ) VALUES (
      'detail-listing-2', ${owner.id}, ${cat.id}, 'Similar Listing', 'detail-slug-2',
      40,
      ST_GeomFromText('POINT(-3.704 40.417)', 4326),
      40.417, -3.704, 'Madrid', 'published', 4.0,
      5, 50, NOW(), NOW()
    )
  `;
  await prisma.listingPhoto.create({
    data: { listingId: "detail-listing-2", url: "https://example.com/sim1.jpg", altText: "Similar", order: 0 },
  });

  // Listing en estado draft (no debe aparecer)
  await prisma.$executeRaw`
    INSERT INTO "Listing" (
      "id", "ownerId", "categoryId", "title", "slug", "pricePerDay",
      "location", "lat", "lng", "city", "status", "ratingAverage",
      "createdAt", "updatedAt"
    ) VALUES (
      'detail-listing-draft', ${owner.id}, ${cat.id}, 'Draft', 'detail-slug-draft',
      10,
      ST_GeomFromText('POINT(-3.7038 40.4168)', 4326),
      40.4168, -3.7038, 'Madrid', 'draft', 0,
      NOW(), NOW()
    )
  `;

  return { ownerId: owner.id, categoryId: cat.id };
}

describe("listing.router integration", () => {
  let testData: { ownerId: string; categoryId: string };

  beforeAll(async () => {
    testData = await setupTestData();
  });

  beforeEach(() => {
    resetRateLimits();
    clearViewDedupCache();
  });

  it("getListingBySlug devuelve detalle completo para slug publicado", async () => {
    const result = await getListingBySlug(prisma, { slug: "detail-slug-1" });

    expect(result).not.toBeNull();
    expect(result!.id).toBe("detail-listing-1");
    expect(result!.title).toBe("Detail Listing");
    expect(result!.description).toBe("Descripción de prueba");
    expect(result!.pricePerDay).toBe(50);
    expect(result!.city).toBe("Madrid");
    expect(result!.photos).toHaveLength(2);
    expect(result!.photos[0]!.order).toBe(0);
    expect(result!.owner.isVerified).toBe(true);
    expect(result!.priceTiers).toHaveLength(3);
  });

  it("getListingBySlug devuelve null para slug inexistente", async () => {
    const result = await getListingBySlug(prisma, { slug: "no-existe" });
    expect(result).toBeNull();
  });

  it("getListingBySlug devuelve null para slug no publicado (draft)", async () => {
    const result = await getListingBySlug(prisma, { slug: "detail-slug-draft" });
    expect(result).toBeNull();
  });

  it("getListingBySlug incluye availability como fechas bloqueadas futuras", async () => {
    const result = await getListingBySlug(prisma, { slug: "detail-slug-1" });
    expect(result).not.toBeNull();
    expect(result!.availability).toContain("2026-12-25");
  });

  it("getSimilarListings devuelve similares de misma categoría", async () => {
    const result = await getSimilarListings(prisma, {
      listingId: "detail-listing-1",
      categoryId: testData.categoryId,
      city: "Madrid",
      lat: 40.4168,
      lng: -3.7038,
      limit: 6,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.find((r) => r.id === "detail-listing-1")).toBeUndefined();
  });

  it("getSimilarListings excluye el listing actual", async () => {
    const result = await getSimilarListings(prisma, {
      listingId: "detail-listing-1",
      categoryId: testData.categoryId,
      limit: 6,
    });

    for (const r of result) {
      expect(r.id).not.toBe("detail-listing-1");
    }
  });

  it("getSimilarListings respeta limit", async () => {
    const result = await getSimilarListings(prisma, {
      listingId: "detail-listing-1",
      categoryId: testData.categoryId,
      limit: 1,
    });

    expect(result.length).toBeLessThanOrEqual(1);
  });

  it("getSimilarListings no devuelve listings draft", async () => {
    const result = await getSimilarListings(prisma, {
      listingId: "detail-listing-1",
      categoryId: testData.categoryId,
      limit: 6,
    });

    expect(result.find((r) => r.id === "detail-listing-draft")).toBeUndefined();
  });

  it("incrementView incrementa viewCount en 1", async () => {
    const before = await prisma.listing.findUnique({ where: { id: "detail-listing-1" } });
    const beforeCount = before!.viewCount;

    await incrementView(prisma, "detail-listing-1", "1.2.3.4");

    const after = await prisma.listing.findUnique({ where: { id: "detail-listing-1" } });
    expect(after!.viewCount).toBe(beforeCount + 1);
  });

  it("incrementView deduplica por IP en ventana de 30 min", async () => {
    const before = await prisma.listing.findUnique({ where: { id: "detail-listing-1" } });
    const beforeCount = before!.viewCount;

    await incrementView(prisma, "detail-listing-1", "5.6.7.8");
    await incrementView(prisma, "detail-listing-1", "5.6.7.8");

    const after = await prisma.listing.findUnique({ where: { id: "detail-listing-1" } });
    expect(after!.viewCount).toBe(beforeCount + 1); // Solo una vez
  });

  it("incrementView no incrementa para listing no publicado", async () => {
    const before = await prisma.listing.findUnique({ where: { id: "detail-listing-draft" } });
    const beforeCount = before!.viewCount;

    await incrementView(prisma, "detail-listing-draft", "9.10.11.12");

    const after = await prisma.listing.findUnique({ where: { id: "detail-listing-draft" } });
    expect(after!.viewCount).toBe(beforeCount); // Sin cambio
  });

  it("respuestas no contienen datos privados", async () => {
    const result = await getListingBySlug(prisma, { slug: "detail-slug-1" });

    expect(result).not.toBeNull();
    expect(result!.owner).not.toHaveProperty("email");
    expect(result!.owner).not.toHaveProperty("phone");
    expect(result!.owner).not.toHaveProperty("emailNormalized");
    expect(result!.owner).not.toHaveProperty("phoneE164");
  });
});
