// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultsList } from "@/features/search/presentation/results-list";
import type { SearchResultDTO } from "@/types/search";

vi.mock("next/link", () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

const result: SearchResultDTO = {
  id: "listing-1",
  slug: "equipo-escalada",
  title: "Equipo de escalada",
  pricePerDay: 20,
  primaryPhotoUrl: null,
  ratingAverage: 4.5,
  reviewCount: 3,
  distanceKm: null,
  city: "Madrid",
  location: { lat: 40.4, lng: -3.7 },
  owner: { id: "owner-1", displayName: "Alex", avatarUrl: null, isVerified: false },
};

describe("Result links", () => {
  afterEach(cleanup);

  it("opens desktop product cards in a new tab", () => {
    render(<ResultsList results={[result]} isLoading={false} hasFilters view="grid" isMobile={false} />);

    const link = screen.getByRole("link", { name: "Ver detalle de Equipo de escalada" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps product cards in the current tab on mobile", () => {
    render(<ResultsList results={[result]} isLoading={false} hasFilters view="grid" isMobile />);

    const link = screen.getByRole("link", { name: "Ver detalle de Equipo de escalada" });
    expect(link.hasAttribute("target")).toBe(false);
  });
});