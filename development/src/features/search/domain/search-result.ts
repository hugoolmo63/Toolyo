/**
 * Tipos de dominio de los resultados de búsqueda (004-public-search).
 * Solo campos públicos — nunca expone email, teléfono, dirección exacta ni datos de pago.
 */

/** Información pública del arrendador en un resultado de búsqueda. */
export interface SearchResultOwner {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

/** DTO de un resultado de búsqueda individual. */
export interface SearchResultDTO {
  id: string;
  slug: string;
  title: string;
  pricePerDay: number;
  primaryPhotoUrl: string | null;
  photoUrls: string[];
  ratingAverage: number;
  reviewCount: number;
  distanceKm: number | null;
  city: string | null;
  location: { lat: number; lng: number } | null;
  owner: SearchResultOwner;
}

/** Página de resultados de búsqueda con metadatos de paginación. */
export interface SearchResultsPage {
  items: SearchResultDTO[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
  page: number;
  totalPages: number;
  seed: number | null;
}

/** Sugerencia de ubicación del autocompletado. */
export interface LocationSuggestion {
  text: string;
  lat: number;
  lng: number;
  type: string;
}

/** Sugerencia de categoría del autocompletado. */
export interface CategorySuggestion {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

/** Pin del mapa interactivo (solo campos mínimos). */
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  pricePerDay: number;
  primaryPhotoUrl: string | null;
  ratingAverage: number;
}
