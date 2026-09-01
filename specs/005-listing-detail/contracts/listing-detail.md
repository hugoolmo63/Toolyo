# Contract: Página de Detalle del Producto

Los routers tRPC son delgados: validan con Zod, usan el procedimiento adecuado y delegan en servicios. Los payloads de salida nunca contienen datos privados (email, teléfono, dirección exacta, datos de pago) ni objetos Prisma crudos; el servicio mapea a `ListingDetailDTO` / `SimilarListingDTO` con solo campos públicos.

Todos los procedimientos de detalle son **públicos** (`publicProcedure`): no requieren sesión ni identificación, conforme a `FR-001`. El procedimiento `listing.incrementView` es una mutación pública justificada (contador público, no sensible, deduplicado por IP/sesión).

## Procedimientos de aplicación

### `listing.getBySlug`

**Acceso**: público.

**Entrada**:

```ts
{
  slug: string;           // slug del listing (kebab-case)
}
```

**Salida**: `ListingDetailDTO | null`:

```ts
{
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pricePerDay: number;          // EUR
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
  owner: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    ratingAverage: number | null;
    responseTimeHours: number | null;
    transactionCount: number | null;
  };
  photos: {
    id: string;
    url: string;
    altText: string | null;
    order: number;
  }[];
  availability: string[];       // fechas bloqueadas futuras en ISO date (YYYY-MM-DD)
  priceTiers: {                 // tramos derivados desde pricePerDay
    days: number;               // 1, 3, 7
    discountPercent: number;    // 0, 5, 10
    pricePerDay: number;        // pricePerDay × (1 - discountPercent/100)
    total: number;              // pricePerDay × days
    label: string;              // "1 día", "3 días", "7 días"
  }[];
} | null
```

**Reglas**:
- Buscar listing por `slug` donde `status = published` AND `deletedAt IS NULL`.
- Si no existe, o si su `owner` tiene `accountStatus != active` OR `deletedAt IS NOT NULL`, devolver `null` (el Server Component llama a `notFound()` → 404).
- Incluir `photos` ordenadas por `order` ASC, filtrando `deletedAt IS NULL`.
- Incluir `availability` como array de fechas bloqueadas futuras (`blockedDate >= CURRENT_DATE`) en formato ISO date.
- Incluir `owner` con campos públicos: `id`, `displayName` (null si no existe), `avatarUrl` (null si no existe), `isVerified` (derivado de `VerificationState` con `channel = identity` AND `status = verified`), `ratingAverage`/`responseTimeHours`/`transactionCount` (null si no existen en el modelo actual).
- Incluir `category` con `id`, `name`, `slug`.
- Calcular `priceTiers` derivados desde `pricePerDay` (tramos 1d/3d/7d con descuentos 0%/5%/10%) en el servicio (función pura `derivePriceTiers`).
- Nunca devolver `owner.emailNormalized`, `owner.phoneE164`, dirección exacta ni datos de pago.
- Aplicar rate limit `listing:ip:<ip>` (100/min).
- Disparar `listing.incrementView` de forma no bloqueante tras obtener el detalle (fire-and-forget desde el cliente o desde el servicio con deduplicación).

**Errores públicos**: `validation_error` (400 si el slug no es válido), `rate_limited` (429 con `retryAfterSeconds`).

### `listing.getSimilar`

**Acceso**: público.

**Entrada**:

```ts
{
  listingId: string;      // cuid del listing actual
  categoryId: string;     // cuid de la categoría del listing actual
  city: string | null;    // ciudad del listing actual (opcional)
  lat: number | null;     // latitud del listing actual (opcional, para similares por zona)
  lng: number | null;     // longitud del listing actual (opcional)
  limit?: number;         // default 6, max 12
}
```

**Salida**: `SimilarListingDTO[]`:

```ts
{
  id: string;
  slug: string;
  title: string;
  pricePerDay: number;
  primaryPhotoUrl: string | null;
  ratingAverage: number;
  reviewCount: number;
  city: string | null;
}[]
```

**Reglas**:
- Excluir el listing actual (`id != listingId`).
- Filtrar listings `published` AND `deletedAt IS NULL` con owner `active` (mismo `BASE_WHERE` que la búsqueda).
- Priorizar por: (1) misma categoría (`categoryId = input.categoryId`), (2) misma ciudad (`city = input.city`), (3) misma zona (PostGIS `ST_DWithin` con radio 50km si `lat`/`lng` están presentes).
- Ordenar por `ratingAverage DESC, reviewCount DESC` (relevancia) y limitar a `limit` (default 6, max 12).
- Devolver `SimilarListingDTO` con campos mínimos (sin `owner` ni `distanceKm`).
- Aplicar rate limit `listing:ip:<ip>` (100/min).

**Errores públicos**: `validation_error` (400), `rate_limited` (429 con `retryAfterSeconds`).

### `listing.incrementView`

**Acceso**: público (mutación).

**Entrada**:

```ts
{
  listingId: string;      // cuid del listing
}
```

**Salida**: `{ ok: true }` (siempre, incluso si el incremento fue deduplicado).

**Reglas**:
- Verificar que el listing existe con `status = published` AND `deletedAt IS NULL`; si no, devolver `{ ok: true }` sin incrementar (no revelar existencia).
- Deduplicar por IP (o sessionId si el visitante está logado) con ventana de 30 min: si ya se incrementó para esta combinación `listingId:ip` en los últimos 30 min, devolver `{ ok: true }` sin incrementar.
- Si no está deduplicado, ejecutar `UPDATE "Listing" SET "viewCount" = "viewCount" + 1 WHERE "id" = $1 AND "deletedAt" IS NULL` (fire-and-forget, errores silenciosos).
- Aplicar rate limit `listing:ip:<ip>` (100/min).
- La caché de deduplicación es en memoria (`Map` con TTL 30 min, clave `view:[listingId]:[ip|sessionId]`), reutilizando el patrón de `geocoding.repository.ts`.

