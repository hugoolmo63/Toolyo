import { Prisma, PrismaClient, type ListingStatus } from "@prisma/client";
import type {
  ListingManagementDetail,
  ListingManagementPhoto,
  ListingManagementSummary,
  PaginatedListings,
} from "../domain/listing-management";
import type { ListMineInput } from "../shared/listing-management.schema";

export type ListingDb = PrismaClient | Prisma.TransactionClient;

const summarySelect = {
  id: true,
  slug: true,
  title: true,
  pricePerDay: true,
  status: true,
  updatedAt: true,
  deletedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  photos: {
    where: { deletedAt: null },
    orderBy: { order: "asc" as const },
    take: 1,
    select: { url: true },
  },
} as const;

function mapSummary(row: Prisma.ListingGetPayload<{ select: typeof summarySelect }>): ListingManagementSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    primaryPhotoUrl: row.photos[0]?.url ?? null,
    category: row.category,
    pricePerDay: row.pricePerDay.toString(),
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

export async function listMine(db: ListingDb, ownerId: string, input: ListMineInput): Promise<PaginatedListings> {
  const where: Prisma.ListingWhereInput = {
    ownerId,
    deletedAt: null,
    ...(input.status ? { status: input.status } : {}),
    ...(input.query ? { title: { contains: input.query, mode: "insensitive" } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.listing.findMany({
      where,
      select: summarySelect,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    db.listing.count({ where }),
  ]);
  return { items: rows.map(mapSummary), page: input.page, pageSize: input.pageSize, total };
}

export async function findMine(db: ListingDb, ownerId: string, listingId: string) {
  return db.listing.findFirst({
    where: { id: listingId, ownerId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      photos: { where: { deletedAt: null }, orderBy: { order: "asc" } },
      availability: { orderBy: { blockedDate: "asc" } },
    },
  });
}

export async function findCategory(db: ListingDb, categoryId: string) {
  return db.category.findFirst({ where: { id: categoryId, deletedAt: null }, select: { id: true } });
}

export async function createListing(db: ListingDb, data: Prisma.ListingCreateInput) {
  return db.listing.create({ data, select: { id: true, slug: true, status: true } });
}

export async function updateListing(db: ListingDb, listingId: string, data: Prisma.ListingUpdateInput) {
  return db.listing.update({ where: { id: listingId }, data, select: { id: true, updatedAt: true, status: true } });
}

export async function replacePhotos(db: ListingDb, listingId: string, photos: Array<{ id?: string; url: string; altText?: string; order: number }>) {
  await db.listingPhoto.updateMany({ where: { listingId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (photos.length > 0) {
    await db.listingPhoto.createMany({
      data: photos.map((photo) => ({ listingId, url: photo.url, altText: photo.altText, order: photo.order })),
    });
  }
}

export function mapDetail(row: NonNullable<Awaited<ReturnType<typeof findMine>>>, activeCommitments: { pendingRequests: number; activeRentals: number }): ListingManagementDetail {
  return {
    ...mapSummary({ ...row, photos: row.photos.slice(0, 1) } as Prisma.ListingGetPayload<{ select: typeof summarySelect }>),
    description: row.description,
    verificationVideoUrl: row.verificationVideoUrl,
    location: { city: row.city, lat: row.lat ? Number(row.lat) : null, lng: row.lng ? Number(row.lng) : null, addressText: row.addressText },
    photos: row.photos.map((photo): ListingManagementPhoto => ({ id: photo.id, url: photo.url, altText: photo.altText, order: photo.order })),
    availability: row.availability.map((availability) => ({ blockedDate: availability.blockedDate.toISOString().slice(0, 10), reason: availability.reason })),
    createdAt: row.createdAt.toISOString(),
    activeCommitments,
  };
}

export function statusIs(value: ListingStatus, expected: ListingStatus) {
  return value === expected;
}
