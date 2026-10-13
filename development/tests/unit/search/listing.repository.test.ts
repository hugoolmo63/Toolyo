import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { findPublishedListingsFiltered } from "@/features/search/infrastructure/listing.repository";
import type { SearchQueryInput } from "@/features/search/shared/search.schema";

// Evita cargar @huggingface/transformers en tests unitarios.
vi.mock("@/lib/embeddings/embedding.service", () => ({
  EMBEDDING_DIMENSIONS: 384,
}));

function createPrismaStub() {
  const queryRaw = vi.fn().mockResolvedValue([]);
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaClient;
  return { prisma, queryRaw };
}

/**
 * Reconstruye el SQL de una llamada a $queryRaw: la tagged template recibe
 * (strings, ...values) y los fragmentos Prisma.raw/Sql llegan como values.
 */
function sqlText(queryRaw: ReturnType<typeof vi.fn>, callIndex = 0): string {
  const [strings, ...values] = queryRaw.mock.calls[callIndex] as [
    readonly string[],
    ...unknown[],
  ];
  return strings.reduce((acc, part, i) => {
    const value = values[i];
    const rendered =
      value !== null && typeof value === "object" && "strings" in value
        ? (value as { strings: readonly string[] }).strings.join(" ")
        : (value ?? "");
    return acc + part + rendered;
  }, "");
}

const baseInput: SearchQueryInput = { sortBy: "relevance", limit: 24 };

describe("findPublishedListingsFiltered — filtro de ubicación", () => {
  it("sin ubicación no aplica filtro geográfico", async () => {
    const { prisma, queryRaw } = createPrismaStub();
    await findPublishedListingsFiltered(prisma, baseInput);

    expect(sqlText(queryRaw)).not.toContain("ST_DWithin");
  });

  it("con ubicación acota el catálogo a la zona (radio por defecto o ciudad)", async () => {
    const { prisma, queryRaw } = createPrismaStub();
    await findPublishedListingsFiltered(prisma, {
      ...baseInput,
      location: { lat: 40.4168, lng: -3.7038, text: "Madrid, España" },
    });

    const rowsSql = sqlText(queryRaw, 0);
    const countSql = sqlText(queryRaw, 1);
    for (const sql of [rowsSql, countSql]) {
      expect(sql).toContain("ST_DWithin");
      // Radio por defecto de 50 km en metros.
      expect(sql).toContain("50000");
      expect(sql).toContain(`"Listing"."city" ILIKE '%Madrid%'`);
    }
  });

  it("con distancia máxima explícita aplica solo ese radio", async () => {
    const { prisma, queryRaw } = createPrismaStub();
    await findPublishedListingsFiltered(prisma, {
      ...baseInput,
      location: { lat: 40.4168, lng: -3.7038, text: "Madrid, España" },
      maxDistanceKm: 5,
    });

    const sql = sqlText(queryRaw);
    expect(sql).toContain("ST_DWithin");
    expect(sql).toContain("5000");
    expect(sql).not.toContain("50000");
    expect(sql).not.toContain("ILIKE");
  });

  it("con ubicación sin texto no filtra por ciudad", async () => {
    const { prisma, queryRaw } = createPrismaStub();
    await findPublishedListingsFiltered(prisma, {
      ...baseInput,
      location: { lat: 40.4168, lng: -3.7038, text: "" },
    });

    const sql = sqlText(queryRaw);
    expect(sql).toContain("ST_DWithin");
    expect(sql).not.toContain("ILIKE");
  });
});
