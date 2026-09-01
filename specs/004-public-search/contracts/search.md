# Contract: Búsqueda Pública

Los routers tRPC son delgados: validan con Zod, usan el procedimiento adecuado y delegan en servicios. Los payloads de salida nunca contienen datos privados (email, teléfono, dirección exacta, datos de pago) ni objetos Prisma crudos; el servicio mapea a `SearchResultDTO` con solo campos públicos.

Todos los procedimientos de búsqueda son **públicos** (`publicProcedure`): no requieren sesión ni identificación, conforme a `FR-001` y `FR-018`.

## Procedimientos de aplicación

### `search.initial`

**Acceso**: público.

**Entrada**:

```ts
{
  seed?: number;   // seed de aleatoriedad para estabilizar paginación sobre resultados aleatorios
  limit?: number;  // default 24, max 48
}
```

**Salida**: `SearchResultsPage` (mismo tipo que `search.query`).

**Reglas**: devolver listings en estado `published` AND `deletedAt IS NULL` cuyo `owner` tenga `accountStatus = active` AND `deletedAt IS NULL`, ordenados con `ORDER BY random(seed)` si se proporciona seed (para coherencia al paginar) o `ORDER BY random()` si no (primera carga). Si no hay listings publicados, devolver `{ items: [], total: 0, hasMore: false }` sin error. Aplicar rate limit `search:ip:<ip>` (100/min).

**Errores públicos**: `rate_limited` (429 con `retryAfterSeconds`).

### `search.query`

**Acceso**: público.

**Entrada**:

```ts
{
  // Criterios de búsqueda (todos opcionales; si todos son null/undefined, equivale a search.initial)
  query?: string;           // término de búsqueda libre (título/descripción, full-text)
  location?: {
    lat: number;            // -90 a 90
    lng: number;            // -180 a 180
    text: string;           // texto de la ubicación seleccionada (para display)
  };
  categoryId?: string;      // cuid de la categoría
  dateRange?: {
    startDate: string;      // ISO date (YYYY-MM-DD)
    endDate: string;        // ISO date (YYYY-MM-DD)
  };
  maxPricePerDay?: number;  // precio máximo por día en EUR
  maxDistanceKm?: number;   // distancia máxima en km desde location (requiere location)
  minRating?: number;       // rating mínimo (1-5)
  onlyVerified?: boolean;   // solo arrendadores verificados
  // Ordenación
  sortBy?: "relevance" | "nearest" | "price_asc" | "price_desc" | "best_rated" | "most_popular";  // default "relevance"
  // Paginación
  page?: number;            // paginación numerada (desktop), 1-based
  cursor?: string;          // cursor para infinite scroll (móvil)
  seed?: number;            // seed de aleatoriedad (solo relevante si no hay sortBy o sortBy = "relevance" sin otros criterios)
  limit?: number;           // default 24, max 48
}
```

**Salida**: `SearchResultsPage`:

```ts
{
  items: SearchResultDTO[];
  total: number;            // total de resultados que cumplen los criterios
  hasMore: boolean;         // si hay más páginas (para infinite scroll)
  nextCursor: string | null; // cursor para la siguiente página (infinite scroll)
  page: number;             // página actual (paginación numerada)
  totalPages: number;       // total de páginas (paginación numerada)
  seed: number | null;      // seed usado (si aplica), para mantener coherencia al paginar aleatorios
}
```

**`SearchResultDTO`** (solo campos públicos):

```ts
{
  id: string;               // listing id
  slug: string;
  title: string;
  pricePerDay: number;      // EUR
  primaryPhotoUrl: string | null;
  ratingAverage: number;    // 0-5
  reviewCount: number;
  distanceKm: number | null; // distancia al usuario si hay location, null si no
  city: string | null;
  location: { lat: number; lng: number } | null;  // coordenadas para el mapa
  owner: {
    id: string;
    displayName: string;    // nombre público (no email)
    avatarUrl: string | null;
    isVerified: boolean;    // badge de verificación de identidad
  };
}
```

