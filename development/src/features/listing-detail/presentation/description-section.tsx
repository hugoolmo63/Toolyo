import type { ListingDetailDTO } from "@/types/listing-detail";

/**
 * DescriptionSection — descripción completa y características del producto.
 * Se omite si no hay descripción. Ver spec.md FR-003.
 */
interface DescriptionSectionProps {
  listing: ListingDetailDTO;
}

export function DescriptionSection({ listing }: DescriptionSectionProps) {
  if (!listing.description) return null;

  return (
    <section className="listing-description-section" aria-labelledby="description-heading">
      <h2 id="description-heading">Descripción</h2>
      <p className="listing-description-text">{listing.description}</p>
    </section>
  );
}
