import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProfileBadges } from "@/components/profile/UserProfileBadges";

describe("UserProfileBadges", () => {
  it("renders only badges granted by the server", () => {
    render(<UserProfileBadges badges={{ registered: true, verified: true, superLessor: false }} />);
    expect(screen.getByText("Registrado")).toBeTruthy();
    expect(screen.getByText("Verificado")).toBeTruthy();
    expect(screen.queryByText("Superarrendador")).toBeNull();
  });
});