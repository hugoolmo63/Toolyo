import { describe, expect, it } from "vitest";
import {
  hostOf,
  isCleartextUrl,
  isLocalNetworkUrl,
  resolveEndpointConfig,
  validateEndpointForProduction,
} from "@/lib/native/endpoint-config";

describe("resolveEndpointConfig", () => {
  it("reads the single source of truth MOBILE_SERVER_URL", () => {
    const config = resolveEndpointConfig({
      MOBILE_SERVER_URL: "https://toolyo.example.com",
    });
    expect(config.baseUrl).toBe("https://toolyo.example.com");
    expect(config.allowRuntimeOverride).toBe(false);
    expect(config.allowCleartext).toBe(false);
  });

  it("enables cleartext for a local-network HTTP endpoint (FR-017)", () => {
    const config = resolveEndpointConfig({
      MOBILE_SERVER_URL: "http://192.168.1.50:3000",
    });
    expect(config.allowCleartext).toBe(true);
  });

  it("does not enable cleartext for public HTTP", () => {
    const config = resolveEndpointConfig({
      MOBILE_SERVER_URL: "http://toolyo.example.com",
    });
    expect(config.allowCleartext).toBe(false);
  });

  it("honours explicit cleartext and runtime override flags", () => {
    const config = resolveEndpointConfig({
      MOBILE_SERVER_URL: "https://toolyo.example.com",
      MOBILE_ALLOW_CLEARTEXT: "true",
      MOBILE_ALLOW_RUNTIME_OVERRIDE: "true",
    });
    expect(config.allowCleartext).toBe(true);
    expect(config.allowRuntimeOverride).toBe(true);
  });

  it("trims whitespace and defaults to empty", () => {
    expect(resolveEndpointConfig({ MOBILE_SERVER_URL: "  " }).baseUrl).toBe("");
    expect(resolveEndpointConfig().baseUrl).toBe("");
  });
});

describe("network helpers", () => {
  it("detects local network hosts", () => {
    expect(isLocalNetworkUrl("http://localhost:3000")).toBe(true);
    expect(isLocalNetworkUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalNetworkUrl("http://10.0.0.5:3000")).toBe(true);
    expect(isLocalNetworkUrl("http://192.168.0.10:3000")).toBe(true);
    expect(isLocalNetworkUrl("http://172.16.5.4:3000")).toBe(true);
    expect(isLocalNetworkUrl("http://toolyo.local:3000")).toBe(true);
  });

  it("rejects public hosts and invalid urls", () => {
    expect(isLocalNetworkUrl("https://toolyo.example.com")).toBe(false);
    expect(isLocalNetworkUrl("http://8.8.8.8")).toBe(false);
    expect(isLocalNetworkUrl("not-a-url")).toBe(false);
    expect(hostOf("not-a-url")).toBeNull();
  });

  it("detects cleartext schemes", () => {
    expect(isCleartextUrl("http://192.168.1.50:3000")).toBe(true);
    expect(isCleartextUrl("https://toolyo.example.com")).toBe(false);
  });
});

describe("validateEndpointForProduction", () => {
  it("rejects runtime override and non-HTTPS endpoints", () => {
    expect(
      validateEndpointForProduction({
        baseUrl: "https://toolyo.example.com",
        allowRuntimeOverride: true,
        allowCleartext: false,
      }),
    ).toMatch(/runtime/i);

    expect(
      validateEndpointForProduction({
        baseUrl: "http://192.168.1.50:3000",
        allowRuntimeOverride: false,
        allowCleartext: true,
      }),
    ).toMatch(/HTTPS/);
  });

  it("accepts a valid production configuration", () => {
    expect(
      validateEndpointForProduction({
        baseUrl: "https://toolyo.example.com",
        allowRuntimeOverride: false,
        allowCleartext: false,
      }),
    ).toBeNull();
  });
});
