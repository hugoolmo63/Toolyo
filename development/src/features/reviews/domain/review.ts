import type { ReviewDirection, ReviewStatus } from "@prisma/client";

export const REVIEW_CATEGORIES = {
  renter_to_owner: ["communication", "punctuality", "product_condition"],
  owner_to_renter: ["communication", "product_care", "punctuality"],
} as const satisfies Record<ReviewDirection, readonly string[]>;

export function isReviewCategoryAllowed(direction: ReviewDirection, category: string) {
  return (REVIEW_CATEGORIES[direction] as readonly string[]).includes(category);
}

export function canTransitionReview(from: ReviewStatus, to: ReviewStatus) {
  return (
    (from === "hidden" && to === "published") ||
    (from === "published" && to === "under_review") ||
    (from === "under_review" && (to === "published" || to === "removed"))
  );
}
