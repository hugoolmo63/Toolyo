// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBar } from "@/features/search/presentation/search-bar";

const mocks = vi.hoisted(() => ({
  pathname: "/",
  push: vi.fn(),
  updateParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/hooks/use-search-params", () => ({
  useUpdateSearchParams: () => mocks.updateParams,
}));

describe("SearchBar", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.pathname = "/";
    mocks.push.mockReset();
    mocks.updateParams.mockReset();
    vi.useRealTimers();
  });

  const loadSuggestions = async (groups: {
    locations?: Array<{ text: string; lat: number; lng: number; type: string }>;
    categories?: Array<{ id: string; name: string }>;
    products?: Array<{ id: string; title: string; category: string }>;
  }) => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        locations: groups.locations ?? [],
        categories: groups.categories ?? [],
        products: groups.products ?? [],
      }),
    }));
    render(<SearchBar />);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar productos para alquilar" }), {
      target: { value: "eq" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
  };

  it("submits the search when Enter is pressed", () => {
    render(<SearchBar />);
    const input = screen.getByRole("textbox", { name: "Buscar productos para alquilar" });

    fireEvent.change(input, { target: { value: "taladro" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mocks.updateParams).toHaveBeenCalledWith({ query: "taladro", page: null });
    expect(screen.queryByRole("button", { name: "Buscar" })).toBeNull();
  });

  it("shows a clear button only for non-empty input and clears immediately", () => {
    render(<SearchBar />);
    const input = screen.getByRole("textbox", { name: "Buscar productos para alquilar" }) as HTMLInputElement;

    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();

    fireEvent.change(input, { target: { value: "taladro" } });
    const clearButton = screen.getByRole("button", { name: "Limpiar búsqueda" });
    expect(clearButton.closest("form")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Buscar" })).toBeNull();
    fireEvent.click(clearButton);

    expect(input.value).toBe("");
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
  });

  it("groups location, category, and product suggestions with their types", async () => {
    await loadSuggestions({
      locations: [{ text: "Madrid", lat: 40.4168, lng: -3.7038, type: "city" }],
      categories: [{ id: "category-1", name: "Ocio y Deporte" }],
      products: [{ id: "product-1", title: "Equipo de escalada", category: "Deporte" }],
    });

    expect(screen.getByRole("group", { name: "Ubicaciones" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Categorías" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Productos" })).toBeTruthy();
    expect(screen.getByText("Ubicación")).toBeTruthy();
    expect(screen.getByText("Categoría")).toBeTruthy();
    expect(screen.getByText("Producto")).toBeTruthy();
  });

  it("applies the matching URL filter when a location suggestion is selected", async () => {
    await loadSuggestions({
      locations: [{ text: "Madrid", lat: 40.4168, lng: -3.7038, type: "city" }],
    });

    fireEvent.click(within(screen.getByRole("group", { name: "Ubicaciones" })).getByRole("option"));

    expect(mocks.updateParams).toHaveBeenCalledWith({
      query: null,
      locationText: "Madrid",
      lat: 40.4168,
      lng: -3.7038,
      radius: 50,
      categoryId: null,
      page: null,
    });
  });

  it("applies the category filter when its suggestion is selected", async () => {
    await loadSuggestions({ categories: [{ id: "category-1", name: "Ocio y Deporte" }] });

    fireEvent.click(within(screen.getByRole("group", { name: "Categorías" })).getByRole("option"));

    expect(mocks.updateParams).toHaveBeenCalledWith({
      query: null,
      locationText: null,
      lat: null,
      lng: null,
      radius: null,
      categoryId: "category-1",
      page: null,
    });
  });

  it("applies the product query when its suggestion is selected", async () => {
    await loadSuggestions({ products: [{ id: "product-1", title: "Equipo de escalada", category: "Deporte" }] });

    fireEvent.click(within(screen.getByRole("group", { name: "Productos" })).getByRole("option"));

    expect(mocks.updateParams).toHaveBeenCalledWith({
      query: "Equipo de escalada",
      locationText: null,
      lat: null,
      lng: null,
      radius: null,
      categoryId: null,
      page: null,
    });
  });

  it("applies a matching category suggestion when Enter is pressed", async () => {
    await loadSuggestions({ categories: [{ id: "category-1", name: "Equipo" }] });

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Buscar productos para alquilar" }), { key: "Enter" });

    expect(mocks.updateParams).toHaveBeenCalledWith(expect.objectContaining({ categoryId: "category-1" }));
  });
});