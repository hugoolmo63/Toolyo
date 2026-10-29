// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Gallery } from "@/features/listing-detail/presentation/gallery";

describe("Gallery navigation", () => {
  afterEach(cleanup);

  it("hides the previous/next arrow at the first and last photo", () => {
    render(<Gallery title="Taladro" photos={[
      { id: "photo-1", url: "/one.jpg", altText: null, order: 0 },
      { id: "photo-2", url: "/two.jpg", altText: null, order: 1 },
    ]} />);

    expect(screen.queryByRole("button", { name: "Imagen anterior" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(screen.getByRole("button", { name: "Imagen anterior" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Imagen siguiente" })).toBeNull();
  });
});