**Reglas**:
- Filtrar listings con `status = published` AND `deletedAt IS NULL`.
- Filtrar arrendadores con `accountStatus = active` AND `deletedAt IS NULL`.
- Si `categoryId`, filtrar por categoría (incluye subcategorías si la categoría tiene hijos).
- Si `dateRange`, excluir listings con bloqueos en `ListingAvailability` que solapen el rango.
- Si `maxPricePerDay`, filtrar `pricePerDay <= maxPricePerDay`.
- Si `maxDistanceKm` AND `location`, filtrar con `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, maxDistanceKm * 1000)`.
- Si `minRating`, filtrar `ratingAverage >= minRating`.
- Si `onlyVerified`, filtrar listings cuyo owner tenga `VerificationState` con `channel = identity` AND `status = verified`.
- Si `query`, filtrar por título/descripción (ILIKE o full-text con `to_tsvector`).
- Ordenación según `sortBy`:
  - `relevance`: combinación de cercanía, rating, popularidad (algoritmo en servicio; si no hay criterios, usa `random(seed)`).
  - `nearest`: `ORDER BY ST_Distance(location, point)` (requiere `location`).
  - `price_asc` / `price_desc`: `ORDER BY pricePerDay`.
  - `best_rated`: `ORDER BY ratingAverage DESC, reviewCount DESC`.
  - `most_popular`: `ORDER BY viewCount DESC, reviewCount DESC`.
- Si no hay `sortBy` y no hay criterios (modo inicial), usar `ORDER BY random(seed)`.
- Paginación: si `cursor`, usar cursor-based (infinite scroll); si `page`, usar offset-based (paginación numerada).
- Calcular `distanceKm` para cada resultado si `location` está presente.
- Aplicar rate limit `search:ip:<ip>` (100/min).
- Nunca devolver `owner.email`, `owner.phone`, `addressText` exacto ni datos de pago.

**Errores públicos**: `validation_error` (400), `rate_limited` (429 con `retryAfterSeconds`).

### `search.suggest`

**Acceso**: público.

**Entrada**:

```ts
{
  query: string;            // texto parcial (mín 2 chars para disparar autocompletado)
  type?: "all" | "locations" | "categories";  // default "all"
  limit?: number;           // default 6, max 12
}
```

**Salida**: `Suggestions`:

```ts
{
  locations: LocationSuggestion[];
  categories: CategorySuggestion[];
}
```

**`LocationSuggestion`**:

```ts
{
  text: string;             // nombre de la ubicación (ej. "Madrid, España")
  lat: number;
  lng: number;
  type: string;             // tipo de lugar (city, town, suburb, etc.)
}
```

**`CategorySuggestion`**:

```ts
{
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}
```

**Reglas**:
- Si `type` es `"all"` o `"locations"`: llamar a Nominatim con `q = query + ", España"` (mercado inicial) y `limit = 6`; cachear resultados en memoria (TTL 5 min) para reducir llamadas; devolver sugerencias tipadas.
- Si `type` es `"all"` o `"categories"`: buscar en `Category` donde `name ILIKE '%query%'` (insensible a mayúsculas y diacríticos), `showInNav = true`, `deletedAt IS NULL`, limit 6.
- Aplicar rate limit `suggest:ip:<ip>` (60/min, más restrictivo por Nominatim).
- Tolerar typos y ser insensible a mayúsculas y diacríticos en español (normalizar con `unaccent` o equivalente en aplicación).

**Errores públicos**: `validation_error` (400), `rate_limited` (429 con `retryAfterSeconds`).

### `search.mapBounds`

**Acceso**: público.

**Entrada**:

```ts
{
  bounds: {
    north: number;          // latitud máxima
    south: number;          // latitud mínima
    east: number;           // longitud máxima
    west: number;           // longitud mínima
  };
  // Mismos filtros que search.query (opcionales)
  query?: string;
  categoryId?: string;
  dateRange?: { startDate: string; endDate: string };
  maxPricePerDay?: number;
  minRating?: number;
  onlyVerified?: boolean;
  limit?: number;           // default 100, max 200 (pins en mapa)
}
```

**Salida**: `MapPin[]`:

```ts
{
  id: string;               // listing id
  lat: number;
  lng: number;
  title: string;
  pricePerDay: number;
  primaryPhotoUrl: string | null;
  ratingAverage: number;
}[]
```

