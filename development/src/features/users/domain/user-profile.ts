export type UserProfileListing = {
  id: string;
  slug: string;
  title: string;
  pricePerDay: number;
  city: string | null;
};

export type PublicUserProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  ratingAverage: number | null;
  transactionCount: number;
  badges: {
    verified: boolean;
    quickResponse: boolean;
  };
  listings: UserProfileListing[];
};

export const QUICK_RESPONSE_MAX_HOURS = 24;