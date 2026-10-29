import type { ListingStatus, Prisma } from "@prisma/client";

export type ListingManagementPhoto = {
  id: string;
  url: string;
  altText: string | null;
  order: number;
};

export type ListingManagementSummary = {
  id: string;
  slug: string;
  title: string;
  primaryPhotoUrl: string | null;
  category: { id: string; name: string; slug: string };
  pricePerDay: string;
  status: ListingStatus;
  updatedAt: string;
  deletedAt: string | null;
};

export type ListingManagementDetail = ListingManagementSummary & {
  description: string | null;
  verificationVideoUrl: string | null;
  location: { city: string | null; lat: number | null; lng: number | null; addressText: string | null };
  photos: ListingManagementPhoto[];
  availability: Array<{ blockedDate: string; reason: string | null }>;
  createdAt: string;
  activeCommitments: { pendingRequests: number; activeRentals: number };
};

export type PaginatedListings = {
  items: ListingManagementSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export type ListingWriteData = {
  title: string;
  description?: string;
  categoryId: string;
  pricePerDay: Prisma.Decimal;
  city?: string;
  lat?: Prisma.Decimal | null;
  lng?: Prisma.Decimal | null;
  addressText?: string | null;
};
