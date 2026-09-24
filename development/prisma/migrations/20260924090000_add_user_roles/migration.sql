CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

ALTER TABLE "User"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'user';

CREATE INDEX "User_role_idx" ON "User"("role");