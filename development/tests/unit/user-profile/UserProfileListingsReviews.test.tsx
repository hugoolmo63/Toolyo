import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProfileListings } from "@/components/profile/UserProfileListings";
import { UserProfileReviews } from "@/components/profile/UserProfileReviews";

describe("profile listings and reviews", () => {
  it("shows useful empty states", () => {
    render(<><UserProfileListings listings={[]} /><UserProfileReviews reviews={[]} /></>);
    expect(screen.getByText(/todavía no tiene listings/)).toBeTruthy();
    expect(screen.getByText(/Aún no hay reseñas/)).toBeTruthy();
  });

  it("uses the listing slug for the product review link", () => {
    render(<UserProfileReviews reviews={[{ id: "review-1", author: { id: "author-1", displayName: "Ana", avatarUrl: null }, listing: { id: "listing-1", title: "Cámara", slug: "camara-pro" }, rating: 5, comment: "Muy bien", createdAt: "2026-01-01T00:00:00Z" }]} />);
    expect(screen.getByRole("link", { name: "Cámara" }).getAttribute("href")).toBe("/listings/camara-pro");
  });
});