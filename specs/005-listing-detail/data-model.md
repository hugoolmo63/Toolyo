# Data Model: Página de Detalle del Producto

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-01

## Sin cambios en el schema Prisma

Esta feature **no introduce cambios en el schema Prisma** ni crea migraciones. Reutiliza los modelos existentes de `004-public-search` y `002-registration`:

- `Listing` (de `004-public-search`) — fuente principal del detalle.
- `ListingPhoto` (de `004-public-search`) — alimenta la galería.
- `ListingAvailability` (de `004-public-search`) — alimenta el calendario de disponibilidad.
- `User` (de `002-registration`) — perfil público del arrendador.
- `VerificationState` (de `002-registration`) — badge de verificado.
- `Category` (del scaffold existente) — categoría del listing y productos similares.

El único efecto de escritura es el incremento del contador `viewCount` en `Listing` (operación `UPDATE "Listing" SET "viewCount" = "viewCount" + 1 WHERE "id" = $1 AND "deletedAt" IS NULL`), justificado en `research.md`.

## Entidades reutilizadas (sin cambios)

### Listing (de `004-public-search`)

Se consulta por `slug` para servir el detalle público. Solo se sirve si `status = published` AND `deletedAt IS NULL` AND `owner.accountStatus = active` AND `owner.deletedAt IS NULL`. Se exponen los campos públicos: `id`, `slug`, `title`, `description`, `pricePerDay`, `lat`, `lng`, `addressText` (dirección aproximada, no exacta), `city`, `ratingAverage`, `reviewCount`, `viewCount`, `isInstantBooking`, `createdAt`, `ownerId`, `categoryId`.

**Reglas de negocio para el detalle**:
- Solo listings con `status = published` AND `deletedAt IS NULL` aparecen en el detalle público.
- Solo listings cuyo `owner` tiene `accountStatus = active` AND `deletedAt IS NULL` aparecen en el detalle público.
- Cualquier otro caso (no existe, borrador, en revisión, pausado, rechazado, eliminado, owner suspendido/eliminado) devuelve `null` → el Server Component llama a `notFound()` → 404 informativo.
- `viewCount` se incrementa al renderizar el detalle público (con deduplicación por IP/sesión en ventana de 30 min, ver `research.md`).
- `addressText` se muestra solo si el arrendador lo configuró; nunca se muestra la dirección exacta (privacidad del arrendador, `SECURITY.md` §4.1).

### ListingPhoto (de `004-public-search`)

Se consultan todas las fotos del listing ordenadas por `order` ASC, filtrando `deletedAt IS NULL`. Alimentan la galería de imágenes (carrusel, zoom, fullscreen). Cada foto expone `url` y `altText` (para accesibilidad). Si el listing no tiene fotos, la galería muestra un placeholder accesible.

### ListingAvailability (de `004-public-search`)

Se consultan todos los bloqueos futuros del listing (`blockedDate >= CURRENT_DATE`) en una sola query, filtrando `deletedAt IS NULL` implícito (la tabla no tiene `deletedAt`, pero se filtra por `listingId`). Alimentan el calendario de disponibilidad: las fechas bloqueadas se marcan como no disponibles. Un listing sin registros en `ListingAvailability` se considera disponible siempre.

### User / VerificationState (de `002-registration`)

Se consulta el `owner` del listing para el perfil público. Solo se exponen campos públicos:
- `id` (para avatar/nombre en futura feature de perfil).
- `displayName` (derivado; el modelo actual no tiene `displayName` explícito — ver nota abajo).
- `avatarUrl` (derivado; el modelo actual no tiene `avatarUrl` explícito — ver nota abajo).
- `isVerified` (derivado de `VerificationState` con `channel = identity` AND `status = verified`).
- `ratingAverage` (no existe en `User` actualmente — se omite o se muestra como "N/A" hasta que la feature de perfil lo añada).
- `responseTimeHours` (no existe en `User` actualmente — se omite o se muestra como "N/A").
- `transactionCount` (no existe en `User` actualmente — se omite o se muestra como "N/A").

**Nota sobre campos del arrendador no existentes**: El modelo `User` actual no tiene `displayName`, `avatarUrl`, `ratingAverage`, `responseTimeHours` ni `transactionCount`. Esta feature muestra estos campos **si existieran** (mapeo defensivo) y los omite con un estado neutro ("N/A" o sección oculta) si no existen. La introducción de estos campos pertenece a la feature de perfil de usuario (§1.2, PROF-002), no a esta feature. Mientras no existan, el `OwnerDTO` los marca como `null` y la UI los omite o muestra un placeholder neutro.

**Nunca se exponen**: `emailNormalized`, `phoneE164`, `passwordCredential`, `oauthAccounts`, `identityVerifications`, `legalAcceptances`, `securityEvents`, `sessions`, datos de pago.

### Category (del scaffold existente)

Se consulta la `category` del listing para mostrar el nombre de la categoría en la ficha. También se usa para productos similares (listings con `categoryId = currentCategoryId`).

## DTOs de dominio (nuevos, sin persistencia)

### ListingDetailDTO

DTO público completo del detalle de un listing. Solo campos públicos, sin datos privados.