**Errores públicos**: `validation_error` (400), `rate_limited` (429 con `retryAfterSeconds`).

## Contexto tRPC

### `createTRPCContext`

**Sin cambios**: el contexto ya carga la sesión desde la cookie si existe (`003-login`). Los procedimientos de detalle usan `publicProcedure` que no requiere `ctx.session`. Si el visitante tiene sesión, `ctx.session` está poblado y se usa para la deduplicación de vistas (sessionId) y para el gating de login en los botones Contactar/Reservar (en cliente, no en el router).

## Rate limiting

| Bucket | Límite | Procedimientos |
|--------|--------|----------------|
| `listing:ip:<ip>` | 100 req/min | `listing.getBySlug`, `listing.getSimilar`, `listing.incrementView` |

Reutiliza `consumeRateLimit` de `src/server/auth/rate-limit.service.ts` con `RATE_LIMIT_STORE=memory` (configurable a Redis para multiinstancia).

## Estado del rango de fechas en URL

El rango de fechas seleccionado (recogida y devolución) se gestiona con `nuqs` y se codifica en la URL como query params:

| Param | Tipo | Default | Notas |
|-------|------|---------|-------|
| `start` | string | null | ISO date (YYYY-MM-DD) — fecha de recogida |
| `end` | string | null | ISO date (YYYY-MM-DD) — fecha de devolución |

- La URL `/listings/[slug]` sin `start`/`end` equivale a "sin rango seleccionado" (el calendario lo muestra, el precio total no se calcula hasta seleccionar).
- Al seleccionar un rango en el calendario, los params se actualizan sin recargar la página.
- Al recargar o navegar atrás/adelante, el Server Component lee los params y el Client Component (Calendar) restaura la selección.
- El rango se preserva en el callback de login al pulsar "Reservar" (`callbackUrl=/listings/[slug]?start=...&end=...`).

## Errores públicos

- `validation_error` (400): "Los datos no son válidos." (con detalles de campos en `data`).
- `rate_limited` (429): "Demasiadas peticiones. Inténtalo de nuevo en {retryAfterSeconds} segundos."
- `not_found` (404): cuando `listing.getBySlug` devuelve `null`, el Server Component llama a `notFound()` de Next.js → renderiza `not-found.tsx` con mensaje genérico "Este producto no está disponible o no existe".

## Páginas y componentes

### Ruta `/listings/[slug]` (detalle del producto)

**Server Component** que:
- Lee el `slug` de los params de la ruta y los query params `start`/`end` de la URL (`nuqs` server-side).
- Llama a `listing.getBySlug` para precargar el detalle.
- Si devuelve `null`, llama a `notFound()` → 404 informativo.
- Si devuelve el detalle, dispara `listing.incrementView` de forma no bloqueante (fire-and-forget).
- Renderiza el layout público + el `ListingDetailPage` (Client Component) con el detalle precargado como props iniciales (para evitar flash de carga en el primer render).

### Componente `ListingDetailPage`

**Client Component** que orquesta:
- `Gallery` (carrusel, zoom, fullscreen) con las fotos precargadas.
- `ListingHeader` (título, categoría, ubicación, badges).
- `DescriptionSection` (descripción y características).
- `Calendar` (selección de rango de fechas con bloqueos) sincronizado con `?start`/`?end` vía `nuqs`.
- `PriceTable` (tramos derivados + total estimado según rango seleccionado).
- `OwnerCard` (perfil público del arrendador).
- `ActionButtons` (Contactar/Reservar con gating de login).
- `ReviewsSection` (reviews o estado vacío).
- `SimilarListings` (productos similares vía `api.listing.getSimilar.useQuery`).
- `InsuranceSection` (info de seguro o aviso).
- `RulesSection` (reglas con defaults).
- Sincroniza el rango de fechas con la URL vía `nuqs`.

### Degradación de secciones sin datos

- Sin fotos: `Gallery` muestra placeholder accesible.
- Sin descripción: `DescriptionSection` se omite.
- Sin reviews: `ReviewsSection` muestra estado vacío "Aún no hay reviews para este producto".
- Sin similares: `SimilarListings` se omite o muestra estado vacío.
- Arrendador no verificado: `InsuranceSection` muestra aviso informativo.
- Campos del owner no disponibles (displayName, avatarUrl, etc.): `OwnerCard` los omite o muestra "N/A".

### Gating de login para Contactar/Reservar

- **Contactar**: si `ctx.session` no existe (verificado en cliente), redirige a `/auth?tab=login&callbackUrl=/listings/[slug]`. Si existe, redirige a `/messages?listing=[slug]`.
- **Reservar**: si `ctx.session` no existe, redirige a `/auth?tab=login&callbackUrl=/listings/[slug]?start=...&end=...` (preserva rango). Si existe pero no hay rango válido, muestra mensaje "Selecciona un rango de fechas". Si hay rango válido, redirige a `/checkout?listing=[slug]&start=...&end=...`.
- Si `/messages` o `/checkout` no existen (módulos §5/§4 no construidos), las páginas destino muestran un estado "Esta funcionalidad estará disponible próximamente" sin errores.
