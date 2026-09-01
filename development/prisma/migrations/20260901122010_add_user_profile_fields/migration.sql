-- DropIndex
DROP INDEX "Listing_location_gist_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" VARCHAR(512),
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "displayName" VARCHAR(100),
ADD COLUMN     "ratingAverage" DECIMAL(2,1),
ADD COLUMN     "responseTimeHours" INTEGER,
ADD COLUMN     "transactionCount" INTEGER DEFAULT 0;
