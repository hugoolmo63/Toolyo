export type PublicUserBadge = "registered" | "verified" | "superLessor";

export type PublicReview = {
  id: string;
  author: { id: string; displayName: string | null; avatarUrl: string | null };
  listing: { id: string; title: string; slug: string };
  rating: number;
  status?: "published" | "under_review";
  comment: string | null;
  createdAt: string;
};

export type PublicListingCard = {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  pricePerDay: number;
  city: string | null;
  ratingAverage: number;
  reviewCount: number;
};

export type PublicUserProfileDTO = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferredLocation: string | null;
  createdAt: string;
  ratingAverage: number | null;
  transactionCount: number;
  badges: Record<PublicUserBadge, boolean>;
  listings: PublicListingCard[];
  reviews: PublicReview[];
};