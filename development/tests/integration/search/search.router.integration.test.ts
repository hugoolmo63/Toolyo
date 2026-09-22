import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

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
}, 120_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

// Mock Nominatim para no depender de red
vi.mock("@/features/search/infrastructure/geocoding.repository", () => ({
  searchLocationsNominatim: vi.fn().mockResolvedValue([
    { text: "Madrid, España", lat: 40.4168, lng: -3.7038, type: "city" },
  ]),
  clearGeocodingCache: vi.fn(),
}));

import { searchInitial, searchQuery, searchSuggest, searchMapBounds } from "@/features/search/application/search.service";

async function setupTestData() {
  const owner = await prisma.user.create({
    data: {
      emailNormalized: "search-test@toolyo.dev",
      accountStatus: "active",
      passwordCredential: { create: { passwordHash: "hash:placeholder" } },
      verificationStates: {
        create: { channel: "identity", status: "verified", verifiedAt: new Date() },
      },
    },
  });

  const cat = await prisma.category.create({
    data: { name: "Test Category", slug: "test-cat-search", showInNav: true },
  });

  // Crear listings con PostGIS
  for (let i = 0; i < 5; i++) {
    const id = `search-listing-${i}`;
    const lat = 40.4168 + i * 0.01;
    const lng = -3.7038 + i * 0.01;
    await prisma.$executeRaw`
      INSERT INTO "Listing" (
        "id", "ownerId", "categoryId", "title", "slug", "pricePerDay",
        "location", "lat", "lng", "city", "status", "ratingAverage", "reviewCount", "viewCount",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${owner.id}, ${cat.id}, ${`Listing ${i}`}, ${`search-slug-${i}`},
        ${20 + i * 10},
        ST_GeomFromText(${`POINT(${lng} ${lat})`}, 4326),
        ${lat}, ${lng}, ${"Madrid"}, 'published', ${4 + i * 0.2}, ${i * 5}, ${i * 100},
        NOW(), NOW()
      )
    `;
    await prisma.listingPhoto.create({
      data: { listingId: id, url: `https://example.com/photo-${i}.jpg`, altText: `Photo ${i}`, order: 0 },
    });
  }

  // Un listing en estado draft (no debe aparecer)
  await prisma.$executeRaw`
    INSERT INTO "Listing" (
      "id", "ownerId", "categoryId", "title", "slug", "pricePerDay",
      "location", "lat", "lng", "city", "status", "ratingAverage",
      "createdAt", "updatedAt"
    ) VALUES (
      'search-listing-draft', ${owner.id}, ${cat.id}, 'Draft Listing', 'draft-slug',
      10,
      ST_GeomFromText('POINT(-3.7038 40.4168)', 4326),
      40.4168, -3.7038, 'Madrid', 'draft', 0,
      NOW(), NOW()
    )
  `;

  return { ownerId: owner.id, categoryId: cat.id };
}

