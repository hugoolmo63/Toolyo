# Research: Búsqueda Pública y Página de Inicio

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-01

## Dependencia: modelo `Listing` no existe aún

**Decisión**: Esta feature introduce un modelo `Listing` mínimo con los campos necesarios para servir resultados de búsqueda pública (título, descripción, precio por día, ubicación geoespacial, estado de publicación, categoría, arrendador, fotos y disponibilidad). La feature completa de creación/gestión de listings (§2 de `docs/04-especificaciones-funcionales.md`) se hará después y extenderá este modelo con wizard de creación, precios escalonados, calendario completo, etc.

**Rationale**: El spec de `004-public-search` referencia `Listing` y `Category` como entidades reutilizadas, pero la feature de listings (§2) no se ha implementado todavía. Sin un modelo `Listing` no hay nada que buscar. Las opciones eran: (a) esperar a la feature de listings, (b) crear el modelo completo de listings aquí, o (c) crear un modelo mínimo de listing suficiente para búsqueda y dejar que la feature de listings lo extienda. La opción (c) es la que desbloquea esta feature sin inflar su alcance ni bloquear la feature de listings futura.

**Alcance del modelo mínimo**:
- Campos públicos para búsqueda: `title`, `description`, `pricePerDay`, `location` (PostGIS Point + lat/lng + dirección textual aproximada), `status` (enum `ListingStatus` con `published`, `draft`, `in_review`, `paused`, `rejected`), `categoryId`, `ownerId`.
- `ListingPhoto` para imagen principal (la feature de listings añadirá hasta 10 fotos con ordenación drag & drop; aquí solo necesitamos la primera para la tarjeta).
- `ListingAvailability` para bloqueos de calendario (la feature de listings añadirá el calendario completo; aquí solo necesitamos saber si un listing tiene disponibilidad en un rango de fechas para el filtro).
- `ratingAverage` y `reviewCount` como campos desnormalizados en `Listing` (actualizados por la feature de reviews; aquí solo se leen para ordenación y filtro).
- Soft delete (`deletedAt`) y auditoría (`createdAt`, `updatedAt`) conforme a `DATABASE.md` §7.

**Alternativas consideradas**:
- Esperar a la feature de listings: descartado porque bloquea esta feature indefinidamente y el usuario quiere avanzar con la búsqueda.
- Crear el modelo completo de listings aquí: descartado porque inflaría el alcance de esta feature con wizard de creación, precios escalonados, estados de revisión, etc. que pertenecen a §2.
- Mockear listings sin modelo real: descartado porque no permite tests de integración reales ni valida el rendimiento de las queries PostGIS.

## Proveedor de mapas: Leaflet + react-leaflet

**Decisión**: Usar Leaflet (open-source, sin API key) con react-leaflet como wrapper React. Los tiles se sirven desde OpenStreetMap por defecto, con opción de configurar un proveedor de tiles premium vía env vars en el futuro.

**Rationale**: La constitución no prescribe un proveedor de mapas concreto. Leaflet es open-source, no requiere API key, tiene un wrapper React maduro (`react-leaflet`), y es suficiente para pins con preview y zoom/pan. Evita dependencia de Google Maps API (coste, API key, lock-in). La degradación elegante (FR-017) se implementa detectando si Leaflet o los tiles no cargan y mostrando un mensaje al usuario mientras la vista de lista sigue siendo usable.

**Alternativas consideradas**:
- Google Maps: descartado por coste, API key obligatoria y lock-in.
- Mapbox: viable, mejor estética, pero requiere API key y tiene coste por uso. Se deja como mejora futura configurable vía env vars.
- MapLibre GL: viable (fork open-source de Mapbox GL), pero más complejo de integrar que Leaflet para el alcance de esta feature (pins simples con preview). Se considera para la Fase 2 si se necesitan clusters o heatmaps.

## Geocoding y autocompletado de ubicaciones: Nominatim (OpenStreetMap)

**Decisión**: Usar Nominatim (API gratuita de OpenStreetMap) para geocoding y autocompletado de ubicaciones. El autocompletado se hace desde el servidor (no desde el cliente) vía un procedimiento tRPC `search.suggest` que llama a Nominatim con debounce, cachea resultados en memoria (TTL corto) y devuelve sugerencias tipadas.

**Rationale**: La constitución no prescribe un proveedor de geocoding. Nominatim es gratuito, no requiere API key y cubre España (mercado inicial de Toolyo). Hacer la llamada desde el servidor permite: (a) no exponer la URL del proveedor al cliente, (b) cachear resultados para reducir llamadas, (c) aplicar rate limiting por IP, y (d) cambiar de proveedor en el futuro sin tocar el cliente. La política de uso de Nominatim pide max 1 req/segundo por IP; el debounce de 200ms + cache mitiga esto. Para producción con mayor volumen se migrará a un proveedor con SLA (Mapbox Geocoding, Google Places) configurable vía env vars.

