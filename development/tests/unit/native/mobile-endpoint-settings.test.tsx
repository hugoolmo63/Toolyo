// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileEndpointSettings } from "@/components/native/mobile-endpoint-settings";

const mocks = vi.hoisted(() => ({
  refreshEndpoint: vi.fn(),
  probeEndpoint: vi.fn(),
  setRuntimeOverride: vi.fn(),
  platform: "android" as "android" | "ios" | "web",
  runtimeOverride: null as string | null,
}));

vi.mock("@/lib/native/endpoint-config", () => ({
  getRuntimeOverride: () => mocks.runtimeOverride,
  normalizeEndpoint: (value: string) => value.trim().replace(/\/+$/, ""),
  probeEndpoint: mocks.probeEndpoint,
  setRuntimeOverride: (value: string | null) => {
    mocks.setRuntimeOverride(value);
    mocks.runtimeOverride = value;
  },
  validateEndpoint: (value: string) => (value.startsWith("https://") ? null : "URL inválida"),
}));

const renderSettings = () =>
  render(
    <MobileEndpointSettings
      platform={mocks.platform}
      endpoint={{ baseUrl: "https://default.toolyo.test", allowRuntimeOverride: true, allowCleartext: false }}
      effectiveEndpoint={mocks.runtimeOverride ?? "https://default.toolyo.test"}
      refreshEndpoint={mocks.refreshEndpoint}
    />,
  );

describe("MobileEndpointSettings", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.platform = "android";
    mocks.runtimeOverride = null;
    mocks.probeEndpoint.mockReset();
    mocks.probeEndpoint.mockResolvedValue(true);
    mocks.refreshEndpoint.mockReset();
    mocks.setRuntimeOverride.mockReset();
  });

  it("is visible only on an allowed native platform", () => {
    const { rerender } = renderSettings();
    expect(screen.getByLabelText("Dirección del servidor")).toBeTruthy();

    mocks.platform = "web";
    rerender(
      <MobileEndpointSettings
        platform={mocks.platform}
        endpoint={{ baseUrl: "https://default.toolyo.test", allowRuntimeOverride: true, allowCleartext: false }}
        effectiveEndpoint="https://default.toolyo.test"
        refreshEndpoint={mocks.refreshEndpoint}
      />,
    );
    expect(screen.queryByLabelText("Dirección del servidor")).toBeNull();
  });

  it("saves a reachable endpoint and refreshes the shell", async () => {
    renderSettings();
    fireEvent.change(screen.getByLabelText("Dirección del servidor"), {
      target: { value: "https://api.toolyo.test/" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar dirección" }));

    await waitFor(() => expect(mocks.probeEndpoint).toHaveBeenCalledWith("https://api.toolyo.test"));
    expect(mocks.setRuntimeOverride).toHaveBeenCalledWith("https://api.toolyo.test");
    expect(mocks.refreshEndpoint).toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain("guardada");
  });

  it("rejects an invalid endpoint before probing or persisting", async () => {
    renderSettings();
    fireEvent.change(screen.getByLabelText("Dirección del servidor"), {
      target: { value: "http://public.toolyo.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar dirección" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("URL inválida"));
    expect(mocks.probeEndpoint).not.toHaveBeenCalled();
    expect(mocks.setRuntimeOverride).not.toHaveBeenCalled();
  });

  it("keeps the previous endpoint when the server is unreachable", async () => {
    mocks.probeEndpoint.mockResolvedValue(false);
    renderSettings();
    fireEvent.change(screen.getByLabelText("Dirección del servidor"), {
      target: { value: "https://unreachable.toolyo.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar dirección" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("anterior"));
    expect(mocks.setRuntimeOverride).not.toHaveBeenCalled();
    expect(mocks.refreshEndpoint).not.toHaveBeenCalled();
  });

  it("resets a custom endpoint to the bundled default", () => {
    mocks.runtimeOverride = "https://custom.toolyo.test";
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));

    expect(mocks.setRuntimeOverride).toHaveBeenCalledWith(null);
    expect(mocks.refreshEndpoint).toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain("predeterminada");
  });
});
