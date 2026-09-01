-- Enable PostGIS extension (required for geometry type and ST_DWithin/ST_Distance)
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'in_review', 'published', 'paused', 'rejected');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "pricePerDay" DECIMAL(19,4) NOT NULL,
    "location" geometry(Point, 4326),
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "addressText" TEXT,
    "city" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'draft',
    "ratingAverage" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isInstantBooking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPhoto" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingAvailability" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "blockedDate" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ListingAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_status_deletedAt_idx" ON "Listing"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "Listing_categoryId_status_deletedAt_idx" ON "Listing"("categoryId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Listing_ownerId_status_idx" ON "Listing"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Listing_pricePerDay_idx" ON "Listing"("pricePerDay");

-- CreateIndex
CREATE INDEX "Listing_ratingAverage_idx" ON "Listing"("ratingAverage");

-- CreateIndex
CREATE INDEX "ListingPhoto_listingId_order_deletedAt_idx" ON "ListingPhoto"("listingId", "order", "deletedAt");

-- CreateIndex
CREATE INDEX "ListingAvailability_listingId_blockedDate_idx" ON "ListingAvailability"("listingId", "blockedDate");

-- CreateIndex
CREATE UNIQUE INDEX "ListingAvailability_listingId_blockedDate_key" ON "ListingAvailability"("listingId", "blockedDate");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAvailability" ADD CONSTRAINT "ListingAvailability_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateGiSTIndex for geospatial queries (ST_DWithin, ST_Distance) — DATABASE.md §5.4
CREATE INDEX "Listing_location_gist_idx" ON "Listing" USING GIST ("location");
