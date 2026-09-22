import Link from "next/link";

export function ListingEmptyState() {
  return (
    <section aria-labelledby="empty-products-title" className="empty-state">
      <h2 id="empty-products-title">Todavía no tienes productos</h2>
      <p>Publica tu primer producto para empezar a ofrecerlo en alquiler.</p>
      <Link href="/dashboard/products/new" className="btn btn-primary">
        Crear producto
      </Link>
    </section>
  );
}