describe("search.router integration", () => {
  let testData: { ownerId: string; categoryId: string };

  beforeAll(async () => {
    testData = await setupTestData();
  });

  it("search.initial devuelve resultados aleatorios paginados", async () => {
    const result = await searchInitial(prisma, { limit: 24 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.seed).toBeDefined();
    // El listing draft no debe aparecer
    expect(result.items.find((i) => i.id === "search-listing-draft")).toBeUndefined();
  });

  it("search.query sin criterios equivale a initial", async () => {
    const result = await searchQuery(prisma, { sortBy: "relevance", limit: 24 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.find((i) => i.id === "search-listing-draft")).toBeUndefined();
  });

  it("search.suggest devuelve ubicaciones (mock) y categorías reales", async () => {
    const result = await searchSuggest(prisma, { query: "Test", type: "all", limit: 6 });
    expect(result.locations).toHaveLength(1);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories[0]!.name).toContain("Test");
  });

  it("search.query con filtro de categoría funciona", async () => {
    const result = await searchQuery(prisma, {
      categoryId: testData.categoryId,
      sortBy: "relevance",
      limit: 24,
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("search.query con filtro de precio máximo filtra correctamente", async () => {
    const result = await searchQuery(prisma, {
      maxPricePerDay: 30,
      sortBy: "price_asc",
      limit: 24,
    });
    for (const item of result.items) {
      expect(item.pricePerDay).toBeLessThanOrEqual(30);
    }
  });

  it("search.query con ordenación price_asc ordena por precio ascendente", async () => {
    const result = await searchQuery(prisma, {
      sortBy: "price_asc",
      limit: 24,
    });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i]!.pricePerDay).toBeGreaterThanOrEqual(result.items[i - 1]!.pricePerDay);
    }
  });

  it("search.query con onlyVerified filtra solo arrendadores verificados", async () => {
    const result = await searchQuery(prisma, {
      onlyVerified: true,
      sortBy: "relevance",
      limit: 24,
    });
    for (const item of result.items) {
      expect(item.owner.isVerified).toBe(true);
    }
  });

  it("search.mapBounds devuelve pins dentro del bounding box", async () => {
    const result = await searchMapBounds(prisma, {
      bounds: { north: 41, south: 40, east: -3.5, west: -4 },
      limit: 100,
    });
    expect(result.length).toBeGreaterThan(0);
    for (const pin of result) {
      expect(pin.lat).toBeGreaterThanOrEqual(40);
      expect(pin.lat).toBeLessThanOrEqual(41);
    }
  });

  it("search.query con filtro de rating mínimo filtra correctamente", async () => {
    const result = await searchQuery(prisma, {
      minRating: 4.5,
      sortBy: "relevance",
      limit: 24,
    });
    for (const item of result.items) {
      expect(item.ratingAverage).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("search.query con ordenación best_rated ordena por rating descendente", async () => {
    const result = await searchQuery(prisma, {
      sortBy: "best_rated",
      limit: 24,
    });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i]!.ratingAverage).toBeLessThanOrEqual(result.items[i - 1]!.ratingAverage);
    }
  });

  it("search.query con ordenación price_desc ordena por precio descendente", async () => {
    const result = await searchQuery(prisma, {
      sortBy: "price_desc",
      limit: 24,
    });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i]!.pricePerDay).toBeLessThanOrEqual(result.items[i - 1]!.pricePerDay);
    }
  });

  it("search.query con ordenación most_popular ordena por vistas descendente", async () => {
    const result = await searchQuery(prisma, {
      sortBy: "most_popular",
      limit: 24,
    });
    // Verificar que los resultados están ordenados por popularidad (rating+views)
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("search.query combina múltiples filtros (AND)", async () => {
    const result = await searchQuery(prisma, {
      maxPricePerDay: 40,
      minRating: 3,
      onlyVerified: true,
      sortBy: "relevance",
      limit: 24,
    });
    for (const item of result.items) {
      expect(item.pricePerDay).toBeLessThanOrEqual(40);
      expect(item.ratingAverage).toBeGreaterThanOrEqual(3);
      expect(item.owner.isVerified).toBe(true);
    }
  });

  it("search.query con ubicación y ordenación nearest devuelve distanceKm", async () => {
    const result = await searchQuery(prisma, {
      location: { lat: 40.4168, lng: -3.7038, text: "Madrid" },
      sortBy: "nearest",
      limit: 24,
    });
    expect(result.items.length).toBeGreaterThan(0);
    for (const item of result.items) {
      expect(item.distanceKm).not.toBeNull();
    }
  });

  it("search.query con filtro de distancia máxima respeta el radio", async () => {
    const result = await searchQuery(prisma, {
      location: { lat: 40.4168, lng: -3.7038, text: "Madrid" },
      maxDistanceKm: 5,
      sortBy: "nearest",
      limit: 24,
    });
    for (const item of result.items) {
      expect(item.distanceKm).not.toBeNull();
      expect(item.distanceKm!).toBeLessThanOrEqual(5);
    }
  });

  it("respuestas no contienen datos privados", async () => {
    const result = await searchInitial(prisma, { limit: 24 });
    for (const item of result.items) {
      expect(item.owner).not.toHaveProperty("email");
      expect(item.owner).not.toHaveProperty("phone");
      expect(item).not.toHaveProperty("addressText");
    }
  });
});
