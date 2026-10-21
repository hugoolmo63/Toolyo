import { PrismaClient, Prisma } from "@prisma/client";
import { stDistanceSelect } from "@/server/lib/geo/postgis";
import type { SearchQueryInput } from "@/features/search/shared/search.schema";
import { EMBEDDING_DIMENSIONS } from "@/lib/embeddings/embedding.service";

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
  photoUrls: string[];
  semantic_score?: number | null;
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
 * Radio por defecto (km) que delimita "la zona" cuando el visitante selecciona
 * una ubicación sin indicar una distancia máxima explícita.
 */
const DEFAULT_LOCATION_RADIUS_KM = 50;

/**
 * Geografía del listing para filtros de proximidad: usa el Point PostGIS si
 * existe y, si no, construye el punto desde lat/lng. Los listings creados desde
 * la app solo rellenan lat/lng (location es NULL), así que el fallback es
 * imprescindible para que el filtro de ubicación no los excluya. Devuelve NULL
 * si el listing no tiene coordenadas.
 */
const LISTING_GEOGRAPHY = `COALESCE(
  "Listing"."location",
  ST_SetSRID(ST_MakePoint("Listing"."lng", "Listing"."lat"), 4326)
)::geography`;

/**
 * Devuelve listings publicados en orden aleatorio con seed estable.
 */
