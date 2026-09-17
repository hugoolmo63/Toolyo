import { Prisma, type PrismaClient } from "@prisma/client";
import type { UpdateUserProfileInput } from "../shared/user-profile.schema";

const publicProfileSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  ratingAverage: true,
  transactionCount: true,
  responseTimeHours: true,
  verificationStates: {
    where: { channel: "identity", status: "verified" },
    select: { id: true },
    take: 1,
  },
  listings: {
    where: { status: "published", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      pricePerDay: true,
      city: true,
    },
  },
} as const;

const editableProfileSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  preferredLocation: true,
} as const;

export async function findPublicUserProfile(db: PrismaClient, userId: string) {
  return db.user.findFirst({
    where: { id: userId, accountStatus: "active", deletedAt: null },
    select: publicProfileSelect,
  });
}

export async function updateUserProfile(
  db: PrismaClient,
  userId: string,
  data: UpdateUserProfileInput,
) {
  const updateData: Prisma.UserUpdateInput = {};
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.preferredLocation !== undefined) {
    updateData.preferredLocation = data.preferredLocation;
  }

  return db.user.update({
    where: { id: userId },
    data: updateData,
    select: editableProfileSelect,
  });
}

export type PublicUserProfileRecord = Awaited<ReturnType<typeof findPublicUserProfile>>;