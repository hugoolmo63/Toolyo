import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { create, publish, update } from "@/features/listing-management/application/listing-management.service";
import type { ListingEmbeddingPort } from "@/features/listing-management/application/listing-embedding.port";

const OWNER_ID = "owner-1";
const LISTING_ID = "cklisting0000000000000001";
const CATEGORY_ID = "ckcategory00000000000000a";

const publishedListing = {
  id: LISTING_ID,
  ownerId: OWNER_ID,
  title: "Bicicleta de montaña",
  description: "Talla M, bien cuidada",
  status: "published",
  categoryId: CATEGORY_ID,
  pricePerDay: new Prisma.Decimal("15"),
  photos: [{ id: "p1", url: "https://example.com/p.jpg", altText: null, order: 0 }],
  availability: [],
  category: { id: CATEGORY_ID, name: "Deporte", slug: "deporte" },
};

function fakeDb(listing: typeof publishedListing | null, createdStatus = "published") {
  const tx = {
    listing: {
      create: vi.fn(async () => ({ id: LISTING_ID, slug: "slug", status: createdStatus })),
      update: vi.fn(async () => ({ id: LISTING_ID, updatedAt: new Date(), status: listing?.status ?? "draft" })),
    },
    listingPhoto: {
      updateMany: vi.fn(async () => ({ count: 0 })),
      createMany: vi.fn(async () => ({ count: 0 })),
    },
  };
  return {
    listing: {
      findFirst: vi.fn(async () => listing),
      update: tx.listing.update,
    },
    category: { findFirst: vi.fn(async () => ({ id: CATEGORY_ID })) },
    $transaction: vi.fn(async (fn: (txClient: unknown) => unknown) => fn(tx)),
  } as unknown as PrismaClient;
}

function fakeEmbeddings() {
  return { syncForListing: vi.fn(async () => {}) } satisfies ListingEmbeddingPort;
}

const baseInput = {
  title: "Bicicleta de montaña",
  description: "Talla M, bien cuidada",
  categoryId: CATEGORY_ID,
  pricePerDay: "15",
  photos: [{ url: "https://example.com/p.jpg", order: 0 }],
};

describe("listing embedding sync", () => {
  it("indexes the listing when created already published", async () => {
    const embeddings = fakeEmbeddings();
    await create(fakeDb(null), OWNER_ID, { ...baseInput, publish: true }, embeddings);
    expect(embeddings.syncForListing).toHaveBeenCalledWith(expect.anything(), {
      id: LISTING_ID,
      title: baseInput.title,
      description: baseInput.description,
    });
  });

  it("does not index drafts on create", async () => {
    const embeddings = fakeEmbeddings();
    await create(fakeDb(null, "draft"), OWNER_ID, { ...baseInput, publish: false }, embeddings);
    expect(embeddings.syncForListing).not.toHaveBeenCalled();
  });

  it("re-indexes a published listing when title or description change", async () => {
    const embeddings = fakeEmbeddings();
    await update(
      fakeDb(publishedListing),
      OWNER_ID,
      { listingId: LISTING_ID, title: "Bicicleta gravel" },
      embeddings,
    );
    expect(embeddings.syncForListing).toHaveBeenCalledWith(expect.anything(), {
      id: LISTING_ID,
      title: "Bicicleta gravel",
      description: publishedListing.description,
    });
  });

  it("skips re-indexing when only non-text fields change", async () => {
    const embeddings = fakeEmbeddings();
    await update(
      fakeDb(publishedListing),
      OWNER_ID,
      { listingId: LISTING_ID, pricePerDay: "20" },
      embeddings,
    );
    expect(embeddings.syncForListing).not.toHaveBeenCalled();
  });

  it("does not re-index listings that are not published", async () => {
    const embeddings = fakeEmbeddings();
    await update(
      fakeDb({ ...publishedListing, status: "draft" }),
      OWNER_ID,
      { listingId: LISTING_ID, title: "Otro título" },
      embeddings,
    );
    expect(embeddings.syncForListing).not.toHaveBeenCalled();
  });

  it("indexes the listing on publish", async () => {
    const embeddings = fakeEmbeddings();
    await publish(fakeDb({ ...publishedListing, status: "draft" }), OWNER_ID, LISTING_ID, embeddings);
    expect(embeddings.syncForListing).toHaveBeenCalledWith(expect.anything(), {
      id: LISTING_ID,
      title: publishedListing.title,
      description: publishedListing.description,
    });
  });
});
