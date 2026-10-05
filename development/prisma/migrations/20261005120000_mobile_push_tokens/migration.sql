-- CreateEnum
CREATE TYPE "MobilePlatform" AS ENUM ('android', 'ios');

-- CreateTable
CREATE TABLE "DevicePushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "MobilePlatform" NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "deviceId" VARCHAR(191),
    "appVersion" VARCHAR(40),
    "osVersion" VARCHAR(40),
    "locale" VARCHAR(20),
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DevicePushToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DevicePushToken_token_key" ON "DevicePushToken"("token");

-- CreateIndex
CREATE INDEX "DevicePushToken_userId_revokedAt_idx" ON "DevicePushToken"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "DevicePushToken_platform_notificationsEnabled_idx" ON "DevicePushToken"("platform", "notificationsEnabled");

-- CreateIndex
CREATE INDEX "DevicePushToken_lastSeenAt_idx" ON "DevicePushToken"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "DevicePushToken_userId_deviceId_platform_key" ON "DevicePushToken"("userId", "deviceId", "platform");

-- AddForeignKey
ALTER TABLE "DevicePushToken" ADD CONSTRAINT "DevicePushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
