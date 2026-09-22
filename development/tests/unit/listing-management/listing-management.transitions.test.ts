import { describe, expect, it } from "vitest";
import { canTransition } from "@/features/listing-management/application/listing-management.service";

describe("listing-management transitions", () => {
  it("allows owners to publish draft, paused and rejected listings", () => {
    expect(canTransition("draft", "published")).toBe(true);
    expect(canTransition("paused", "published")).toBe(true);
    expect(canTransition("rejected", "published")).toBe(true);
  });

  it("does not allow publishing an already published listing through this transition", () => {
    expect(canTransition("published", "published")).toBe(false);
    expect(canTransition("in_review", "published")).toBe(false);
  });
});
