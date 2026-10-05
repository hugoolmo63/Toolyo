import { describe, expect, it } from "vitest";
import { isBlockedOnMobile, normalizePlatform } from "@/lib/native/platform";

describe("normalizePlatform", () => {
  it("maps capacitor platforms to the app domain", () => {
    expect(normalizePlatform("android")).toBe("android");
    expect(normalizePlatform("ios")).toBe("ios");
  });

  it("falls back to web for unknown or empty values", () => {
    expect(normalizePlatform("web")).toBe("web");
    expect(normalizePlatform("")).toBe("web");
    expect(normalizePlatform(null)).toBe("web");
    expect(normalizePlatform(undefined)).toBe("web");
  });
});

describe("isBlockedOnMobile", () => {
  it("blocks the admin backoffice (FR-014)", () => {
    expect(isBlockedOnMobile("/admin")).toBe(true);
    expect(isBlockedOnMobile("/admin/users")).toBe(true);
    expect(isBlockedOnMobile("/admin/reviews/123")).toBe(true);
  });

  it("allows end-user routes", () => {
    expect(isBlockedOnMobile("/")).toBe(false);
    expect(isBlockedOnMobile("/search")).toBe(false);
    expect(isBlockedOnMobile("/listings/casa")).toBe(false);
    expect(isBlockedOnMobile("/administracion")).toBe(false);
  });
});