export async function findPublishedListingsRandom(
  prisma: PrismaClient,
  opts: { seed?: number; limit: number; page?: number },
): Promise<{ rows: RawListingRow[]; total: number }> {
  const { seed, limit } = opts;
  const page = opts.page ?? 1;
  const offset = (page - 1) * limit;
  // Orden pseudoaleatorio determinista por seed: estable entre peticiones y
  // conexiones del pool, requisito para que el scroll infinito (OFFSET) no
  // repita ni omita resultados.
  const orderBy = `md5("Listing"."id"::text || ':' || ${seed ?? 0}::text)`;

  const rows = await prisma.$queryRaw<RawListingRow[]>`
    SELECT ${Prisma.raw(LISTING_SELECT_COLUMNS)},
      NULL::float8 AS distance_meters,
      NULL::text AS "ownerDisplayName",
      NULL::text AS "ownerAvatarUrl",
      (vs."id" IS NOT NULL) AS "ownerIsVerified",
      photo."url" AS "primaryPhotoUrl",
      COALESCE((SELECT array_agg(lp."url" ORDER BY lp."order") FROM "ListingPhoto" lp WHERE lp."listingId" = "Listing"."id" AND lp."deletedAt" IS NULL), ARRAY[]::text[]) AS "photoUrls"
    FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    ${Prisma.raw(VERIFIED_JOIN)}
    ${Prisma.raw(PHOTO_JOIN)}
    WHERE ${Prisma.raw(BASE_WHERE)}
    ORDER BY ${Prisma.raw(orderBy)}
    LIMIT ${limit} OFFSET ${offset}
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
function buildFilterWhere(input: SearchQueryInput, includeText = true): string {
  const conditions: string[] = [BASE_WHERE];

  if (input.query && includeText) {
    const q = input.query.replace(/'/g, "''");
    conditions.push(`(
      similarity("Listing"."title", '${q}'::text) > 0.15
      OR similarity("Listing"."description", '${q}'::text) > 0.15
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

  if (input.location) {
    // La ubicación siempre acota el catálogo a "la zona" seleccionada:
    // con distancia máxima explícita se respeta ese radio estrictamente;
    // sin ella se aplica un radio por defecto o la coincidencia por ciudad.
    const point = `ST_GeomFromText('POINT(${input.location.lng} ${input.location.lat})', 4326)::geography`;
    const radiusKm = input.radius ?? input.maxDistanceKm;
    if (radiusKm !== undefined) {
      conditions.push(
        `ST_DWithin(${LISTING_GEOGRAPHY}, ${point}, ${radiusKm * 1000})`,
      );
    } else {
      const city = input.location.text
        .split(",")[0]
        ?.trim()
        .replace(/'/g, "''")
        .replace(/[%_]/g, "");
      const radiusMeters = DEFAULT_LOCATION_RADIUS_KM * 1000;
      conditions.push(
        city
          ? `(ST_DWithin(${LISTING_GEOGRAPHY}, ${point}, ${radiusMeters}) OR "Listing"."city" ILIKE '%${city}%')`
          : `ST_DWithin(${LISTING_GEOGRAPHY}, ${point}, ${radiusMeters})`,
      );
    }
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
        return `ORDER BY ST_Distance(${LISTING_GEOGRAPHY}, ST_GeomFromText('POINT(${input.location.lng} ${input.location.lat})', 4326)::geography) ASC NULLS LAST`;
      }
      return 'ORDER BY "Listing"."ratingAverage" DESC';
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
  return Prisma.raw(`, similarity("Listing"."title", '${q}'::text) AS match_score`);
}

/**
 * Devuelve listings publicados filtrados y ordenados.
 */
export async function findPublishedListingsFiltered(
  prisma: PrismaClient,
  input: SearchQueryInput,
  semanticEmbedding?: number[],
): Promise<{ rows: RawListingRow[]; total: number }> {
  if (
    semanticEmbedding &&
    (semanticEmbedding.length !== EMBEDDING_DIMENSIONS ||
      semanticEmbedding.some((value) => !Number.isFinite(value)))
  ) {
    semanticEmbedding = undefined;
  }
  const textWhereClause = buildFilterWhere(input);
  const whereClause = buildFilterWhere(input, !semanticEmbedding || !input.query);
  const orderByClause =
    semanticEmbedding && input.query
      ? `ORDER BY semantic_score DESC NULLS LAST, match_score DESC, "Listing"."ratingAverage" DESC, "Listing"."viewCount" DESC`
      : buildOrderBy(input);
  const matchScoreSelect = buildMatchScoreSelect(input);
  const vectorValue = semanticEmbedding ? `[${semanticEmbedding.join(",")}]` : "";
  const vectorLiteral = semanticEmbedding
    ? Prisma.sql`CAST(${vectorValue} AS vector)`
    : Prisma.empty;
  const semanticLimitClause = "LIMIT 3";
  const semanticThreshold = 0.38;
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

  const runQuery = async (useSemantic: boolean) => {
    const semanticSelect = useSemantic
      ? Prisma.sql`, CASE WHEN embedding."embedding" IS NULL THEN NULL::real
          ELSE (1 - (embedding."embedding" <=> ${vectorLiteral}))::real END AS semantic_score`
      : Prisma.empty;
    const semanticWhere = useSemantic
      ? Prisma.sql`AND 1 - (embedding."embedding" <=> ${vectorLiteral}) > ${semanticThreshold}`
      : Prisma.empty;

    return prisma.$queryRaw<RawListingRow[]>`
    SELECT ${Prisma.raw(LISTING_SELECT_COLUMNS)}${distanceSelect}${matchScoreSelect}${semanticSelect},
      NULL::text AS "ownerDisplayName",
      NULL::text AS "ownerAvatarUrl",
      (vs."id" IS NOT NULL) AS "ownerIsVerified",
      photo."url" AS "primaryPhotoUrl",
      COALESCE((SELECT array_agg(lp."url" ORDER BY lp."order") FROM "ListingPhoto" lp WHERE lp."listingId" = "Listing"."id" AND lp."deletedAt" IS NULL), ARRAY[]::text[]) AS "photoUrls"
    FROM "Listing"
    ${Prisma.raw(OWNER_JOIN)}
    ${Prisma.raw(VERIFIED_JOIN)}
    ${Prisma.raw(PHOTO_JOIN)}
    ${useSemantic ? Prisma.raw('INNER JOIN "ListingEmbedding" AS embedding ON embedding."listingId" = "Listing"."id"') : Prisma.raw("")}
    WHERE ${Prisma.raw(useSemantic ? whereClause : textWhereClause)} ${semanticWhere}
    ${Prisma.raw(useSemantic ? orderByClause : buildOrderBy(input))}
    ${Prisma.raw(useSemantic ? semanticLimitClause : limitClause)}
  `;
  };

  // A missing extension/table or any vector query problem must never take down text search.
  let rows: RawListingRow[];
  let usedSemantic = false;
  if (semanticEmbedding && input.query) {
    console.log("[search] semantic branch", {
      query: input.query,
      embeddingDimensions: semanticEmbedding.length,
      threshold: semanticThreshold,
    });
    try {
      rows = await runQuery(true);
      console.log("[search] semantic scores", {
        count: rows.length,
        scores: rows.map((row) => row.semantic_score ?? null),
      });
      if (rows.length === 0) {
        console.log("[search] semantic returned 0 rows; falling back to pg_trgm");
        rows = await runQuery(false);
      } else {
        usedSemantic = true;
      }
    } catch (error) {
      console.error("[search] semantic query failed; falling back to pg_trgm", error);
      rows = await runQuery(false);
    }
  } else {
    console.log("[search] pg_trgm fallback branch", {
      hasEmbedding: Boolean(semanticEmbedding),
      query: input.query ?? null,
    });
    rows = await runQuery(false);
  }

  const countResult = usedSemantic
    ? []
    : await prisma.$queryRaw<RawCountRow[]>`
        SELECT COUNT(*)::bigint FROM "Listing"
        ${Prisma.raw(OWNER_JOIN)}
        ${Prisma.raw(VERIFIED_JOIN)}
        WHERE ${Prisma.raw(textWhereClause)}
      `;

  // Semantic results are intentionally capped at three items, so expose the
  // number actually returned instead of the global pg_trgm/catalog count.
  return { rows, total: usedSemantic ? rows.length : Number(countResult[0]?.count ?? 0) };
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
