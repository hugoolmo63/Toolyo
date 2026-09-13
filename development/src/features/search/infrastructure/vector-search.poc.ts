import { Prisma, type PrismaClient } from "@prisma/client";

/**
 * PoC de búsqueda semántica con pgvector.
 *
 * Prisma no modela todavía el tipo `vector` en schema.prisma, por eso esta
 * primera versión usa SQL raw sobre la tabla ListingEmbedding creada por la
 * migración PoC.
 */
export type ListingEmbeddingInput = {
  listingId: string;
  model: string;
  embedding: number[];
};

const EMBEDDING_DIMENSIONS = 1536;

/** Guarda o reemplaza el embedding de un listing en formato pgvector. */
export async function upsertListingEmbedding(
  prisma: PrismaClient,
  input: ListingEmbeddingInput,
): Promise<void> {
  if (input.embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS} embedding dimensions`);
  }

  const vectorLiteral = `[${input.embedding.join(",")}]`;
  await prisma.$executeRaw`
    INSERT INTO "ListingEmbedding" (
      "id", "listingId", "model", "dimensions", "embedding", "createdAt", "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${input.listingId},
      ${input.model},
      ${input.embedding.length},
      ${vectorLiteral}::vector,
      NOW(),
      NOW()
    )
    ON CONFLICT ("listingId") DO UPDATE SET
      "model" = EXCLUDED."model",
      "dimensions" = EXCLUDED."dimensions",
      "embedding" = EXCLUDED."embedding",
      "updatedAt" = NOW()
  `;
}

/**
 * Recupera listings semánticamente cercanos usando distancia coseno.
 * En pgvector, `<=>` devuelve distancia: cuanto menor, más similares.
 */
export async function findSimilarListingsByEmbedding(
  prisma: PrismaClient,
  input: { embedding: number[]; limit?: number; excludeListingId?: string },
) {
  if (input.embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS} embedding dimensions`);
  }

  const limit = input.limit ?? 6;
  const vectorLiteral = `[${input.embedding.join(",")}]`;
  const excludeClause = input.excludeListingId
    ? Prisma.sql`AND l."id" <> ${input.excludeListingId}`
    : Prisma.empty;

  return prisma.$queryRaw<
    Array<{ id: string; slug: string; title: string; distance: number }>
  >`
    SELECT
      l."id",
      l."slug",
      l."title",
      e."embedding" <=> ${vectorLiteral}::vector AS distance
    FROM "ListingEmbedding" AS e
    INNER JOIN "Listing" AS l ON l."id" = e."listingId"
    WHERE l."status" = 'published'
      AND l."deletedAt" IS NULL
      ${excludeClause}
    ORDER BY e."embedding" <=> ${vectorLiteral}::vector ASC
    LIMIT ${limit}
  `;
}
