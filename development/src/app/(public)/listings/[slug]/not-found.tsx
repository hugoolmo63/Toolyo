import Link from "next/link";

/**
 * Página 404 informativa para listings no publicados/inexistentes.
 * No filtra el motivo interno (borrador vs. rechazado vs. eliminado).
 * Ver spec.md FR-017.
 */
export default function ListingNotFound() {
  return (
    <div className="listing-not-found">
      <div className="not-found-icon" aria-hidden="true">🔍</div>
      <h1>Producto no disponible</h1>
      <p>
        Este producto no está disponible o no existe. Puede que haya sido
        retirado o que el enlace no sea correcto.
      </p>
      <Link href="/" className="not-found-back-link">
        Volver a la búsqueda
      </Link>
    </div>
  );
}
