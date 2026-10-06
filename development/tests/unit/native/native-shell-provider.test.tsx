// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NativeShellProvider, useNativeShell } from "@/components/native/native-shell-provider";

const mocks = vi.hoisted(() => ({
  effectiveEndpoint: "https://default.toolyo.test",
  config: {
    baseUrl: "https://default.toolyo.test",
    allowRuntimeOverride: true,
    allowCleartext: false,
  },
}));

vi.mock("@capacitor/status-bar", () => ({
  StatusBar: { setStyle: vi.fn().mockResolvedValue(undefined) },
  Style: { Dark: "DARK" },
}));
vi.mock("@capacitor/app", () => ({ App: { addListener: vi.fn() } }));
vi.mock("@capacitor/network", () => ({ Network: { addListener: vi.fn() } }));
vi.mock("@/lib/native/platform", () => ({
  getAppPlatform: () => "android",
  isBlockedOnMobile: () => false,
}));
vi.mock("@/lib/native/back-button", () => ({ registerBackButtonHandler: () => vi.fn() }));
vi.mock("@/lib/native/endpoint-config", () => ({
  getEndpointConfig: () => mocks.config,
  getEffectiveEndpoint: () => mocks.effectiveEndpoint,
  getRuntimeOverride: () => null,
}));
vi.mock("@/components/native/deep-link-handler", () => ({ DeepLinkHandler: () => null }));
vi.mock("@/components/native/push-registration", () => ({ PushRegistration: () => null }));
vi.mock("@/components/native/network-status-banner", () => ({ NetworkStatusBanner: () => null }));
vi.mock("@/components/native/mobile-endpoint-settings", () => ({ MobileEndpointSettings: () => null }));

function EndpointConsumer() {
  const { effectiveEndpoint, refreshEndpoint } = useNativeShell();
  return (
    <>
      <output data-testid="endpoint">{effectiveEndpoint}</output>
      <button type="button" onClick={refreshEndpoint}>
        Refresh endpoint
      </button>
    </>
  );
}

describe("NativeShellProvider", () => {
  afterEach(() => cleanup());

  it("refreshes the effective endpoint without restarting the shell", async () => {
    mocks.effectiveEndpoint = "https://default.toolyo.test";
    render(
      <NativeShellProvider>
        <EndpointConsumer />
      </NativeShellProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("endpoint").textContent).toBe("https://default.toolyo.test"));
    mocks.effectiveEndpoint = "https://custom.toolyo.test";
    fireEvent.click(screen.getByRole("button", { name: "Refresh endpoint" }));
    expect(screen.getByTestId("endpoint").textContent).toBe("https://custom.toolyo.test");
  });
});
