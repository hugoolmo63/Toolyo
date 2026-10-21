// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  photoUrls: [],
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

  it("navigates product photos from the grid and wraps around", () => {
    render(<ResultsList results={[{ ...result, photoUrls: ["/photo-1.jpg", "/photo-2.jpg"] }]} isLoading={false} hasFilters view="grid" />);
    const image = screen.getByRole("img", { name: "Equipo de escalada" });

    expect(image.getAttribute("src")).toBe("/photo-1.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Foto siguiente de Equipo de escalada" }));
    expect(screen.getByRole("img", { name: "Equipo de escalada" }).getAttribute("src")).toBe("/photo-2.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Foto siguiente de Equipo de escalada" }));
    expect(screen.getByRole("img", { name: "Equipo de escalada" }).getAttribute("src")).toBe("/photo-1.jpg");
  });

  it("does not show photo navigation for a single photo", () => {
    render(<ResultsList results={[{ ...result, primaryPhotoUrl: "/photo-1.jpg", photoUrls: ["/photo-1.jpg"] }]} isLoading={false} hasFilters view="grid" />);

    expect(screen.queryByRole("button", { name: /Foto (anterior|siguiente)/ })).toBeNull();
  });
});