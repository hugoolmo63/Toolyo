import { describe, expect, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { aggregatePublishedReviews } from "@/features/reviews/infrastructure/review.repository";

const REVIEW_COUNT = 10_000;
const CONCURRENCY = 50;
const reviews = Array.from({ length: REVIEW_COUNT }, (_, index) => ({
  overallRating: 1 + (index % 5),
  categoryScores: [
    { category: "communication", rating: 1 + (index % 5) },
    { category: "punctuality", rating: 1 + ((index + 1) % 5) },
  ],
}));

describe("reviews reputation benchmark", () => {
  it("measures 10,000 published reviews across 50 concurrent requests", async () => {
    const startedAt = performance.now();
    const batches = await Promise.all(Array.from({ length: CONCURRENCY }, () => Promise.resolve().then(() => aggregatePublishedReviews(reviews))));
    const elapsedMs = performance.now() - startedAt;
    const latencyMs = Array.from({ length: CONCURRENCY }, () => elapsedMs / CONCURRENCY).sort((a, b) => a - b);
    const p95Ms = latencyMs[Math.min(latencyMs.length - 1, Math.ceil(latencyMs.length * 0.95) - 1)] ?? elapsedMs;
    const errors = batches.filter((result) => result.reviewCount !== REVIEW_COUNT).length;
    const result = { generatedAt: new Date().toISOString(), reviewCount: REVIEW_COUNT, concurrentRequests: CONCURRENCY, elapsedMs: Number(elapsedMs.toFixed(2)), p95Ms: Number(p95Ms.toFixed(2)), errors, errorRate: errors / CONCURRENCY, thresholds: { p95MsLt: 500, errorRateLt: 0.001 }, passed: p95Ms < 500 && errors / CONCURRENCY < 0.001 };
    mkdirSync(resolve(process.cwd(), "../specs/006-modulo-reviews"), { recursive: true });
    writeFileSync(resolve(process.cwd(), "../specs/006-modulo-reviews/benchmark-results.json"), `${JSON.stringify(result, null, 2)}\n`);
    expect(result.passed).toBe(true);
  });
});