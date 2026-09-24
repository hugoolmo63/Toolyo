import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
import { getListingBySlug, incrementView } from "@/features/listing-detail/application/listing-detail.service";
import { ListingDetailPage } from "@/features/listing-detail/presentation";
import { logger } from "@/server/lib/logger";
import { getPublishedListingAggregate } from "@/features/reviews/infrastructure/review.repository";

/**
 * Página de detalle del producto — Server Component (005-listing-detail).
 * Lee el slug de los params de la ruta, precarga el detalle vía servicio,
 * dispara el incremento de vistas fire-and-forget, y renderiza la ficha.
 * Si el listing no existe o no está publicado, devuelve 404 informativo.
 * Ver spec.md FR-001 y contracts/listing-detail.md.
 */
interface ListingPageProps {
  params: { slug: string };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const listing = await getListingBySlug(prisma, { slug: params.slug });

  if (!listing) {
    notFound();
  }

  const reputation = await getPublishedListingAggregate(prisma, listing!.id);

  // Incremento de vistas fire-and-forget (no bloquea el render)
  void incrementView(prisma, listing!.id, null, null).catch((err) => {
    logger.warn("incrementView failed in page", { slug: params.slug, error: String(err) });
  });

  return <ListingDetailPage listing={listing!} reputation={reputation} />;
}
