/*
  Warnings:

  - A unique constraint covering the columns `[uploadId]` on the table `MessageAttachment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MessageAttachment" ADD COLUMN     "uploadId" TEXT;

-- CreateTable
CREATE TABLE "AttachmentUpload" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "storageKey" VARCHAR(512) NOT NULL,
    "publicUrl" VARCHAR(1024) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "confirmedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AttachmentUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttachmentUpload_storageKey_key" ON "AttachmentUpload"("storageKey");

-- CreateIndex
CREATE INDEX "AttachmentUpload_conversationId_uploadedById_expiresAt_idx" ON "AttachmentUpload"("conversationId", "uploadedById", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageAttachment_uploadId_key" ON "MessageAttachment"("uploadId");

-- AddForeignKey
ALTER TABLE "AttachmentUpload" ADD CONSTRAINT "AttachmentUpload_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentUpload" ADD CONSTRAINT "AttachmentUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "AttachmentUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
