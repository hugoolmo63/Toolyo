-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_listingId_fkey";

-- DropIndex
DROP INDEX "Review_authorId_createdAt_idx";

-- DropIndex
DROP INDEX "Review_listingId_deletedAt_createdAt_idx";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "rating" SET DEFAULT 0,
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Review_booking_author_direction_key" RENAME TO "Review_bookingId_authorId_direction_key";

-- RenameIndex
ALTER INDEX "Review_booking_status_idx" RENAME TO "Review_bookingId_status_idx";

-- RenameIndex
ALTER INDEX "Review_listing_status_deletedAt_createdAt_idx" RENAME TO "Review_listingId_status_deletedAt_createdAt_idx";

-- RenameIndex
ALTER INDEX "Review_reviewee_status_createdAt_idx" RENAME TO "Review_revieweeId_status_createdAt_idx";
