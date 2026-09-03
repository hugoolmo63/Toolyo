import { PrismaClient, Prisma } from "@prisma/client";
import {
  stDWithinClause,
  stDistanceSelect,
  setSeedSql,
} from "@/server/lib/geo/postgis";
import type { SearchQueryInput } from "@/features/search/shared/search.schema";

/**
 * Repositorio de Listing — capa de acceso a datos para búsqueda pública.
 * Solo expone listings `published` con `deletedAt IS NULL` cuyo owner es `active`.
 * Ver research.md y data-model.md.
 */

interface RawListingRow {
  id: string;
  slug: string;
  title: string;
  pricePerDay: Prisma.Decimal;
  lat: Prisma.Decimal | null;
  lng: Prisma.Decimal | null;
  city: string | null;
  ratingAverage: Prisma.Decimal;
  reviewCount: number;
  viewCount: number;
  distance_meters: number | null;
  ownerId: string;
  ownerDisplayName: string | null;
  ownerAvatarUrl: string | null;
  ownerIsVerified: boolean;
  primaryPhotoUrl: string | null;
}

interface RawCountRow {
  count: bigint;
}

const LISTING_SELECT_COLUMNS = `
  "Listing"."id",
  "Listing"."slug",
  "Listing"."title",
  "Listing"."pricePerDay",
  "Listing"."lat",
  "Listing"."lng",
  "Listing"."city",
  "Listing"."ratingAverage",
  "Listing"."reviewCount",
  "Listing"."viewCount",
  "Listing"."ownerId"
`;

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

const PHOTO_JOIN = `
  LEFT JOIN LATERAL (
    SELECT "url" FROM "ListingPhoto"
    WHERE "ListingPhoto"."listingId" = "Listing"."id"
      AND "ListingPhoto"."deletedAt" IS NULL
    ORDER BY "ListingPhoto"."order" ASC
    LIMIT 1
  ) AS photo ON TRUE
`;

const BASE_WHERE = `"Listing"."status" = 'published' AND "Listing"."deletedAt" IS NULL AND owner."id" IS NOT NULL`;

/**
 * Devuelve listings publicados en orden aleatorio con seed estable.
 */
export async function findPublishedListingsRandom(
  prisma: PrismaClient,
  opts: { seed?: number; limit: number },
): Promise<{ rows: RawListingRow[]; total: number }> {
  const { seed, limit } = opts;
  if (seed !== undefined) {
    await prisma.$executeRaw(setSeedSql(seed));
  }

  const rows = await prisma.$queryRaw<RawListingRow[]>`
    SELECT ${Prisma.raw(LISTING_SELECT_COLUMNS)},
      NULL::float8 AS distance_meters,
      NULL::text AS "ownerDisplayName",
      NULL::text AS "ownerAvatarUrl",
      (vs."id" IS NOT NULL) AS "ownerIsVerified",
      photo."url" AS "primaryPhotoUrl"
    FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    ${Prisma.raw(VERIFIED_JOIN)}
    ${Prisma.raw(PHOTO_JOIN)}
    WHERE ${Prisma.raw(BASE_WHERE)}
    ORDER BY random()
    LIMIT ${limit}
  `;

  const countResult = await prisma.$queryRaw<RawCountRow[]>`
    SELECT COUNT(*)::bigint FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    WHERE ${Prisma.raw(BASE_WHERE)}
  `;

  return { rows, total: Number(countResult[0]?.count ?? 0) };
}

/**
 * Construye la cláusula WHERE con los filtros de búsqueda.
 */
