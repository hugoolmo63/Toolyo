import type { PrismaClient } from "@prisma/client";

export const publicUserProfileSelect = {
  id: true, displayName: true, avatarUrl: true, bio: true, preferredLocation: true,
  createdAt: true, ratingAverage: true, transactionCount: true, responseTimeHours: true,
  verificationStates: { where: { channel: "identity", status: "verified" }, select: { id: true }, take: 1 },
  listings: {
    where: { deletedAt: null }, orderBy: { createdAt: "desc" },
    select: {
      id: true, slug: true, title: true, pricePerDay: true, city: true, status: true,
      ratingAverage: true, reviewCount: true,
      photos: { where: { deletedAt: null }, orderBy: { order: "asc" }, take: 1, select: { url: true } },
      reviews: {
        where: { deletedAt: null }, orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true, authorId: true, author: { select: { displayName: true, avatarUrl: true } } },
      },
    },
  },
} as const;

export async function findPublicUserProfileRecord(db: PrismaClient, userId: string) {
  return db.user.findFirst({
    where: { id: userId, accountStatus: "active", deletedAt: null },
    select: publicUserProfileSelect,
  });
}