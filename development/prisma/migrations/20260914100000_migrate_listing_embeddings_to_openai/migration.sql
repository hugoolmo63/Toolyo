-- Cambia ListingEmbedding a Transformers.js vector(384).
-- Los vectores anteriores no son compatibles y se eliminan; ejecutar después
-- `npm run embeddings:backfill -- --reindex` para regenerarlos.
DO $$
BEGIN
  IF to_regclass('"ListingEmbedding"') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    DROP INDEX IF EXISTS "ListingEmbedding_embedding_hnsw_idx";
    ALTER TABLE "ListingEmbedding" DROP COLUMN IF EXISTS "embedding";
    ALTER TABLE "ListingEmbedding" ADD COLUMN "embedding" vector(384);
    UPDATE "ListingEmbedding"
      SET "dimensions" = 384,
          "model" = 'Xenova/all-MiniLM-L6-v2'
      WHERE FALSE;
    CREATE INDEX IF NOT EXISTS "ListingEmbedding_embedding_hnsw_idx"
      ON "ListingEmbedding" USING hnsw ("embedding" vector_cosine_ops);
  END IF;
END $$;