-- Reviews foundational schema and immutable Booking.completedAt guard.
ALTER TABLE "Booking" ADD COLUMN "completedAt" TIMESTAMPTZ(6);

CREATE TYPE "ReviewDirection" AS ENUM ('renter_to_owner', 'owner_to_renter');
CREATE TYPE "ReviewStatus" AS ENUM ('hidden', 'published', 'under_review', 'removed');
CREATE TYPE "ReviewReportReason" AS ENUM ('offensive', 'inappropriate', 'false', 'irrelevant');
CREATE TYPE "ReviewReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

ALTER TABLE "Review"
  ADD COLUMN "bookingId" TEXT,
  ADD COLUMN "revieweeId" TEXT,
  ADD COLUMN "direction" "ReviewDirection",
  ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'hidden',
  ADD COLUMN "overallRating" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "submittedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "publishedAt" TIMESTAMPTZ(6);

CREATE TABLE "ReviewCategoryScore" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "category" VARCHAR(64) NOT NULL,
  "rating" INTEGER NOT NULL,
  CONSTRAINT "ReviewCategoryScore_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReviewReport" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reason" "ReviewReportReason" NOT NULL,
  "description" TEXT,
  "status" "ReviewReportStatus" NOT NULL DEFAULT 'open',
  "resolution" TEXT,
  "resolvedById" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMPTZ(6),
  CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_booking_author_direction_key" ON "Review"("bookingId", "authorId", "direction");
CREATE INDEX "Review_listing_status_deletedAt_createdAt_idx" ON "Review"("listingId", "status", "deletedAt", "createdAt");
CREATE INDEX "Review_reviewee_status_createdAt_idx" ON "Review"("revieweeId", "status", "createdAt");
CREATE INDEX "Review_booking_status_idx" ON "Review"("bookingId", "status");
CREATE UNIQUE INDEX "ReviewCategoryScore_reviewId_category_key" ON "ReviewCategoryScore"("reviewId", "category");
CREATE INDEX "ReviewCategoryScore_category_rating_idx" ON "ReviewCategoryScore"("category", "rating");
CREATE UNIQUE INDEX "ReviewReport_reviewId_reporterId_reason_status_key" ON "ReviewReport"("reviewId", "reporterId", "reason", "status");
CREATE INDEX "ReviewReport_reviewId_status_createdAt_idx" ON "ReviewReport"("reviewId", "status", "createdAt");
CREATE INDEX "ReviewReport_reporterId_status_createdAt_idx" ON "ReviewReport"("reporterId", "status", "createdAt");

ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewCategoryScore" ADD CONSTRAINT "ReviewCategoryScore_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_completed_at_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW."completedAt" IS DISTINCT FROM OLD."completedAt" THEN
    RAISE EXCEPTION 'Booking.completedAt is immutable after completion';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER booking_completed_at_immutable
BEFORE UPDATE ON "Booking" FOR EACH ROW EXECUTE FUNCTION prevent_completed_at_mutation();