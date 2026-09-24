ALTER TABLE "Review"
  ADD COLUMN "expiresAt" TIMESTAMPTZ(6);

CREATE INDEX "Review_status_expiresAt_deletedAt_idx"
  ON "Review"("status", "expiresAt", "deletedAt");