**Alternativas consideradas**:
- Llamar a Nominatim desde el cliente: descartado por `SECURITY.md` §1.6 (no exponer integraciones externas al cliente) y por rate limiting.
- Google Places Autocomplete: descartado por coste y API key.
- Pre-cargar todas las ubicaciones en BD: descartado por volumen y mantenimiento.
- Usar solo categorías pre-cargadas (sin autocompletado de ubicaciones): descartado porque `SEARCH-001` exige autocompletado de ubicaciones y categorías.

## Búsqueda geoespacial: PostGIS con `ST_DWithin` y `ST_Distance`

**Decisión**: Usar la extensión PostGIS de PostgreSQL. El modelo `Listing` almacena coordenadas como `Unsupported("geometry(Point, 4326)")` (siguiendo `DATABASE.md` §5.4) más columnas `lat`/`lng` Decimal para queries rápidas sin cargar PostGIS. El filtro de distancia máxima usa `ST_DWithin` con índice GiST. La ordenación "Más cercano" usa `ST_Distance`. La distancia al usuario se calcula en el servidor y se incluye en el DTO.

**Rationale**: `DATABASE.md` §5.4 prescribe PostGIS para geoespacial. `ST_DWithin` con índice GiST es la forma eficiente de filtrar por radio. Almacenar `lat`/`lng` además del Point permite queries de fallback sin PostGIS si fuera necesario. El índice GiST sobre el campo Point hace que el filtro por distancia sea sub-lineal.

**Alternativas consideradas**:
- Fórmula de Haversine en aplicación: descartado por rendimiento (no usa índice, escaneo completo de tabla).
- Bounding box simple con `lat`/`lng`: viable para MVP pero menos preciso y sin soporte nativo para índices geoespaciales.
- Elasticsearch/Meilisearch: descartado para esta feature por complejidad operacional; `DATABASE.md` §5.3 lo contempla solo si el volumen lo justifica.

## Resultados aleatorios iniciales

**Decisión**: La carga inicial de la landing (sin criterios en la URL) ejecuta `search.initial` que devuelve listings en estado `published` ordenados con `ORDER BY random()` limitado a la primera página (24 resultados). Para mantener coherencia al paginar sobre resultados aleatorios, se estabiliza el orden usando un seed por sesión de visualización: la primera carga genera un seed aleatorio que se pasa como parámetro a las páginas siguientes, y `ORDER BY random(seed)` produce el mismo orden para ese seed.

**Rationale**: `FR-019` exige resultados desde la carga inicial sin criterios. `ORDER BY random()` es simple pero no permite paginación coherente (cada página tendría un orden nuevo, causando duplicados y pérdidas). Usar `random(seed)` con un seed por sesión de visualización resuelve esto: el seed se genera en la primera carga y se mantiene en la URL para las páginas siguientes, produciendo el mismo orden aleatorio para ese seed. Cuando el visitante aplica cualquier criterio de búsqueda, el sistema pasa a modo "búsqueda con criterios" y el seed deja de usarse (los resultados se ordenan por el criterio elegido).

**Alternativas consideradas**:
- `ORDER BY random()` sin seed: descartado por incoherencia al paginar.
- TABLESAMPLE: más eficiente para tablas grandes pero complejo de combinar con filtros. Se considera para optimización futura si el catálogo supera ~100k listings.
- Snapshot del orden en cliente (guardar IDs en memoria): descartado porque no sobrevive a recarga de página y no es compartible vía URL.
- Resultados destacados fijos en lugar de aleatorios: descartado porque el spec exige aleatoriedad para evitar sesgo hacia un subconjunto fijo.

## Estado de búsqueda en URL: `nuqs`

**Decisión**: Usar `nuqs` (Next.js URL Query State) como fuente de verdad para el estado de búsqueda: término, ubicación (texto + lat/lng), categoría, filtros (rango de fechas, precio máximo, distancia máxima, rating mínimo, solo verificados), ordenación, vista (grid/lista) y página. Todos los cambios actualizan la URL sin recargar la página.

**Rationale**: `FRONTEND.md` §10 prescribe `nuqs` para parámetros de búsqueda en URL. `FR-012` exige que el estado se refleje en la URL para ser compartible y restaurable al recargar o navegar atrás/adelante. `nuqs` integra con App Router y permite tipar los query params con Zod. El Server Component de la landing lee los params de la URL en el primer render para precargar resultados; los Client Components actualizan los params al interactuar.

**Alternativas consideradas**:
- `useSearchParams` nativo de Next.js: viable pero más verboso y sin tipado. `nuqs` añade tipado, serialización y sincronión con el historial.
- Estado en Zustand + sync manual con URL: descartado por duplicación de fuente de verdad y complejidad de sincronización.
- Estado solo en cliente sin URL: descartado por `FR-012` (no es compartible ni restaurable).

## Paginación adaptativa: infinite scroll en móvil, numerada en desktop

