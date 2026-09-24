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
  parentCategoryName?: string | null;
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

export interface RawListingReviewRow {
  id: string;
  rating: number;
  status: "published" | "under_review";
  comment: string | null;
  createdAt: Date;
  authorId: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
}

export async function findReviewsByListingId(prisma: PrismaClient, listingId: string): Promise<RawListingReviewRow[]> {
  return prisma.review.findMany({
    where: { listingId, status: { in: ["published", "under_review"] }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, rating: true, status: true, comment: true, createdAt: true, authorId: true, author: { select: { displayName: true, avatarUrl: true } } },
  }).then((rows) => rows.map((row) => ({ id: row.id, rating: row.rating, status: row.status as "published" | "under_review", comment: row.comment, createdAt: row.createdAt, authorId: row.authorId, authorDisplayName: row.author.displayName, authorAvatarUrl: row.author.avatarUrl })));
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

const PARENT_CATEGORY_JOIN = `
  LEFT JOIN "Category" AS parent_cat ON parent_cat."id" = cat."parentId"
    AND parent_cat."deletedAt" IS NULL
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
      COALESCE(review_stats."ratingAverage", 0)::numeric AS "ratingAverage",
      COALESCE(review_stats."reviewCount", 0)::int AS "reviewCount",
      "Listing"."viewCount",
      "Listing"."isInstantBooking",
      "Listing"."createdAt",
      "Listing"."categoryId",
      cat."name" AS "categoryName",
      cat."slug" AS "categorySlug",
      parent_cat."name" AS "parentCategoryName",
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
    ${Prisma.raw(PARENT_CATEGORY_JOIN)}
    LEFT JOIN LATERAL (
      SELECT AVG("rating") AS "ratingAverage", COUNT(*)::int AS "reviewCount"
      FROM "Review" AS listing_review
      WHERE listing_review."listingId" = "Listing"."id"
        AND listing_review."status" = 'published'
        AND listing_review."deletedAt" IS NULL
    ) AS review_stats ON TRUE
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
 * Devuelve listings similares por cuatro niveles de prioridad: palabra del
 * título, misma categoría, categoría padre y popularidad global.
 */
// TODO: Optimize query or migrate to Elasticsearch/external search engine for high-scale production
export async function findSimilarListings(
  prisma: PrismaClient,
  input: GetSimilarInput,
): Promise<RawSimilarListingRow[]> {
  const { listingId, categoryId, limit } = input;

  return prisma.$queryRaw<RawSimilarListingRow[]>`
    WITH current_product AS (
      SELECT
        current_listing."title",
        current_listing."categoryId",
        "Category"."parentId"
      FROM "Listing" AS current_listing
      LEFT JOIN "Category" ON "Category"."id" = current_listing."categoryId"
        AND "Category"."deletedAt" IS NULL
      WHERE current_listing."id" = ${listingId}
      LIMIT 1
    ), candidates AS (
      SELECT
        l."id",
        l."slug",
        l."title",
        l."pricePerDay",
        l."ratingAverage",
        l."reviewCount",
        l."city",
        photo."url" AS "primaryPhotoUrl",
        similarity(l."title", cp."title") AS "match_score",
        0 AS "priority"
      FROM "Listing" AS l
      LEFT JOIN "User" AS owner ON owner."id" = l."ownerId"
        AND owner."deletedAt" IS NULL
        AND owner."accountStatus" = 'active'
      LEFT JOIN "VerificationState" AS vs ON vs."userId" = l."ownerId"
        AND vs."channel" = 'identity'
        AND vs."status" = 'verified'
      CROSS JOIN current_product AS cp
      LEFT JOIN LATERAL (
        SELECT "url" FROM "ListingPhoto"
        WHERE "ListingPhoto"."listingId" = l."id"
          AND "ListingPhoto"."deletedAt" IS NULL
        ORDER BY "ListingPhoto"."order" ASC
        LIMIT 1
      ) AS photo ON TRUE
      WHERE "l"."status" = 'published'
        AND l."deletedAt" IS NULL
        AND owner."id" IS NOT NULL
        AND l."id" != ${listingId}
        AND l."title" % cp."title"

      UNION ALL

      SELECT
        "Listing"."id",
        "Listing"."slug",
        "Listing"."title",
        "Listing"."pricePerDay",
        "Listing"."ratingAverage",
        "Listing"."reviewCount",
        "Listing"."city",
        photo."url" AS "primaryPhotoUrl",
        0::real AS "match_score",
        1 AS "priority"
      FROM "Listing"
      ${Prisma.raw(OWNER_JOIN)}
      ${Prisma.raw(VERIFIED_JOIN)}
      CROSS JOIN current_product AS cp
      LEFT JOIN LATERAL (
        SELECT "url" FROM "ListingPhoto"
        WHERE "ListingPhoto"."listingId" = "Listing"."id"
          AND "ListingPhoto"."deletedAt" IS NULL
        ORDER BY "ListingPhoto"."order" ASC
        LIMIT 1
      ) AS photo ON TRUE
      WHERE ${Prisma.raw(BASE_WHERE)}
        AND "Listing"."id" != ${listingId}
        AND "Listing"."categoryId" = cp."categoryId"

      UNION ALL

      SELECT
        "Listing"."id",
        "Listing"."slug",
        "Listing"."title",
        "Listing"."pricePerDay",
        "Listing"."ratingAverage",
        "Listing"."reviewCount",
        "Listing"."city",
        photo."url" AS "primaryPhotoUrl",
        0::real AS "match_score",
        2 AS "priority"
      FROM "Listing"
      ${Prisma.raw(OWNER_JOIN)}
      ${Prisma.raw(VERIFIED_JOIN)}
      CROSS JOIN current_product AS cp
      LEFT JOIN LATERAL (
        SELECT "url" FROM "ListingPhoto"
        WHERE "ListingPhoto"."listingId" = "Listing"."id"
          AND "ListingPhoto"."deletedAt" IS NULL
        ORDER BY "ListingPhoto"."order" ASC
        LIMIT 1
      ) AS photo ON TRUE
      WHERE ${Prisma.raw(BASE_WHERE)}
        AND "Listing"."id" != ${listingId}
        AND cp."parentId" IS NOT NULL
        AND "Listing"."categoryId" = cp."parentId"

      UNION ALL

      SELECT
        "Listing"."id",
        "Listing"."slug",
        "Listing"."title",
        "Listing"."pricePerDay",
        "Listing"."ratingAverage",
        "Listing"."reviewCount",
        "Listing"."city",
        photo."url" AS "primaryPhotoUrl",
        0::real AS "match_score",
        3 AS "priority"
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
      WHERE ${Prisma.raw(BASE_WHERE)}
        AND "Listing"."id" != ${listingId}
    ), deduplicated AS (
      SELECT
        candidates.*,
        ROW_NUMBER() OVER (
          PARTITION BY "id"
          ORDER BY "priority" ASC, "match_score" DESC
        ) AS "duplicateRank"
      FROM candidates
    )
    SELECT
      "id",
      "slug",
      "title",
      "pricePerDay",
      "ratingAverage",
      "reviewCount",
      "city",
      "primaryPhotoUrl"
    FROM deduplicated
    WHERE "duplicateRank" = 1
    ORDER BY "priority" ASC, "match_score" DESC, "ratingAverage" DESC, "reviewCount" DESC
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
