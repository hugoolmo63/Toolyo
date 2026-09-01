import { PrismaClient, Prisma } from "@prisma/client";
import { stDWithinClause } from "@/server/lib/geo/postgis";
import type { GetSimilarInput } from "@/features/listing-detail/shared/listing-detail.schema";

/**
 * Repositorio de Listing Detail — capa de acceso a datos para el detalle público.
 * Solo expone listings `published` con `deletedAt IS NULL` cuyo owner es `active`.
 * Ver research.md y data-model.md.
 */

/** Fila raw de Listing con joins para el detalle. */
export interface RawListingDetailRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pricePerDay: Prisma.Decimal;
  lat: Prisma.Decimal | null;
  lng: Prisma.Decimal | null;
  addressText: string | null;
  city: string | null;
  ratingAverage: Prisma.Decimal;
  reviewCount: number;
  viewCount: number;
  isInstantBooking: boolean;
  createdAt: Date;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  ownerId: string;
  ownerDisplayName: string | null;
  ownerAvatarUrl: string | null;
  ownerIsVerified: boolean;
  ownerRatingAverage: Prisma.Decimal | null;
  ownerResponseTimeHours: number | null;
  ownerTransactionCount: number | null;
}

/** Fila raw de foto de listing. */
export interface RawListingPhotoRow {
  id: string;
  url: string;
  altText: string | null;
  order: number;
}

/** Fila raw de bloqueo de disponibilidad. */
export interface RawAvailabilityRow {
  blockedDate: Date;
}

/** Fila raw de listing similar. */
export interface RawSimilarListingRow {
  id: string;
  slug: string;
  title: string;
  pricePerDay: Prisma.Decimal;
  ratingAverage: Prisma.Decimal;
  reviewCount: number;
  city: string | null;
  primaryPhotoUrl: string | null;
}

const OWNER_JOIN = `
  LEFT JOIN "User" AS owner ON owner."id" = "Listing"."ownerId"
    AND owner."deletedAt" IS NULL
    AND owner."accountStatus" = 'active'
`;

const VERIFIED_JOIN = `
  LEFT JOIN "VerificationState" AS vs ON vs."userId" = "Listing"."ownerId"
    AND vs."channel" = 'identity'
    AND vs."status" = 'verified'
`;

const CATEGORY_JOIN = `
  LEFT JOIN "Category" AS cat ON cat."id" = "Listing"."categoryId"
    AND cat."deletedAt" IS NULL
`;

const BASE_WHERE = `"Listing"."status" = 'published' AND "Listing"."deletedAt" IS NULL AND owner."id" IS NOT NULL`;

/**
 * Busca un listing publicado por slug con joins de owner, categoría y verificación.
 * Devuelve null si no existe, no está publicado, o su owner no es active.
 */
export async function findListingBySlug(
  prisma: PrismaClient,
  slug: string,
): Promise<RawListingDetailRow | null> {
  const rows = await prisma.$queryRaw<RawListingDetailRow[]>`
    SELECT
      "Listing"."id",
      "Listing"."slug",
      "Listing"."title",
      "Listing"."description",
      "Listing"."pricePerDay",
      "Listing"."lat",
      "Listing"."lng",
      "Listing"."addressText",
      "Listing"."city",
      "Listing"."ratingAverage",
      "Listing"."reviewCount",
      "Listing"."viewCount",
      "Listing"."isInstantBooking",
      "Listing"."createdAt",
      "Listing"."categoryId",
      cat."name" AS "categoryName",
      cat."slug" AS "categorySlug",
      "Listing"."ownerId",
      owner."displayName" AS "ownerDisplayName",
      owner."avatarUrl" AS "ownerAvatarUrl",
      (vs."id" IS NOT NULL) AS "ownerIsVerified",
      owner."ratingAverage" AS "ownerRatingAverage",
      owner."responseTimeHours" AS "ownerResponseTimeHours",
      owner."transactionCount" AS "ownerTransactionCount"
    FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    ${Prisma.raw(VERIFIED_JOIN)}
    ${Prisma.raw(CATEGORY_JOIN)}
    WHERE ${Prisma.raw(BASE_WHERE)} AND "Listing"."slug" = ${slug}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Devuelve las fotos de un listing ordenadas por `order` ASC, filtrando deletedAt.
 */
export async function findPhotosByListingId(
  prisma: PrismaClient,
  listingId: string,
): Promise<RawListingPhotoRow[]> {
  return prisma.listingPhoto.findMany({
    where: { listingId, deletedAt: null },
    orderBy: { order: "asc" },
    select: { id: true, url: true, altText: true, order: true },
  });
}

/**
 * Devuelve las fechas bloqueadas futuras de un listing (blockedDate >= CURRENT_DATE).
 */
export async function findAvailabilityByListingId(
  prisma: PrismaClient,
  listingId: string,
): Promise<RawAvailabilityRow[]> {
  return prisma.listingAvailability.findMany({
    where: { listingId, blockedDate: { gte: new Date() } },
    select: { blockedDate: true },
    orderBy: { blockedDate: "asc" },
  });
}

/**
 * Devuelve listings similares: misma categoría y/o misma zona, excluyendo el actual.
 * Ordena por rating DESC, reviewCount DESC. Limita a `limit` resultados.
 */
export async function findSimilarListings(
  prisma: PrismaClient,
  input: GetSimilarInput,
): Promise<RawSimilarListingRow[]> {
  const { listingId, categoryId, city, lat, lng, limit } = input;

  const conditions: string[] = [BASE_WHERE, `"Listing"."id" != '${listingId.replace(/'/g, "''")}'`];

  // Priorización: misma categoría OR misma ciudad OR misma zona (50km)
  const orParts: string[] = [`"Listing"."categoryId" = '${categoryId.replace(/'/g, "''")}'`];
  if (city) {
    orParts.push(`"Listing"."city" = '${city.replace(/'/g, "''")}'`);
  }
  if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
    orParts.push(stDWithinClause(lat, lng, 50_000));
  }
  conditions.push(`(${orParts.join(" OR ")})`);

  const whereClause = conditions.join(" AND ");

  return prisma.$queryRaw<RawSimilarListingRow[]>`
    SELECT
      "Listing"."id",
      "Listing"."slug",
      "Listing"."title",
      "Listing"."pricePerDay",
      "Listing"."ratingAverage",
      "Listing"."reviewCount",
      "Listing"."city",
      photo."url" AS "primaryPhotoUrl"
    FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    ${Prisma.raw(VERIFIED_JOIN)}
    LEFT JOIN LATERAL (
      SELECT "url" FROM "ListingPhoto"
      WHERE "ListingPhoto"."listingId" = "Listing"."id"
        AND "ListingPhoto"."deletedAt" IS NULL
      ORDER BY "ListingPhoto"."order" ASC
      LIMIT 1
    ) AS photo ON TRUE
    WHERE ${Prisma.raw(whereClause)}
    ORDER BY "Listing"."ratingAverage" DESC, "Listing"."reviewCount" DESC
    LIMIT ${limit}
  `;
}

/**
 * Incrementa el contador de vistas de un listing (fire-and-forget desde el servicio).
 * Solo incrementa si el listing está publicado y no está eliminado.
 */
export async function incrementListingView(
  prisma: PrismaClient,
  listingId: string,
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Listing"
    SET "viewCount" = "viewCount" + 1
    WHERE "id" = ${listingId}
      AND "deletedAt" IS NULL
      AND "status" = 'published'
  `;
}
