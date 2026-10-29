import { describe, expect, it } from "vitest";
import { parseSearchView } from "@/hooks/use-search-params";

describe("parseSearchView", () => {
  it("accepts the supported list view", () => {
    expect(parseSearchView("list")).toBe("list");
  });

  it("uses grid for the default and unsupported URL values", () => {
    expect(parseSearchView(null)).toBe("grid");
    expect(parseSearchView("grid")).toBe("grid");
    expect(parseSearchView("table")).toBe("grid");
  });
});
