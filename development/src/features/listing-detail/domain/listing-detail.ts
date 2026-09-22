/**
 * Tipos de dominio del detalle de listing (005-listing-detail).
 * Solo campos públicos — nunca expone email, teléfono, dirección exacta ni datos de pago.
 * Ver data-model.md y contracts/listing-detail.md.
 */

/** Información pública del arrendador en el detalle. */
export interface OwnerDTO {
  id: string;
  /** null hasta que la feature de perfil §1.2 introduzca displayName. */
  displayName: string | null;
  /** null hasta que la feature de perfil §1.2 introduzca avatarUrl. */
  avatarUrl: string | null;
  /** Derivado de VerificationState con channel=identity AND status=verified. */
  isVerified: boolean;
  /** null hasta que la feature de perfil §1.2 introduzca ratingAverage. */
  ratingAverage: number | null;
  /** null hasta que la feature de perfil §1.2 introduzca responseTimeHours. */
  responseTimeHours: number | null;
  /** null hasta que la feature de perfil §1.2 introduzca transactionCount. */
  transactionCount: number | null;
}

/** Foto de un listing en el detalle (ordenada por `order` ASC). */
export interface ListingPhotoDTO {
  id: string;
  url: string;
  altText: string | null;
  order: number;
}

export interface ListingReviewDTO {
  id: string;
  author: { id: string; displayName: string | null; avatarUrl: string | null };
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Tramo de precio derivado desde pricePerDay (no persistido). */
export interface PriceTierDTO {
  /** Días del tramo: 1, 3 o 7. */
  days: number;
  /** Descuento aplicado sobre pricePerDay: 0, 5 o 10 (%). */
  discountPercent: number;
  /** Precio por día efectivo: pricePerDay × (1 - discountPercent/100). */
  pricePerDay: number;
  /** Total del tramo: pricePerDay × days. */
  total: number;
  /** Etiqueta legible: "1 día", "3 días", "7 días". */
  label: string;
}

/** DTO público completo del detalle de un listing. */
export interface ListingDetailDTO {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  /** EUR, derivado de Decimal. */
  pricePerDay: number;
  location: { lat: number; lng: number } | null;
  /** Dirección aproximada, no exacta. */
  addressText: string | null;
  city: string | null;
  /** 0-5. */
  ratingAverage: number;
  reviewCount: number;
  viewCount: number;
  isInstantBooking: boolean;
  /** ISO timestamp. */
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    parentName: string | null;
  };
  owner: OwnerDTO;
  photos: ListingPhotoDTO[];
  /** Fechas bloqueadas futuras en ISO date (YYYY-MM-DD). */
  availability: string[];
  /** Tramos derivados desde pricePerDay. */
  priceTiers: PriceTierDTO[];
  reviews: ListingReviewDTO[];
}

/** DTO mínimo para renderizar tarjetas de productos similares. */
export interface SimilarListingDTO {
  id: string;
  slug: string;
  title: string;
  pricePerDay: number;
  primaryPhotoUrl: string | null;
  ratingAverage: number;
  reviewCount: number;
  city: string | null;
}

/** Resultado del cálculo de precio para un rango seleccionado (puro, sin DB). */
export interface PriceEstimate {
  days: number;
  applicableTier: PriceTierDTO;
  pricePerDay: number;
  total: number;
  /** false si el rango incluye fechas bloqueadas. */
  isValid: boolean;
  /** Fechas bloqueadas dentro del rango (ISO date). */
  blockedDatesInRange: string[];
}
