"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/trpc-react";
import { ListingCard } from "./listing-card";
import { ListingEmptyState } from "./listing-empty-state";

type ListingStatus = "draft" | "in_review" | "published" | "paused" | "rejected";

export function ListingManagementPanel({ initialData }: { initialData: { items: Array<{ id: string; slug: string; title: string; primaryPhotoUrl: string | null; category: { id: string; name: string; slug: string }; pricePerDay: string; status: ListingStatus; updatedAt: string; deletedAt: string | null }>; page: number; pageSize: number; total: number } }) {
  const [status, setStatus] = useState<ListingStatus | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(initialData.page);
  const listingsQuery = api.listingManagement.listMine.useQuery({ status, query: query || undefined, page, pageSize: initialData.pageSize }, { initialData });
  const data = listingsQuery.data ?? initialData;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

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
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Título del producto"
          />
        </label>
        <label className="field">
          Estado
          <select
            className="input"
            value={status ?? ""}
            onChange={(event) => { setStatus((event.target.value || undefined) as ListingStatus | undefined); setPage(1); }}
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
      {data.items.length === 0 ? <ListingEmptyState /> : <div className="listing-cards">{data.items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
      {pages > 1 && (
        <nav aria-label="Paginación de productos" className="pagination">
          <button type="button" className="pagination-btn" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</button>
          <span className="pagination-info">Página {page} de {pages}</span>
          <button type="button" className="pagination-btn" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Siguiente</button>
        </nav>
      )}
    </section>
  );
}
