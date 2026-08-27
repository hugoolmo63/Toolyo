import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone } from "@/server/auth/normalization";

describe("contact normalization", () => {
  it("normalizes email casing and whitespace", () => {
    expect(normalizeEmail(" Person@Example.COM ")).toBe("person@example.com");
  });

  it("normalizes Spanish phone numbers to E.164", () => {
    expect(normalizePhone("600 123 456")).toBe("+34600123456");
    expect(normalizePhone("invalid")).toBeNull();
  });
});