**Decisión**: Detectar el dispositivo en el cliente (breakpoint Tailwind `md`) para elegir el modo de paginación. En móvil, usar `useInfiniteQuery` de React Query con `IntersectionObserver` para cargar más resultados al hacer scroll. En desktop, usar `useQuery` con paginación numerada (página actual en la URL vía `nuqs`). Ambos modos usan el mismo procedimiento tRPC `search.query` con un parámetro `cursor` (para infinite scroll) o `page` (para paginación numerada). Límite de resultados cargados en móvil: 200 (10 páginas de 20); llegado a ese límite, se muestra paginación numerada como fallback.

**Rationale**: `FR-011` exige paginación adaptativa. React Query soporta ambos modos nativamente. `IntersectionObserver` es eficiente para detectar scroll sin polling. El límite de 200 resultados en móvil evita degradación de rendimiento por DOM excesivo. El mismo endpoint sirve ambos modos, diferenciando solo el parámetro de paginación.

**Alternativas consideradas**:
- Solo infinite scroll en ambos: descartado porque `SEARCH-007` especifica paginación numerada en desktop.
- Solo paginación numerada en ambos: descartado porque `SEARCH-007` especifica infinite scroll en móvil.
- Detectar dispositivo en servidor (User-Agent): descartado por fiabilidad; el breakpoint de Tailwind es más fiable.

## Filtro de rango de fechas: `ListingAvailability`

**Decisión**: El filtro de rango de fechas (recogida/devolución) filtra listings que tienen disponibilidad confirmada en al menos parte del rango solicitado. Se implementa consultando `ListingAvailability` (que registra bloqueos de calendario): un listing pasa el filtro si no tiene ningún bloqueo que solape con el rango solicitado. Si el visitante no aplica rango de fechas, el filtro no se aplica.

**Rationale**: `SEARCH-003` incluye rango de fechas como filtro. La feature de listings (§2) definirá el calendario completo con bloqueos manuales; aquí solo necesitamos la tabla `ListingAvailability` para saber si un listing está bloqueado en un rango. Un listing sin ningún registro en `ListingAvailability` se considera disponible siempre (no tiene bloqueos).

**Alternativas consideradas**:
- No implementar filtro de fechas en esta feature: descartado porque `SEARCH-003` lo incluye como filtro de prioridad Alta.
- Calendario completo con disponibilidad por día: descartado por alcance (pertenece a la feature de listings §2 y al detalle del producto §3.3).

## Rate limiting de búsqueda

**Decisión**: Reutilizar `consumeRateLimit` de `src/server/auth/rate-limit.service.ts` con dos buckets: `search:ip:<ip>` (100 req/min, alineado con `SECURITY.md` §5.2 APIs generales) para `search.query` y `search.mapBounds`, y `suggest:ip:<ip>` (60 req/min, más restrictivo por la llamada a Nominatim) para `search.suggest`.

**Rationale**: `SECURITY.md` §5.2 exige rate limiting por IP para APIs generales (100 req/min). El autocompletado llama a Nominatim y necesita un límite más estricto para respetar la política de uso de Nominatim (max 1 req/segundo). El cache en memoria mitiga el número de llamadas reales a Nominatim.

**Alternativas consideradas**:
- Sin rate limiting: descartado por `SECURITY.md` §5.2.
- Rate limiting solo en autocompletado: descartado porque `search.query` también es público y puede ser abusado.
- Redis como store: diferido a multiinstancia; `RATE_LIMIT_STORE=memory` es suficiente para desarrollo y monoinstancia, consistente con `002-registration` y `003-login`.

## Degradación elegante del mapa

**Decisión**: El `MapView` (Client Component) carga Leaflet dinámicamente con `next/dynamic` (sin SSR, ya que Leaflet accede a `window`). Si la carga del script de Leaflet o de los tiles falla (timeout o error de red), se captura el error y se muestra un mensaje "Mapa no disponible temporalmente" mientras la vista de lista sigue siendo usable. El visitante puede alternar a vista de lista sin perder los resultados.

**Rationale**: `FR-017` exige degradación elegante del mapa. Cargar Leaflet con `next/dynamic` evita errores de SSR (Leaflet necesita `window`). El error boundary de React captura fallos de carga y muestra el mensaje de fallback.

**Alternativas consideradas**:
- SSR de Leaflet: descartado porque Leaflet accede a `window` y no es compatible con SSR.
- Mapa como iframe: descartado por falta de control sobre interacción (pins, preview).

## Testing

**Decisión**: Unitarios para `search.service` (lógica de filtros, ordenación, mapeo a DTO, generación de seed aleatorio), unitarios para `search.schema` (validación Zod de inputs), integración con Testcontainers + PostGIS para `search.router` (búsqueda real, filtros combinados, ordenación, mapa, aleatoriedad con seed, paginación), y E2E con Playwright para el flujo `landing → buscar → filtrar → ver resultado → mapa`. axe-core para accesibilidad de la barra de búsqueda, filtros y mapa.

**Rationale**: Alineado con `constitution/TESTING.md`: unitarios para lógica pura, integración con DB real para routers, E2E para flujos críticos. PostGIS en Testcontainers requiere la imagen `postgis/postgis` en lugar de `postgres` estándar.

**Alternativas consideradas**: Mockear PostGIS en integración, descartado por la constitución (no mockear DB en integración).
