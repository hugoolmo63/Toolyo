-- CreateTable
CREATE TABLE "FavoriteList" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FavoriteList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FavoriteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteList_userId_createdAt_idx" ON "FavoriteList"("userId", "createdAt");
CREATE UNIQUE INDEX "FavoriteItem_listId_listingId_key" ON "FavoriteItem"("listId", "listingId");
CREATE INDEX "FavoriteItem_listingId_idx" ON "FavoriteItem"("listingId");

-- AddForeignKey
ALTER TABLE "FavoriteList" ADD CONSTRAINT "FavoriteList_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteItem" ADD CONSTRAINT "FavoriteItem_listId_fkey"
  FOREIGN KEY ("listId") REFERENCES "FavoriteList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteItem" ADD CONSTRAINT "FavoriteItem_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
