-- Required by the existing ListingEmbedding Unsupported("vector(384)") model
-- when Prisma replays the complete migration history in the shadow database.
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'active', 'completed');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'system');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('image');

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ListingEmbedding" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "embedding" vector(384) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ListingEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "pricePerDay" DECIMAL(19,4) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "subtotal" DECIMAL(19,4) NOT NULL,
    "serviceFee" DECIMAL(19,4) NOT NULL,
    "totalPrice" DECIMAL(19,4) NOT NULL,
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'EUR',
    "idempotencyKey" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "lastTransitionById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMPTZ(6),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "clientMessageId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "body" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL DEFAULT 'image',
    "storageKey" VARCHAR(512) NOT NULL,
    "publicUrl" VARCHAR(1024) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingEmbedding_listingId_key" ON "ListingEmbedding"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_conversationId_key" ON "Booking"("conversationId");

-- CreateIndex
CREATE INDEX "Booking_listingId_status_startDate_endDate_idx" ON "Booking"("listingId", "status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_renterId_createdAt_idx" ON "Booking"("renterId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_ownerId_createdAt_idx" ON "Booking"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_renterId_idempotencyKey_key" ON "Booking"("renterId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_bookingId_createdAt_idx" ON "BookingStatusHistory"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_changedById_createdAt_idx" ON "BookingStatusHistory"("changedById", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_listingId_updatedAt_idx" ON "Conversation"("listingId", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_deletedAt_updatedAt_idx" ON "Conversation"("deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_lastReadAt_idx" ON "ConversationParticipant"("userId", "lastReadAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_id_idx" ON "Message"("conversationId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_senderId_clientMessageId_key" ON "Message"("conversationId", "senderId", "clientMessageId");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_createdAt_idx" ON "MessageAttachment"("messageId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageAttachment_storageKey_idx" ON "MessageAttachment"("storageKey");

-- AddForeignKey
ALTER TABLE "ListingEmbedding" ADD CONSTRAINT "ListingEmbedding_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
