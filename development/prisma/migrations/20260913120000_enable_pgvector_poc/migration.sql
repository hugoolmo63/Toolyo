-- PoC: pgvector para búsqueda semántica de listings.
-- La imagen actual postgis/postgis:15-3.4-alpine no incluye vector por defecto.
-- Aplicar esta migración tras usar una imagen PostgreSQL que incluya pgvector
-- junto con PostGIS, o tras instalar la extensión en la imagen de desarrollo.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "ListingEmbedding" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingEmbedding_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ListingEmbedding_listingId_key" UNIQUE ("listingId"),
    CONSTRAINT "ListingEmbedding_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
);

-- Índice ANN opcional para la PoC. Activarlo cuando haya suficientes embeddings.
-- CREATE INDEX IF NOT EXISTS "ListingEmbedding_embedding_hnsw_idx"
--   ON "ListingEmbedding" USING hnsw ("embedding" vector_cosine_ops);
