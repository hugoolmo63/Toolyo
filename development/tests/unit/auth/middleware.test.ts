import { describe, it, expect, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
  env: {
    SESSION_COOKIE_NAME: "toolyo_session",
    SESSION_TTL_SECONDS: 3600,
    SESSION_REMEMBER_TTL_SECONDS: 2592000,
  },
}));

import { validateCallbackPath } from "@/lib/auth";

describe("validateCallbackPath (middleware)", () => {
  it("returns default path for undefined callback", () => {
    expect(validateCallbackPath(undefined)).toBe("/dashboard");
  });

  it("returns the callback for valid internal paths", () => {
    expect(validateCallbackPath("/profile")).toBe("/profile");
    expect(validateCallbackPath("/dashboard?tab=1")).toBe("/dashboard?tab=1");
    expect(validateCallbackPath("/listings/abc-123")).toBe("/listings/abc-123");
  });

  it("rejects protocol-relative URLs", () => {
    expect(validateCallbackPath("//evil.com")).toBe("/dashboard");
    expect(validateCallbackPath("//evil.com/path")).toBe("/dashboard");
  });

  it("rejects external URLs (no leading slash)", () => {
    expect(validateCallbackPath("https://evil.com")).toBe("/dashboard");
    expect(validateCallbackPath("http://evil.com")).toBe("/dashboard");
  });

  it("rejects path traversal with backslashes", () => {
    expect(validateCallbackPath("/\\..\\..")).toBe("/dashboard");
  });

  it("rejects null bytes", () => {
    expect(validateCallbackPath("/\0")).toBe("/dashboard");
  });

  it("rejects excessively long paths", () => {
    expect(validateCallbackPath("/" + "a".repeat(600))).toBe("/dashboard");
  });

  it("accepts root path", () => {
    expect(validateCallbackPath("/")).toBe("/");
  });

  it("accepts paths with query params and fragments", () => {
    expect(validateCallbackPath("/search?q=test&f=1")).toBe("/search?q=test&f=1");
  });
});
