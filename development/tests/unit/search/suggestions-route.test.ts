import { beforeEach, describe, expect, it, vi } from "vitest";

const { categoryFindMany, listingFindMany, searchLocationsNominatim } = vi.hoisted(() => ({
  categoryFindMany: vi.fn(),
  listingFindMany: vi.fn(),
  searchLocationsNominatim: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/server/db/client", () => ({
  prisma: {
    category: { findMany: categoryFindMany },
    listing: { findMany: listingFindMany },
  },
}));

vi.mock("@/features/search/infrastructure/geocoding.repository", () => ({
  searchLocationsNominatim,
}));

import { GET } from "@/app/api/search/suggestions/route";

describe("GET /api/search/suggestions", () => {
  beforeEach(() => {
    categoryFindMany.mockReset().mockResolvedValue([
      { id: "category-1", name: "Escalada" },
      { id: "category-2", name: "Cámaras" },
    ]);
    listingFindMany.mockReset().mockResolvedValue([
      {
        id: "product-1",
        title: "Equipo de escalada completo",
        description: "Material para montaña",
        category: { name: "Deporte" },
      },
      {
        id: "product-2",
        title: "Cámara profesional",
        description: "Cámara para fotografía",
        category: { name: "Cámaras" },
      },
    ]);
    searchLocationsNominatim.mockReset().mockResolvedValue([]);
  });

  it("matches query tokens anywhere in titles and category names", async () => {
    const response = await GET(new Request("http://localhost/api/search/suggestions?q=escalada"));
    const result = await response.json();

    expect(result.products).toEqual([
      { id: "product-1", title: "Equipo de escalada completo", category: "Deporte" },
    ]);
    expect(result.categories).toEqual([{ id: "category-1", name: "Escalada" }]);
  });

  it("normalizes accents and matches tokens in descriptions and categories", async () => {
    const response = await GET(new Request("http://localhost/api/search/suggestions?q=camara"));
    const result = await response.json();

    expect(result.categories).toEqual([{ id: "category-2", name: "Cámaras" }]);
    expect(result.products).toEqual([
      { id: "product-2", title: "Cámara profesional", category: "Cámaras" },
    ]);
  });

  it("matches product query tokens found only in its description", async () => {
    listingFindMany.mockResolvedValue([
      {
        id: "product-description",
        title: "Cuerda roja",
        description: "Equipo de escalada",
        category: { name: "Deporte" },
      },
    ]);

    const response = await GET(new Request("http://localhost/api/search/suggestions?q=escalada"));
    const result = await response.json();

    expect(result.products).toEqual([
      { id: "product-description", title: "Cuerda roja", category: "Deporte" },
    ]);
  });

  it("requires every query token to match a product field", async () => {
    const response = await GET(new Request("http://localhost/api/search/suggestions?q=escalada+cámara"));
    const result = await response.json();

    expect(result.products).toEqual([]);
  });
});