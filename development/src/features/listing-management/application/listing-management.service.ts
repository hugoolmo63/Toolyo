import { Prisma, type PrismaClient, type ListingStatus } from "@prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "@/server/lib/errors/domain-errors";
import { noActiveCommitments, type ActiveCommitmentsPort } from "./active-commitments.port";
import { transformersListingEmbedding, type ListingEmbeddingPort } from "./listing-embedding.port";
import type { ListingManagementDetail, PaginatedListings } from "../domain/listing-management";
import {
  createListing,
  findCategory,
  findMine,
  listMine as listMineRecords,
  mapDetail,
  replacePhotos,
  updateListing,
  type ListingDb,
} from "../infrastructure/listing-management.repository";
import type { CreateListingManagementInput, ListMineInput, RemoveListingInput, UpdateListingManagementInput } from "../shared/listing-management.schema";

const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 140) || "producto";

async function assertCategory(db: ListingDb, categoryId: string) {
  if (!(await findCategory(db, categoryId))) throw new ValidationError("La categoría no existe o no está activa");
}

function assertPublishable(input: Pick<CreateListingManagementInput, "title" | "categoryId" | "pricePerDay" | "photos">) {
  if (input.photos.length > 10) throw new ValidationError("Cada producto admite un máximo de 10 fotos");
  if (!input.title.trim() || !input.categoryId || Number(input.pricePerDay) <= 0 || input.photos.length === 0) {
    throw new ValidationError("Para publicar necesitas título, categoría, precio e imagen");
  }
}

export async function listMine(db: PrismaClient, ownerId: string, input: ListMineInput): Promise<PaginatedListings> {
  return listMineRecords(db, ownerId, input);
}

export async function getMine(db: PrismaClient, ownerId: string, listingId: string): Promise<ListingManagementDetail> {
  const listing = await findMine(db, ownerId, listingId);
  if (!listing) throw new NotFoundError("Producto no encontrado");
  return mapDetail(listing, noActiveCommitments.countForListing ? await noActiveCommitments.countForListing(listingId) : { pendingRequests: 0, activeRentals: 0 });
}

export async function create(db: PrismaClient, ownerId: string, input: CreateListingManagementInput, embeddings: ListingEmbeddingPort = transformersListingEmbedding) {
  await assertCategory(db, input.categoryId);
  if (input.publish) assertPublishable(input);
  const baseSlug = slugify(input.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const result = await db.$transaction(async (tx) => {
    const listing = await createListing(tx, {
      owner: { connect: { id: ownerId } },
      category: { connect: { id: input.categoryId } },
      title: input.title,
      slug,
      description: input.description,
      verificationVideoUrl: input.verificationVideoUrl,
      pricePerDay: new Prisma.Decimal(input.pricePerDay),
      city: input.city,
      lat: input.lat == null ? undefined : new Prisma.Decimal(input.lat),
      lng: input.lng == null ? undefined : new Prisma.Decimal(input.lng),
      addressText: input.addressText,
      status: input.publish ? "published" : "draft",
      photos: input.photos.length > 0 ? { create: input.photos.map((photo) => ({ url: photo.url, altText: photo.altText, order: photo.order })) } : undefined,
    });
    return { listingId: listing.id, slug: listing.slug, status: listing.status };
  });
  if (result.status === "published") {
    await embeddings.syncForListing(db, { id: result.listingId, title: input.title, description: input.description ?? null });
  }
  return result;
}

export async function update(db: PrismaClient, ownerId: string, input: UpdateListingManagementInput, embeddings: ListingEmbeddingPort = transformersListingEmbedding) {
  const existing = await findMine(db, ownerId, input.listingId);
  if (!existing) throw new NotFoundError("Producto no encontrado");
  if (input.categoryId) await assertCategory(db, input.categoryId);
  const data: Prisma.ListingUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.verificationVideoUrl !== undefined) data.verificationVideoUrl = input.verificationVideoUrl;
  if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
  if (input.pricePerDay !== undefined) data.pricePerDay = new Prisma.Decimal(input.pricePerDay);
  if (input.city !== undefined) data.city = input.city;
  if (input.lat !== undefined) data.lat = input.lat == null ? null : new Prisma.Decimal(input.lat);
  if (input.lng !== undefined) data.lng = input.lng == null ? null : new Prisma.Decimal(input.lng);
  if (input.addressText !== undefined) data.addressText = input.addressText;
  const result = await db.$transaction(async (tx) => {
    const updated = await updateListing(tx, input.listingId, data);
    if (input.photos !== undefined) await replacePhotos(tx, input.listingId, input.photos);
    return { id: updated.id, updatedAt: updated.updatedAt.toISOString(), status: updated.status };
  });
  const title = input.title ?? existing.title;
  const description = input.description ?? existing.description;
  if (existing.status === "published" && (title !== existing.title || description !== existing.description)) {
    await embeddings.syncForListing(db, { id: result.id, title, description });
  }
  return result;
}

export async function publish(db: PrismaClient, ownerId: string, listingId: string, embeddings: ListingEmbeddingPort = transformersListingEmbedding) {
  const listing = await findMine(db, ownerId, listingId);
  if (!listing) throw new NotFoundError("Producto no encontrado");
  assertPublishable({ title: listing.title, categoryId: listing.categoryId, pricePerDay: listing.pricePerDay.toString(), photos: listing.photos.map((photo) => ({ url: photo.url, altText: photo.altText ?? undefined, order: photo.order })) });
  const result = await updateListing(db, listingId, { status: "published" });
  await embeddings.syncForListing(db, { id: listingId, title: listing.title, description: listing.description });
  return result;
}

export async function remove(db: PrismaClient, ownerId: string, input: RemoveListingInput, commitments: ActiveCommitmentsPort = noActiveCommitments) {
  const listing = await findMine(db, ownerId, input.listingId);
  if (!listing) throw new NotFoundError("Producto no encontrado");
  const active = await commitments.countForListing(input.listingId);
  if (active.pendingRequests > 0 || active.activeRentals > 0) throw new ConflictError("No puedes retirar un producto con alquileres o solicitudes activas");
  const removedAt = new Date();
  await db.listing.update({ where: { id: input.listingId }, data: { deletedAt: removedAt }, select: { id: true } });
  return { listingId: input.listingId, removedAt: removedAt.toISOString() };
}

export function canTransition(status: ListingStatus, next: ListingStatus) {
  return (status === "draft" || status === "paused" || status === "rejected") && next === "published";
}
