import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { findListingBySlug } from "@/features/listing-detail/infrastructure/listing-detail.repository";

describe("listing detail id resolution", () => {
  it("resolves the id from the map URL before attempting slug lookup", async () => {
    const listing = { id: "cm123realListingId" };
    const detailRow = { id: listing.id, title: "Micrófono inalámbrico dual" };
    const findUnique = vi.fn().mockResolvedValue(listing);
    const queryRaw = vi.fn().mockResolvedValue([detailRow]);
    const prisma = {
      listing: { findUnique },
      $queryRaw: queryRaw,
    } as unknown as PrismaClient;

    // Igual que el identificador que el popup del mapa coloca después de /listings/.
    const routeSegment = "cm123realListingId";
    const resolvedListing = await findListingBySlug(prisma, routeSegment);

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "cm123realListingId" },
      select: { id: true },
    });
    expect(queryRaw).toHaveBeenCalledOnce();
    expect(queryRaw.mock.calls[0]).toContain("cm123realListingId");
    expect(resolvedListing).toEqual(detailRow);
  });

  it("tries the decoded slug when the original slug does not match", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const queryRaw = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "listing-with-accent", title: "Cámara" }]);
    const prisma = {
      listing: { findUnique },
      $queryRaw: queryRaw,
    } as unknown as PrismaClient;

    const result = await findListingBySlug(prisma, "cam%C3%A1ra");

    expect(queryRaw).toHaveBeenCalledTimes(2);
    expect(queryRaw.mock.calls[1]).toContain("camára");
    expect(result?.id).toBe("listing-with-accent");
  });
});