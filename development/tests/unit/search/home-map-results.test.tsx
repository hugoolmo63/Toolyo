// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SearchResultsPage } from "@/types/search";

const { searchInitial, searchMapResults } = vi.hoisted(() => ({
  searchInitial: vi.fn(),
  searchMapResults: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/features/search/application/search.service", () => ({ searchInitial, searchMapResults, searchQuery: vi.fn() }));
vi.mock("@/features/search/presentation/search-page", () => ({
  SearchPage: ({ initialMapResults }: { initialMapResults: SearchResultsPage | null }) => (
    <div data-testid="initial-map-result-count">{initialMapResults?.items.length ?? 0}</div>
  ),
}));

import Home from "@/app/page";

const results = (count: number): SearchResultsPage => ({
  items: Array.from({ length: count }, (_, index) => ({
    id: `listing-${index}`,
    slug: `listing-slug-${index}`,
    title: `Producto ${index}`,
    pricePerDay: 10,
    primaryPhotoUrl: null,
    photoUrls: [],
    ratingAverage: 0,
    reviewCount: 0,
    distanceKm: null,
    city: "Madrid",
    location: { lat: 40 + index / 1000, lng: -3 - index / 1000 },
    owner: { id: `owner-${index}`, displayName: "Arrendador", avatarUrl: null, isVerified: false },
  })),
  total: count,
  hasMore: false,
  nextCursor: null,
  page: 1,
  totalPages: 1,
  seed: 123,
});

describe("Home map initial results", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("passes all 90 coordinate-bearing products to the map without search criteria", async () => {
    searchInitial.mockResolvedValue(results(24));
    searchMapResults.mockResolvedValue(results(90));

    const page = await Home({ searchParams: {} });
    render(page);

    expect(searchMapResults).toHaveBeenCalledWith({}, {
      seed: 123,
      page: 1,
      limit: 1000,
      sortBy: "relevance",
    });
    expect(screen.getByTestId("initial-map-result-count").textContent).toBe("90");
  });
});