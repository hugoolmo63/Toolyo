import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/server/db/client";
import { NotFoundError } from "@/server/lib/errors/domain-errors";
import type { PublicUserProfileDTO } from "../domain/public-user-profile";
import { findPublicUserProfileRecord } from "../infrastructure/public-user-profile.repository";

export async function getPublicUserProfile(
  userId: string,
  db: PrismaClient = defaultPrisma,
): Promise<PublicUserProfileDTO> {
  const record = await findPublicUserProfileRecord(db, userId);
  if (!record) throw new NotFoundError("El perfil no está disponible");
  return {
    id: record.id,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    bio: record.bio,
    preferredLocation: record.preferredLocation,
    createdAt: record.createdAt.toISOString(),
    ratingAverage: (() => {
      const ratings = record.listings.flatMap((listing) => (listing.reviews ?? []).map((review) => review.rating));
      return ratings.length ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10 : null;
    })(),
    transactionCount: record.transactionCount ?? 0,
    badges: {
      registered: true,
      verified: record.verificationStates.length > 0,
      superLessor: false,
    },
    listings: record.listings.filter((listing) => listing.status === "published").map((listing) => ({
      id: listing.id, slug: listing.slug, title: listing.title,
      coverImageUrl: listing.photos[0]?.url ?? null,
      pricePerDay: Number(listing.pricePerDay), city: listing.city,
      ratingAverage: Number(listing.ratingAverage), reviewCount: listing.reviewCount,
    })),
    reviews: record.listings.flatMap((listing) => (listing.reviews ?? []).map((review) => ({
      id: review.id,
      author: { id: review.authorId, displayName: review.author.displayName, avatarUrl: review.author.avatarUrl },
      listing: { id: listing.id, title: listing.title, slug: listing.slug },
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    }))).sort((first, second) => second.createdAt.localeCompare(first.createdAt)),
  };
}