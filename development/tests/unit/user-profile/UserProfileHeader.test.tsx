// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProfileHeader } from "@/components/profile/UserProfileHeader";

describe("UserProfileHeader", () => {
  it("shows the product rating without registration, verification or reputation details", () => {
    render(<UserProfileHeader profile={{ id: "user-1", displayName: "Ana", avatarUrl: null, bio: null, preferredLocation: "Madrid, España", createdAt: "2025-01-10T00:00:00Z", ratingAverage: 4.8, transactionCount: 12, badges: { registered: true, verified: false, superLessor: false }, listings: [], reviews: [] }} />);
    expect(screen.getByRole("heading", { name: "Ana" })).toBeTruthy();
    expect(screen.getByText("★ 4.8")).toBeTruthy();
    expect(screen.queryByText(/Registrado|Verificado|transacciones/)).toBeNull();
  });
});