"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/trpc-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { ListingCard } from "./listing-card";
import { ListingEmptyState } from "./listing-empty-state";

type ListingStatus = "draft" | "in_review" | "published" | "paused" | "rejected";

type ListingSummary = { id: string; slug: string; title: string; primaryPhotoUrl: string | null; category: { id: string; name: string; slug: string }; pricePerDay: string; status: ListingStatus; updatedAt: string; deletedAt: string | null };

interface ListingsPageData {
  items: ListingSummary[];
  page: number;
  pageSize: number;
  total: number;
}

/** Páginas extra acumuladas por scroll infinito, ligadas a los filtros activos. */
interface AccumulatedListings {
  key: string;
  items: ListingSummary[];
  hasMore: boolean;
  nextPage: number;
}

export function ListingManagementPanel({ initialData }: { initialData: ListingsPageData }) {
  const utils = api.useUtils();
  const [status, setStatus] = useState<ListingStatus | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [accumulated, setAccumulated] = useState<AccumulatedListings | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const pageSize = initialData.pageSize;
  const filtersKey = useMemo(() => JSON.stringify([status, query]), [status, query]);
  const listingsQuery = api.listingManagement.listMine.useQuery(
    { status, query: query || undefined, page: 1, pageSize },
    { initialData },
  );
  const data = listingsQuery.data ?? initialData;
  const extra = accumulated?.key === filtersKey ? accumulated : null;

  const items = useMemo(() => {
    const base = data.items;
    if (!extra) return base;
    const seen = new Set(base.map((listing) => listing.id));
    return [...base, ...extra.items.filter((listing) => !seen.has(listing.id))];
  }, [data, extra]);

  const hasMore = extra ? extra.hasMore : data.page * data.pageSize < data.total;

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = extra?.nextPage ?? 2;
      const next = await utils.listingManagement.listMine.fetch({ status, query: query || undefined, page: nextPage, pageSize });
      setAccumulated({
        key: filtersKey,
        items: [...(extra?.items ?? []), ...next.items],
        hasMore: nextPage * next.pageSize < next.total,
        nextPage: nextPage + 1,
      });
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, extra, utils, status, query, pageSize, filtersKey]);

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: hasMore && !isFetchingMore && !listingsQuery.isError,
    onLoadMore: () => void loadMore(),
  });

  return (
    <section aria-labelledby="products-title" className="listing-mgmt">
      <div className="page-header">
        <div>
          <h1 id="products-title" className="page-title">Mis productos</h1>
          <p className="page-subtitle">Gestiona los productos que ofreces en alquiler.</p>
        </div>
        <Link href="/dashboard/products/new" className="btn btn-primary">
          Crear producto
        </Link>
      </div>
      <div className="listing-mgmt-filters">
        <label className="field field-grow">
          Buscar
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Título del producto"
          />
        </label>
        <label className="field">
          Estado
          <select
            className="input"
            value={status ?? ""}
            onChange={(event) => setStatus((event.target.value || undefined) as ListingStatus | undefined)}
          >
            <option value="">Todos</option>
            <option value="draft">Borradores</option>
            <option value="published">Publicados</option>
            <option value="paused">Pausados</option>
            <option value="in_review">En revisión</option>
            <option value="rejected">Rechazados</option>
          </select>
        </label>
      </div>
      {listingsQuery.isError && <p role="alert" className="form-error">No se han podido cargar tus productos.</p>}
      {items.length === 0 ? <ListingEmptyState /> : <div className="listing-cards">{items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
      {hasMore && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-live="polite">
          <span className="loading-more">Cargando más productos...</span>
        </div>
      )}
    </section>
  );
}
