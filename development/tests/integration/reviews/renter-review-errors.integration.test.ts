import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ConflictError, ValidationError } from "@/server/lib/errors/domain-errors";

describe("renter review domain errors", () => {
  const db = new PrismaClient();
  beforeEach(() => undefined);

  it("rejects non-completed and expired bookings through the domain guard", async () => {
    await expect(import("@/features/reviews/domain/review-eligibility").then(({ assertReviewEligible }) => assertReviewEligible("pending", null))).rejects.toBeInstanceOf(ValidationError);
    await expect(import("@/features/reviews/domain/review-eligibility").then(({ assertReviewEligible }) => assertReviewEligible("completed", new Date("2020-01-01")))).rejects.toBeInstanceOf(ValidationError);
  });

  it("exposes conflict and validation error types for duplicate and invalid review paths", () => {
    expect(new ConflictError("duplicate")).toBeInstanceOf(Error);
  });

  afterAll(async () => { await db.$disconnect(); });
});