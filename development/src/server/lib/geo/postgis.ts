import { Prisma } from "@prisma/client";

/**
 * Helpers para construir fragmentos SQL PostGIS usados en queries de Listing.
 * Centraliza la lógica geoespacial para que el repositorio sea legible.
 * Ver DATABASE.md §5.4 y research.md (PostGIS con ST_DWithin y ST_Distance).
 *
 * NOTA: Estas funciones devuelven strings planos (no Prisma.Sql) para poder
 * ser interpolados en Prisma.raw() sin problemas de serialización.
 * Los valores de entrada (lat, lng, radiusMeters) están validados por Zod
 * antes de llegar aquí, por lo que es seguro interpolarlos directamente.
 */

/** Genera el WKT de un Point para usar en ST_GeomFromText. */
export function buildPointWKT(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

/**
 * Devuelve un string SQL para filtrar listings dentro de un radio (metros)
 * desde un punto, usando ST_DWithin con el índice GiST.
 */
export function stDWithinClause(lat: number, lng: number, radiusMeters: number): string {
  return `ST_DWithin(
    "Listing"."location",
    ST_GeomFromText('${buildPointWKT(lat, lng)}', 4326)::geography,
    ${radiusMeters}
  )`;
}

/**
 * Devuelve un string SQL para ordenar listings por distancia ascendente
 * desde un punto, usando ST_Distance.
 */
export function stDistanceClause(lat: number, lng: number): string {
  return `ST_Distance(
    "Listing"."location",
    ST_GeomFromText('${buildPointWKT(lat, lng)}', 4326)::geography
  )`;
}

/**
 * Devuelve un string SQL para calcular la distancia en metros desde un punto.
 * Útil para incluir `distanceKm` en el DTO.
 */
export function stDistanceSelect(lat: number, lng: number): string {
  return `ST_Distance(
    "Listing"."location",
    ST_GeomFromText('${buildPointWKT(lat, lng)}', 4326)::geography
  ) AS distance_meters`;
}

/**
 * Fija el seed de aleatoriedad de la sesión actual antes de ejecutar
 * una query con ORDER BY random(). Esto produce un orden estable
 * para el mismo seed entre ejecuciones.
 */
export function setSeedSql(seed: number): Prisma.Sql {
  return Prisma.sql`SELECT setseed(${seed / 2147483647})`;
}
