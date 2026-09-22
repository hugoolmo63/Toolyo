import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProfileHeader } from "@/components/profile/UserProfileHeader";

describe("UserProfileHeader", () => {
  it("renders public reputation data and contact entry point", () => {
    render(<UserProfileHeader profile={{ id: "user-1", displayName: "Ana", avatarUrl: null, bio: null, preferredLocation: "Madrid, España", createdAt: "2025-01-10T00:00:00Z", ratingAverage: 4.8, transactionCount: 12, badges: { registered: true, verified: false, superLessor: false }, listings: [], reviews: [] }} />);
    expect(screen.getByRole("heading", { name: "Ana" })).toBeTruthy();
    expect(screen.getByText(/12 transacciones/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Contactar" }).getAttribute("href")).toBe("/messages?user=user-1");
  });
});