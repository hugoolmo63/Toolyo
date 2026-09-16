import { Prisma, PrismaClient } from "@prisma/client";
import { embedTexts, EMBEDDING_MODEL } from "../src/lib/embeddings/embedding.service";
import { upsertListingEmbedding } from "../src/features/search/infrastructure/vector-search.poc";

const prisma = new PrismaClient();

type Options = {
  batchSize: number;
  limit?: number;
  dryRun: boolean;
  reindex: boolean;
};

function parseOptions(argv: string[]): Options {
  const valueAfter = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const batchSize = Number(valueAfter("--batch-size") ?? 25);
  const limitValue = valueAfter("--limit");
  const limit = limitValue === undefined ? undefined : Number(limitValue);
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
    throw new Error("--batch-size must be an integer between 1 and 100");
  }
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error("--limit must be a positive integer");
  }
  return {
    batchSize,
    limit,
    dryRun: argv.includes("--dry-run"),
    reindex: argv.includes("--reindex"),
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  let processed = 0;
  let offset = 0;

  console.log(`Embedding backfill (${EMBEDDING_MODEL})`, options);
  while (options.limit === undefined || processed < options.limit) {
    const take = Math.min(options.batchSize, (options.limit ?? Infinity) - processed);
    const listings = await prisma.$queryRaw<
      Array<{ id: string; title: string; description: string | null }>
    >`
      SELECT l."id", l."title", l."description"
      FROM "Listing" l
      LEFT JOIN "ListingEmbedding" e ON e."listingId" = l."id"
      WHERE l."status" = 'published'
        AND l."deletedAt" IS NULL
        AND ${options.reindex ? Prisma.raw("TRUE") : Prisma.raw('e."listingId" IS NULL')}
      ORDER BY l."id"
      LIMIT ${take} OFFSET ${offset}
    `;
    if (listings.length === 0) break;

    const texts = listings.map(({ title, description }) =>
      [title, description].filter(Boolean).join("\n\n"),
    );
    const embeddings = options.dryRun ? [] : await embedTexts(texts);
    if (!options.dryRun) {
      for (let index = 0; index < listings.length; index++) {
        await upsertListingEmbedding(prisma, {
          listingId: listings[index]!.id,
          model: EMBEDDING_MODEL,
          embedding: embeddings[index]!,
        });
      }
    }
    processed += listings.length;
    // Existing rows remain selected during reindex; dry-run and reindex need an offset.
    if (options.dryRun || options.reindex) offset += listings.length;
    console.log(`${options.dryRun ? "Would process" : "Processed"} ${processed} listing(s)`);
  }
  console.log(
    `${options.dryRun ? "Dry run complete" : "Backfill complete"}: ${processed} listing(s)`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