**Reglas**:
- Filtrar listings dentro del bounding box (`lat` BETWEEN south AND north, `lng` BETWEEN west AND east) con los mismos filtros que `search.query` (excepto `maxDistanceKm` que no aplica aquí).
- Solo listings `published` AND `deletedAt IS NULL` con owner `active`.
- Limitar a `limit` resultados (default 100, max 200) para no sobrecargar el mapa.
- Devolver solo campos mínimos para renderizar pins (sin `owner` ni `distanceKm`).
- Aplicar rate limit `search:ip:<ip>` (100/min).

**Errores públicos**: `validation_error` (400), `rate_limited` (429 con `retryAfterSeconds`).

## Contexto tRPC

### `createTRPCContext`

**Sin cambios**: el contexto ya carga la sesión desde la cookie si existe (`003-login`). Los procedimientos de búsqueda usan `publicProcedure` que no requiere `ctx.session`. Si el visitante tiene sesión, `ctx.session` está poblado pero la búsqueda no lo usa para filtrar (es pública para todos).

## Rate limiting

| Bucket | Límite | Procedimientos |
|--------|--------|----------------|
| `search:ip:<ip>` | 100 req/min | `search.initial`, `search.query`, `search.mapBounds` |
| `suggest:ip:<ip>` | 60 req/min | `search.suggest` |

Reutiliza `consumeRateLimit` de `src/server/auth/rate-limit.service.ts` con `RATE_LIMIT_STORE=memory` (configurable a Redis para multiinstancia).

## Estado de búsqueda en URL

El estado de búsqueda se gestiona con `nuqs` y se codifica en la URL como query params:

| Param | Tipo | Default | Notas |
|-------|------|---------|-------|
| `q` | string | "" | Término de búsqueda libre |
| `loc` | string | "" | Texto de la ubicación seleccionada |
| `lat` | number | null | Latitud de la ubicación |
| `lng` | number | null | Longitud de la ubicación |
| `cat` | string | null | ID de categoría |
| `dateStart` | string | null | ISO date |
| `dateEnd` | string | null | ISO date |
| `maxPrice` | number | null | Precio máximo por día |
| `maxDist` | number | null | Distancia máxima en km |
| `minRating` | number | null | Rating mínimo (1-5) |
| `verified` | boolean | false | Solo verificados |
| `sort` | enum | "relevance" | Criterio de ordenación |
| `view` | enum | "grid" | Vista (grid/lista) |
| `page` | number | 1 | Página actual (desktop) |
| `seed` | number | null | Seed de aleatoriedad (modo inicial) |

- La URL raíz `/` sin params equivale a modo inicial (resultados aleatorios).
- Al aplicar cualquier criterio, los params se actualizan sin recargar la página.
- Al recargar o navegar atrás/adelante, el Server Component lee los params y precarga los resultados correspondientes.

## Errores públicos

- `validation_error` (400): "Los criterios de búsqueda no son válidos." (con detalles de campos en `data`).
- `rate_limited` (429): "Demasiadas búsquedas. Inténtalo de nuevo en {retryAfterSeconds} segundos."
- `not_found` (404): no aplica en búsqueda (los resultados vacíos no son error).

## Páginas y componentes

### Ruta `/` (landing de búsqueda)

**Server Component** que:
- Lee los query params de la URL (`nuqs` server-side).
- Si no hay criterios, llama a `search.initial` para precargar resultados aleatorios.
- Si hay criterios, llama a `search.query` para precargar resultados filtrados.
- Renderiza el layout público + el `SearchPage` (Client Component) con los resultados precargados como props iniciales (para evitar flash de carga en el primer render).

### Componente `SearchPage`

**Client Component** que orquesta:
- `SearchBar` con autocompletado (ubicaciones + categorías).
- `LocationDetector` (GPS o selección manual).
- `FiltersPanel` (categoría, fechas, precio, distancia, rating, verificados).
- `SortSelector`.
- `ViewToggle` (grid/lista).
- `ResultsList` (infinite scroll en móvil, paginación numerada en desktop).
- `MapView` (mapa Leaflet con pins y preview).
- `EmptyState` cuando no hay resultados.
- Sincroniza todo el estado con la URL vía `nuqs`.

### Degradación del mapa

`MapView` carga Leaflet con `next/dynamic` (sin SSR). Si la carga falla, muestra un mensaje "Mapa no disponible temporalmente" y la vista de lista sigue siendo usable.
