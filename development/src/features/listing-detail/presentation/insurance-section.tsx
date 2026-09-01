import type { ListingDetailDTO } from "@/types/listing-detail";

/**
 * InsuranceSection — información informativa del seguro aplicable.
 * Condicional a la verificación del arrendador. Informativo, sin contratar
 * ni gestionar reclamaciones (eso corresponde al módulo §7). Ver spec.md FR-014.
 */
interface InsuranceSectionProps {
  listing: ListingDetailDTO;
}

export function InsuranceSection({ listing }: InsuranceSectionProps) {
  if (listing.owner.isVerified) {
    return (
      <section className="insurance-section" aria-labelledby="insurance-heading">
        <h2 id="insurance-heading">Seguro incluido</h2>
        <p className="insurance-info">
          Este alquiler incluye seguro de plataforma. La cobertura y franquicia
          aplicables se muestran al confirmar la reserva.
        </p>
        <p className="insurance-note">
          Información informativa. La contratación y gestión de reclamaciones
          se realiza a través del seguro de plataforma.
        </p>
      </section>
    );
  }

  return (
    <section className="insurance-section insurance-section-warning" aria-labelledby="insurance-heading">
      <h2 id="insurance-heading">Seguro</h2>
      <p className="insurance-warning">
        El alquiler no incluye seguro de plataforma porque el arrendador no ha
        verificado su identidad.
      </p>
    </section>
  );
}
