// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListingHeader } from "@/features/listing-detail/presentation/listing-header";
import { OwnerCard } from "@/features/listing-detail/presentation/owner-card";
import type { ListingDetailDTO, OwnerDTO } from "@/types/listing-detail";

vi.mock("next/link", () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const listing = {
  title: "Equipo de escalada",
  category: { id: "cat-child", name: "Escalada", slug: "escalada", parentId: "cat-parent", parentName: "Deporte" },
  city: "Madrid",
  addressText: "Centro",
  location: { lat: 40.4, lng: -3.7 },
  isInstantBooking: false,
  owner: { isVerified: false },
  ratingAverage: 4.5,
  reviewCount: 2,
} as ListingDetailDTO;

const owner: OwnerDTO = {
  id: "owner-1",
  displayName: "Alex",
  avatarUrl: null,
  isVerified: false,
  ratingAverage: null,
  responseTimeHours: null,
  transactionCount: 1000,
};

describe("Listing detail presentation links", () => {
  afterEach(cleanup);

  it("links parent and child category and public location from the detail header", () => {
    render(<ListingHeader listing={listing} />);

    expect(screen.getByRole("link", { name: "Deporte" }).getAttribute("href")).toBe("/?cat=cat-parent");
    expect(screen.getByRole("link", { name: "Escalada" }).getAttribute("href")).toBe("/?cat=cat-child");
    expect(screen.getByRole("link", { name: "Buscar productos en Madrid" }).getAttribute("href"))
      .toBe("/?loc=Madrid&lat=40.4&lng=-3.7");
  });

  it("does not render a verification badge when the owner is verified", () => {
    render(<ListingHeader listing={{ ...listing, owner: { isVerified: true } } as ListingDetailDTO} />);

    expect(screen.queryByText(/Verificado/)).toBeNull();
    expect(document.querySelector(".listing-verified-badge")).toBeNull();
  });

  it("shows owner details without an Arrendador heading and keeps transaction info visible", () => {
    render(<OwnerCard owner={owner} />);

    expect(screen.queryByRole("heading", { name: "Arrendador" })).toBeNull();
    expect(screen.getByText("Alex")).toBeTruthy();
    expect(screen.getByText("Transacciones")).toBeTruthy();
    expect(document.querySelector(".owner-stats")?.getAttribute("class")).toContain("owner-stats");
    expect(screen.getByText("1000")).toBeTruthy();
  });

  it("does not render a verification marker in the owner card", () => {
    render(<OwnerCard owner={{ ...owner, isVerified: true }} />);

    expect(document.querySelector(".owner-verified-badge")).toBeNull();
    expect(screen.queryByText("✓")).toBeNull();
  });
});