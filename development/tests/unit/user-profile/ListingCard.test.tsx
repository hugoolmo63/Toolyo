import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingCard } from "@/components/profile/ListingCard";

describe("ListingCard", () => {
  it("links to the public listing detail and exposes only public fields", () => {
    render(<ListingCard listing={{ id: "listing-1", slug: "camera", title: "Cámara", coverImageUrl: null, pricePerDay: 25, city: "Madrid", ratingAverage: 4.5, reviewCount: 2 }} />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/listings/camera");
    expect(screen.getByText("25 €")).toBeTruthy();
  });
});