```ts
interface ListingDetailDTO {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pricePerDay: number;          // EUR, derivado de Decimal
  location: { lat: number; lng: number } | null;
  addressText: string | null;   // dirección aproximada, no exacta
  city: string | null;
  ratingAverage: number;        // 0-5
  reviewCount: number;
  viewCount: number;
  isInstantBooking: boolean;
  createdAt: string;            // ISO timestamp
  category: {
    id: string;
    name: string;
    slug: string;
  };
  owner: OwnerDTO;
  photos: ListingPhotoDTO[];    // ordenadas por `order` ASC
  availability: string[];       // fechas bloqueadas en ISO date (YYYY-MM-DD), solo futuras
  // Tramos de precios derivados (no persistidos)
  priceTiers: PriceTierDTO[];
}

interface OwnerDTO {
  id: string;
  displayName: string | null;     // null si no existe en el modelo actual
  avatarUrl: string | null;       // null si no existe en el modelo actual
  isVerified: boolean;
  ratingAverage: number | null;   // null si no existe en el modelo actual
  responseTimeHours: number | null; // null si no existe en el modelo actual
  transactionCount: number | null;  // null si no existe en el modelo actual
}

interface ListingPhotoDTO {
  id: string;
  url: string;
  altText: string | null;
  order: number;
}

interface PriceTierDTO {
  days: number;                  // 1, 3, 7
  discountPercent: number;       // 0, 5, 10
  pricePerDay: number;           // pricePerDay × (1 - discountPercent/100)
  total: number;                 // pricePerDay × days
  label: string;                 // "1 día", "3 días", "7 días"
}
```

### SimilarListingDTO

DTO mínimo para renderizar tarjetas de productos similares. Reutiliza la estructura de `SearchResultDTO` simplificada.

```ts
interface SimilarListingDTO {
  id: string;
  slug: string;
  title: string;
  pricePerDay: number;
  primaryPhotoUrl: string | null;
  ratingAverage: number;
  reviewCount: number;
  city: string | null;
}
```

### PriceEstimate

Resultado del cálculo de precio para un rango seleccionado. Calculado en `domain/price-tiers.ts` (puro, sin DB).

```ts
interface PriceEstimate {
  days: number;
  applicableTier: PriceTierDTO;
  pricePerDay: number;           // precio/día efectivo según tramo aplicable
  total: number;                 // pricePerDay × days
  isValid: boolean;              // false si el rango incluye fechas bloqueadas
  blockedDatesInRange: string[]; // fechas bloqueadas dentro del rango (ISO date)
}
```

## Lógica de tramos derivados (sin persistencia)

La lógica de tramos derivados vive en `domain/price-tiers.ts` como funciones puras, testeables unitariamente sin DB:

```ts
const PRICE_TIERS = [
  { days: 1, discountPercent: 0 },
  { days: 3, discountPercent: 5 },
  { days: 7, discountPercent: 10 },
] as const;

function derivePriceTiers(pricePerDay: number): PriceTierDTO[];
function getApplicableTier(days: number, tiers: PriceTierDTO[]): PriceTierDTO;
function calculatePriceEstimate(
  pricePerDay: number,
  startDate: string,
  endDate: string,
  blockedDates: string[],
): PriceEstimate;
```

**Reglas**:
- `derivePriceTiers(pricePerDay)` devuelve los 3 tramos (1d, 3d, 7d) con precio/día y total calculados.
- `getApplicableTier(days, tiers)` devuelve el tramo aplicable para N días:
  - N ≤ 1 → tramo 1 día (0% descuento)
  - 2 ≤ N ≤ 3 → tramo 3 días (5% descuento)
  - N ≥ 4 → tramo 7 días (10% descuento)
- `calculatePriceEstimate(...)` calcula el total para un rango, valida contra fechas bloqueadas, y devuelve `isValid: false` con `blockedDatesInRange` si el rango incluye bloqueos.

## Diagrama de relaciones (sin cambios)

```text
User 1───N Listing
Category 1───N Listing
Listing 1───N ListingPhoto
Listing 1───N ListingAvailability
User 1───N VerificationState (reutilizada)
```

## Notas sobre la extensión a futuras features

- **Feature de listings (§2)**: introducirá `ListingPriceTier` (tramos persistidos), `cancellationPolicy`, `pickupReturnHours`, `minDays`, wizard de creación, hasta 10 fotos con drag & drop. Esta feature ya renderiza tramos derivados y reglas con defaults; cuando §2 exista, el servicio podrá preferir tramos persistidos y reglas configuradas, cayendo a los derivados/defaults si no existen.
- **Feature de reviews (§6)**: introducirá el modelo `Review` y su flujo de creación. Esta feature ya renderiza la sección de reviews con estado vacío; cuando §6 exista, el servicio podrá leer reviews reales y mapearlas a la sección.
- **Feature de perfil de usuario (§1.2)**: introducirá `displayName`, `avatarUrl`, `ratingAverage`, `responseTimeHours`, `transactionCount` en `User`. Esta feature ya los mapea defensivamente (null si no existen); cuando §1.2 exista, el `OwnerDTO` los poblará.
- **Feature de chat (§5)**: introducirá la ruta `/messages` y el módulo de mensajería. Esta feature ya enruta a `/messages?listing=[slug]` desde el botón "Contactar"; cuando §5 exista, el entry-point funcionará end-to-end.
- **Feature de reservas/pagos (§4)**: introducirá la ruta `/checkout` y el módulo de reservas. Esta feature ya enruta a `/checkout?listing=[slug]&start=...&end=...` desde el botón "Reservar"; cuando §4 exista, el entry-point funcionará end-to-end.
- **Feature de seguros (§7)**: introducirá la gestión de seguros. Esta feature ya muestra información informativa del seguro; cuando §7 exista, la sección podrá mostrar datos reales de cobertura y franquicia.
