/**
 * Skeleton de detalle del producto (FRONTEND.md §6.3).
 * Se muestra mientras carga el detalle en /listings/[slug].
 */
export default function ListingDetailLoading() {
  return (
    <div className="listing-detail-page" aria-busy="true">
      <div className="gallery-skeleton" />
      <div className="listing-detail-layout">
        <div className="listing-detail-main">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-block" />
        </div>
        <aside className="listing-detail-sidebar">
          <div className="skeleton-block" />
          <div className="skeleton-block" />
        </aside>
      </div>
    </div>
  );
}
