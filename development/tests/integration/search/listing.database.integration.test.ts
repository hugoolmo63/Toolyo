import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

beforeAll(async () => {
  // Usamos imagen postgis/postgis para que la extensión PostGIS esté disponible
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

async function createOwner(email: string) {
  return prisma.user.create({
    data: {
      emailNormalized: email,
      accountStatus: "active",
      passwordCredential: { create: { passwordHash: "hash:placeholder" } },
    },
  });
}

async function createCategory(slug: string) {
  return prisma.category.upsert({
    where: { slug },
    update: {},
    create: { name: slug, slug, showInNav: true },
  });
}

async function createListingRaw(
  prisma: PrismaClient,
  id: string,
  ownerId: string,
  categoryId: string,
  slug: string,
  lat: number,
  lng: number,
  status: "published" | "draft" = "published",
) {
  await prisma.$executeRaw`
    INSERT INTO "Listing" (
      "id", "ownerId", "categoryId", "title", "slug", "pricePerDay",
      "location", "lat", "lng", "city", "status", "ratingAverage",
      "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${ownerId}, ${categoryId}, ${`Listing ${id}`}, ${slug}, 50,
      ST_GeomFromText(${`POINT(${lng} ${lat})`}, 4326),
      ${lat}, ${lng}, ${"Madrid"}, ${status}::"ListingStatus", 4.5,
      NOW(), NOW()
    )
  `;
}

describe("Listing table constraints and PostGIS", () => {
  it("crea un listing válido asociado a usuario y categoría", async () => {
    const owner = await createOwner("listing-test-1@toolyo.dev");
    const cat = await createCategory("test-cat-1");
    await createListingRaw(prisma, "test-listing-1", owner.id, cat.id, "test-listing-1-slug", 40.4168, -3.7038);

    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: "test-listing-1" } });
    expect(listing.title).toBe("Listing test-listing-1");
    expect(listing.status).toBe("published");
    expect(Number(listing.pricePerDay)).toBe(50);
  });

  it("rechaza slug duplicado (unique constraint)", async () => {
    const owner = await createOwner("listing-dup@toolyo.dev");
    const cat = await createCategory("test-cat-dup");
    await createListingRaw(prisma, "test-listing-dup-1", owner.id, cat.id, "dup-slug-test", 40.4, -3.7);

    await expect(
      createListingRaw(prisma, "test-listing-dup-2", owner.id, cat.id, "dup-slug-test", 41.3, 2.1),
    ).rejects.toThrow(/unique|already exists/i);
  });

  it("rechaza borrar usuario con listings (onDelete: Restrict)", async () => {
    const owner = await createOwner("listing-restrict@toolyo.dev");
    const cat = await createCategory("test-cat-restrict");
    await createListingRaw(prisma, "test-listing-restrict", owner.id, cat.id, "restrict-slug", 40.4, -3.7);

    await expect(prisma.user.delete({ where: { id: owner.id } })).rejects.toThrow(/foreign key|restrict/i);
  });

  it("borra fotos y disponibilidades en cascade al borrar el listing", async () => {
    const owner = await createOwner("listing-cascade@toolyo.dev");
    const cat = await createCategory("test-cat-cascade");
    await createListingRaw(prisma, "test-listing-cascade", owner.id, cat.id, "cascade-slug", 40.4, -3.7);

    await prisma.listingPhoto.create({
      data: { listingId: "test-listing-cascade", url: "https://example.com/photo.jpg", order: 0 },
    });
    await prisma.listingAvailability.create({
      data: { listingId: "test-listing-cascade", blockedDate: new Date("2026-12-01"), reason: "test" },
    });

    await prisma.listing.delete({ where: { id: "test-listing-cascade" } });

    const photos = await prisma.listingPhoto.findMany({ where: { listingId: "test-listing-cascade" } });
    const avails = await prisma.listingAvailability.findMany({ where: { listingId: "test-listing-cascade" } });
    expect(photos).toHaveLength(0);
    expect(avails).toHaveLength(0);
  });

  it("rechaza bloqueo duplicado para misma fecha (unique listingId+blockedDate)", async () => {
    const owner = await createOwner("listing-avail-dup@toolyo.dev");
    const cat = await createCategory("test-cat-avail-dup");
    await createListingRaw(prisma, "test-listing-avail-dup", owner.id, cat.id, "avail-dup-slug", 40.4, -3.7);

    const date = new Date("2026-12-15");
    await prisma.listingAvailability.create({
      data: { listingId: "test-listing-avail-dup", blockedDate: date },
    });

    await expect(
      prisma.listingAvailability.create({
        data: { listingId: "test-listing-avail-dup", blockedDate: date },
      }),
    ).rejects.toThrow(/unique/i);
  });

  it("ST_DWithin devuelve listings dentro del radio", async () => {
    const owner = await createOwner("listing-st-dwithin@toolyo.dev");
    const cat = await createCategory("test-cat-dwithin");
    // Madrid centro
    await createListingRaw(prisma, "test-listing-near-madrid", owner.id, cat.id, "near-madrid-slug", 40.4168, -3.7038);
    // Barcelona (lejos de Madrid)
    await createListingRaw(prisma, "test-listing-barcelona", owner.id, cat.id, "barcelona-slug", 41.3851, 2.1734);

    // Buscar listings dentro de 50km del centro de Madrid
    const nearby = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Listing"
      WHERE "deletedAt" IS NULL
        AND "status" = 'published'
        AND ST_DWithin(
          "location",
          ST_GeomFromText('POINT(-3.7038 40.4168)', 4326)::geography,
          50000
        )
    `;

    const ids = nearby.map((r) => r.id);
    expect(ids).toContain("test-listing-near-madrid");
    expect(ids).not.toContain("test-listing-barcelona");
  });

  it("ST_Distance calcula distancia correctamente", async () => {
    const owner = await createOwner("listing-st-distance@toolyo.dev");
    const cat = await createCategory("test-cat-distance");
    await createListingRaw(prisma, "test-listing-dist", owner.id, cat.id, "dist-slug", 40.4168, -3.7038);

    const result = await prisma.$queryRaw<{ distance_meters: number }[]>`
      SELECT
        ST_Distance(
          "location",
          ST_GeomFromText('POINT(-3.7 40.42)', 4326)::geography
        ) AS distance_meters
      FROM "Listing"
      WHERE "id" = 'test-listing-dist'
    `;

    expect(result).toHaveLength(1);
    // La distancia entre (40.4168, -3.7038) y (40.42, -3.7) es pequeña (< 5km)
    expect(Number(result[0]!.distance_meters)).toBeLessThan(5000);
  });
});
