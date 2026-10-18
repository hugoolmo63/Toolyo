// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    vi.unstubAllGlobals();
  });

  it("submits the search when Enter is pressed", () => {
    render(<SearchBar />);
    const input = screen.getByRole("textbox", { name: "Buscar productos para alquilar" });

    fireEvent.change(input, { target: { value: "taladro" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mocks.updateParams).toHaveBeenCalledWith({ query: "taladro", page: null });
    expect(screen.queryByRole("button", { name: "Buscar" })).toBeNull();
  });

  it("does not search while typing (no type-as-you-search)", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<SearchBar />);
    const input = screen.getByRole("textbox", { name: "Buscar productos para alquilar" });

    fireEvent.change(input, { target: { value: "equipo de escalada" } });
    await vi.advanceTimersByTimeAsync(1000);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mocks.updateParams).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
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
});
