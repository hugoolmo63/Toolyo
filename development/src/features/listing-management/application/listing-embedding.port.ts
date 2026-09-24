import type { PrismaClient } from "@prisma/client";
import { embedText, EMBEDDING_MODEL } from "@/lib/embeddings/embedding.service";
import { upsertListingEmbedding } from "@/features/search/infrastructure/vector-search.poc";
import { logger } from "@/server/lib/logger";

export type ListingEmbeddingSource = {
  id: string;
  title: string;
  description: string | null;
};

export interface ListingEmbeddingPort {
  syncForListing(db: PrismaClient, listing: ListingEmbeddingSource): Promise<void>;
}

/**
 * Indexa el listing para la búsqueda semántica con el mismo texto que
 * backfill-embeddings (título + descripción). El listing ya está persistido,
 * así que un fallo del modelo solo se registra y nunca rompe la mutación.
 */
export const transformersListingEmbedding: ListingEmbeddingPort = {
  async syncForListing(db, listing) {
    const text = [listing.title, listing.description].filter(Boolean).join("\n\n");
    if (!text) return;
    try {
      const embedding = await embedText(text);
      await upsertListingEmbedding(db, {
        listingId: listing.id,
        model: EMBEDDING_MODEL,
        embedding,
      });
    } catch (error) {
      logger.warn("listingEmbedding.syncForListing failed", { listingId: listing.id, error });
    }
  },
};

export const noListingEmbedding: ListingEmbeddingPort = {
  async syncForListing() {},
};
