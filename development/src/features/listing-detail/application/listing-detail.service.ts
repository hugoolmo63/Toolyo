import { PrismaClient } from "@prisma/client";
import {
  findListingBySlug,
  findPhotosByListingId,
  findAvailabilityByListingId,
  findSimilarListings,
  incrementListingView,
  type RawListingDetailRow,
  type RawListingPhotoRow,
  type RawSimilarListingRow,
} from "../infrastructure/listing-detail.repository";
import { derivePriceTiers } from "../domain/price-tiers";
import type {
  ListingDetailDTO,
  OwnerDTO,
  ListingPhotoDTO,
  PriceTierDTO,
  SimilarListingDTO,
} from "../domain/listing-detail";
import type {
  GetBySlugInput,
  GetSimilarInput,
} from "../shared/listing-detail.schema";

/**
 * Servicio de aplicación del detalle de listing (005-listing-detail).
 * Orquesta repositorios y mapea a DTOs públicos sin datos privados.
 * Ver contracts/listing-detail.md.
 */

/** Caché en memoria para deduplicar incrementos de vista por IP/sesión (TTL 30 min). */
const VIEW_DEDUP_TTL_MS = 30 * 60 * 1000;
const viewDedupCache = new Map<string, number>();

/**
 * Mapea una fila raw de Listing a ListingDetailDTO (solo campos públicos).
 * Nunca incluye email, teléfono, dirección exacta ni datos de pago.
 */
function mapDetailToDTO(
  row: RawListingDetailRow,
  photos: RawListingPhotoRow[],
  availability: string[],
  priceTiers: PriceTierDTO[],
): ListingDetailDTO {
  const owner: OwnerDTO = {
    id: row.ownerId,
    displayName: row.ownerDisplayName,
    avatarUrl: row.ownerAvatarUrl,
    isVerified: row.ownerIsVerified,
    ratingAverage: row.ownerRatingAverage ? Number(row.ownerRatingAverage) : null,
    responseTimeHours: row.ownerResponseTimeHours,
    transactionCount: row.ownerTransactionCount,
  };

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    pricePerDay: Number(row.pricePerDay),
    location:
      row.lat && row.lng
        ? { lat: Number(row.lat), lng: Number(row.lng) }
        : null,
    addressText: row.addressText,
    city: row.city,
    ratingAverage: Number(row.ratingAverage),
    reviewCount: row.reviewCount,
    viewCount: row.viewCount,
    isInstantBooking: row.isInstantBooking,
    createdAt: row.createdAt.toISOString(),
    category: {
      id: row.categoryId,
      name: row.categoryName,
      slug: row.categorySlug,
      parentName: row.parentCategoryName ?? null,
    },
    owner,
    photos: photos.map(mapPhotoToDTO),
    availability,
    priceTiers,
  };
}

function mapPhotoToDTO(p: RawListingPhotoRow): ListingPhotoDTO {
  return {
    id: p.id,
    url: p.url,
    altText: p.altText,
    order: p.order,
  };
}

function mapSimilarToDTO(row: RawSimilarListingRow): SimilarListingDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    pricePerDay: Number(row.pricePerDay),
    primaryPhotoUrl: row.primaryPhotoUrl,
    ratingAverage: Number(row.ratingAverage),
    reviewCount: row.reviewCount,
    city: row.city,
  };
}

/** Convierte un array de fechas Date a ISO date strings (YYYY-MM-DD). */
function datesToISO(dates: Date[]): string[] {
  return dates.map((d) => d.toISOString().slice(0, 10));
}

/**
 * Obtiene el detalle completo de un listing por slug.
 * Devuelve null si el listing no existe, no está publicado, o su owner no es active.
 */
export async function getListingBySlug(
  prisma: PrismaClient,
  input: GetBySlugInput,
): Promise<ListingDetailDTO | null> {
  const row = await findListingBySlug(prisma, input.slug);
  if (!row) return null;

  // Cargar fotos, disponibilidad y calcular tramos en paralelo
  const [photos, availability] = await Promise.all([
    findPhotosByListingId(prisma, row.id),
    findAvailabilityByListingId(prisma, row.id),
  ]);

  const priceTiers = derivePriceTiers(Number(row.pricePerDay));

  return mapDetailToDTO(
    row,
    photos,
    datesToISO(availability.map((a) => a.blockedDate)),
    priceTiers,
  );
}

/**
 * Obtiene listings similares a uno dado (misma categoría y/o zona).
 */
export async function getSimilarListings(
  prisma: PrismaClient,
  input: GetSimilarInput,
): Promise<SimilarListingDTO[]> {
  const rows = await findSimilarListings(prisma, input);
  return rows.map(mapSimilarToDTO);
}

/**
 * Incrementa el contador de vistas de un listing con deduplicación por IP/sesión.
 * Fire-and-forget: el llamador no debe esperar a esta función para renderizar.
 */
export async function incrementView(
  prisma: PrismaClient,
  listingId: string,
  ip: string | null,
  sessionId?: string | null,
): Promise<{ ok: true }> {
  const dedupKey = `view:${listingId}:${sessionId ?? ip ?? "anon"}`;
  const now = Date.now();
  const lastIncrement = viewDedupCache.get(dedupKey);

  // Si ya se incrementó en los últimos 30 min, no volver a hacerlo
  if (lastIncrement !== undefined && now - lastIncrement < VIEW_DEDUP_TTL_MS) {
    return { ok: true };
  }

  viewDedupCache.set(dedupKey, now);

  // Fire-and-forget: errores silenciosos para no bloquear el render
  try {
    await incrementListingView(prisma, listingId);
  } catch {
    // Error silencioso — el contador de vistas no es crítico
  }

  return { ok: true };
}

/** Limpia la caché de deduplicación (para tests). */
export function clearViewDedupCache(): void {
  viewDedupCache.clear();
}