function buildFilterWhere(input: SearchQueryInput): string {
  const conditions: string[] = [BASE_WHERE];

  if (input.query) {
    const q = input.query.replace(/'/g, "''");
    conditions.push(`(
      similarity("Listing"."title", '${q}') > 0.15
      OR similarity("Listing"."description", '${q}') > 0.15
    )`);
  }

  if (input.categoryId) {
    // Incluye la categoría y sus subcategorías directas
    conditions.push(`("Listing"."categoryId" = '${input.categoryId.replace(/'/g, "''")}'
      OR "Listing"."categoryId" IN (
        SELECT "id" FROM "Category" WHERE "parentId" = '${input.categoryId.replace(/'/g, "''")}'
      ))`);
  }

  if (input.maxPricePerDay !== undefined) {
    conditions.push(`"Listing"."pricePerDay" <= ${input.maxPricePerDay}`);
  }

  if (input.minRating !== undefined) {
    conditions.push(`"Listing"."ratingAverage" >= ${input.minRating}`);
  }

  if (input.onlyVerified) {
    conditions.push(`vs."id" IS NOT NULL`);
  }

  if (input.dateRange) {
    // Excluye listings con bloqueos que solapen el rango solicitado
    conditions.push(`NOT EXISTS (
      SELECT 1 FROM "ListingAvailability" la
      WHERE la."listingId" = "Listing"."id"
        AND la."blockedDate" >= DATE '${input.dateRange.startDate}'
        AND la."blockedDate" <= DATE '${input.dateRange.endDate}'
    )`);
  }

  return conditions.join(" AND ");
}

/**
 * Construye la cláusula ORDER BY según el criterio de ordenación.
 */
function buildOrderBy(input: SearchQueryInput): string {
  switch (input.sortBy) {
    case "nearest":
      // Requiere location — se maneja con ST_Distance
      if (input.location) {
        return `ORDER BY ST_Distance("Listing"."location", ST_GeomFromText('POINT(${input.location.lng} ${input.location.lat})', 4326)::geography) ASC`;
      }
      return "ORDER BY \"Listing\".\"ratingAverage\" DESC";
    case "price_asc":
      return 'ORDER BY "Listing"."pricePerDay" ASC';
    case "price_desc":
      return 'ORDER BY "Listing"."pricePerDay" DESC';
    case "best_rated":
      return 'ORDER BY "Listing"."ratingAverage" DESC, "Listing"."reviewCount" DESC';
    case "most_popular":
      return 'ORDER BY "Listing"."viewCount" DESC, "Listing"."reviewCount" DESC';
    case "relevance":
    default:
      if (input.query) {
        return `ORDER BY match_score DESC,
          "Listing"."ratingAverage" DESC,
          "Listing"."viewCount" DESC`;
      }
      // Si no hay texto, usamos rating + popularidad como relevancia.
      return 'ORDER BY "Listing"."ratingAverage" DESC, "Listing"."viewCount" DESC';
  }
}

function buildMatchScoreSelect(input: SearchQueryInput): Prisma.Sql {
  if (!input.query) return Prisma.raw(", 0::real AS match_score");
  const q = input.query.replace(/'/g, "''");
  return Prisma.raw(`, similarity("Listing"."title", '${q}') AS match_score`);
}

/**
 * Devuelve listings publicados filtrados y ordenados.
 */
export async function findPublishedListingsFiltered(
  prisma: PrismaClient,
  input: SearchQueryInput,
): Promise<{ rows: RawListingRow[]; total: number }> {
  const whereClause = buildFilterWhere(input);
  const orderByClause = buildOrderBy(input);
  const matchScoreSelect = buildMatchScoreSelect(input);
  const limit = input.limit;

  // Paginación
  let offset = 0;
  let limitClause = `LIMIT ${limit}`;
  if (input.page && input.page > 1) {
    offset = (input.page - 1) * limit;
    limitClause = `LIMIT ${limit} OFFSET ${offset}`;
  }

  // Distancia select si hay location
  const distanceSelect = input.location
    ? Prisma.raw(`, ${stDistanceSelect(input.location.lat, input.location.lng)}`)
    : Prisma.raw("");

  // Filtro de distancia máxima (requiere location)
  const distanceWhere = input.location && input.maxDistanceKm
    ? Prisma.raw(` AND ${stDWithinClause(input.location.lat, input.location.lng, input.maxDistanceKm * 1000)}`)
    : Prisma.raw("");

  const rows = await prisma.$queryRaw<RawListingRow[]>`
    SELECT ${Prisma.raw(LISTING_SELECT_COLUMNS)}${distanceSelect}${matchScoreSelect},
      NULL::text AS "ownerDisplayName",
      NULL::text AS "ownerAvatarUrl",
      (vs."id" IS NOT NULL) AS "ownerIsVerified",
      photo."url" AS "primaryPhotoUrl"
    FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    ${Prisma.raw(VERIFIED_JOIN)}
    ${Prisma.raw(PHOTO_JOIN)}
    WHERE ${Prisma.raw(whereClause)}${distanceWhere}
    ${Prisma.raw(orderByClause)}
    ${Prisma.raw(limitClause)}
  `;

  const countResult = await prisma.$queryRaw<RawCountRow[]>`
    SELECT COUNT(*)::bigint FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    ${Prisma.raw(VERIFIED_JOIN)}
    WHERE ${Prisma.raw(whereClause)}${distanceWhere}
  `;

  return { rows, total: Number(countResult[0]?.count ?? 0) };
}

/**
 * Devuelve listings publicados dentro de un bounding box para el mapa.
 * Solo campos mínimos para pins.
 */
export async function findPublishedListingsInBounds(
  prisma: PrismaClient,
  opts: {
    bounds: { north: number; south: number; east: number; west: number };
    filters: SearchQueryInput;
    limit: number;
  },
): Promise<MapPinRow[]> {
  const { bounds, filters, limit } = opts;
  const whereClause = buildFilterWhere(filters);
  const boundsWhere = `"Listing"."lat" BETWEEN ${bounds.south} AND ${bounds.north}
    AND "Listing"."lng" BETWEEN ${bounds.west} AND ${bounds.east}`;

  const rows = await prisma.$queryRaw<MapPinRow[]>`
    SELECT
      "Listing"."id",
      "Listing"."lat",
      "Listing"."lng",
      "Listing"."title",
      "Listing"."pricePerDay",
      "Listing"."ratingAverage",
      photo."url" AS "primaryPhotoUrl"
    FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    ${Prisma.raw(VERIFIED_JOIN)}
    ${Prisma.raw(PHOTO_JOIN)}
    WHERE ${Prisma.raw(whereClause)} AND ${Prisma.raw(boundsWhere)}
    LIMIT ${limit}
  `;

  return rows;
}

export interface MapPinRow {
  id: string;
  lat: Prisma.Decimal | null;
  lng: Prisma.Decimal | null;
  title: string;
  pricePerDay: Prisma.Decimal;
  ratingAverage: Prisma.Decimal;
  primaryPhotoUrl: string | null;
}

export type { RawListingRow };
