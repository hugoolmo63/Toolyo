// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProfileBadges } from "@/components/profile/UserProfileBadges";

describe("UserProfileBadges", () => {
  it("does not show registration or verification badges", () => {
    render(<UserProfileBadges badges={{ registered: true, verified: true, superLessor: false }} />);
    expect(screen.queryByText(/Registrado/)).toBeNull();
    expect(screen.queryByText(/Verificado/)).toBeNull();
    expect(screen.queryByText(/Superarrendador/)).toBeNull();
  });
});