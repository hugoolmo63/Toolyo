import { describe, expect, it } from "vitest";
import { parseDeepLink } from "@/lib/native/deep-link";

describe("parseDeepLink", () => {
  it("resolves https links on the app origin", () => {
    expect(parseDeepLink("https://toolyo.example.com/listings/casa", "https://toolyo.example.com")).toEqual({
      pathname: "/listings/casa",
      search: "",
    });
  });

  it("preserves the query string", () => {
    expect(
      parseDeepLink(
        "https://toolyo.example.com/listings/casa?start=2026-10-01&end=2026-10-05",
        "https://toolyo.example.com",
      ),
    ).toEqual({
      pathname: "/listings/casa",
      search: "?start=2026-10-01&end=2026-10-05",
    });
  });

  it("rejects links from another origin", () => {
    expect(parseDeepLink("https://evil.example.com/listings/casa", "https://toolyo.example.com")).toBeNull();
  });

  it("resolves the custom scheme fallback", () => {
    expect(parseDeepLink("toolyo://listings/casa")).toEqual({
      pathname: "/listings/casa",
      search: "",
    });
    expect(parseDeepLink("toolyo://messages")).toEqual({
      pathname: "/messages",
      search: "",
    });
  });

  it("blocks the admin backoffice (FR-014)", () => {
    expect(parseDeepLink("https://toolyo.example.com/admin", "https://toolyo.example.com")).toBeNull();
    expect(parseDeepLink("toolyo://admin/users")).toBeNull();
  });

  it("rejects routes outside the allowlist", () => {
    expect(parseDeepLink("https://toolyo.example.com/unknown", "https://toolyo.example.com")).toBeNull();
  });

  it("allows the root and known roots", () => {
    expect(parseDeepLink("https://toolyo.example.com/", "https://toolyo.example.com")).toEqual({
      pathname: "/",
      search: "",
    });
    expect(parseDeepLink("https://toolyo.example.com/users/42", "https://toolyo.example.com")?.pathname).toBe("/users/42");
    expect(parseDeepLink("https://toolyo.example.com/messages/abc", "https://toolyo.example.com")?.pathname).toBe("/messages/abc");
    expect(parseDeepLink("https://toolyo.example.com/search", "https://toolyo.example.com")?.pathname).toBe("/search");
  });

  it("returns null for invalid input", () => {
    expect(parseDeepLink("not-a-url")).toBeNull();
    expect(parseDeepLink("")).toBeNull();
  });
});
