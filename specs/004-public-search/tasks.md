---

description: "Task list for Toolyo public search and landing page"
---

# Tasks: Búsqueda Pública y Página de Inicio

**Input**: Design documents from `specs/004-public-search/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/search.md](contracts/search.md), [quickstart.md](quickstart.md)

**Organization**: Las tareas siguen las capas del plan y están etiquetadas por historia de usuario cuando implementan una entrega funcional. Incluye tests porque el proyecto sigue `constitution/TESTING.md` (pirámide: unitarios + integración + E2E).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- App code lives in `development/src/`
- Tests live in `development/tests/`
- Prisma schema at `development/prisma/schema.prisma`
- Paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Añadir dependencias nuevas (`nuqs`, `leaflet`, `react-leaflet`, `@types/leaflet`), habilitar PostGIS en Docker y configurar variables de entorno para geocoding.

- [x] T001 [P] Añadir dependencias en `development/package.json`: `nuqs`, `leaflet`, `react-leaflet` y devDep `@types/leaflet`. Ejecutar `npm install` desde `development/` y verificar versiones publicadas >7 días.
- [x] T002 [P] Modificar `development/docker-compose.yml` para usar imagen `postgis/postgis` (misma versión de PG) en lugar de `postgres` estándar, verificando que la extensión PostGIS está disponible.
- [x] T003 [P] Añadir en `development/.env.example` las variables `MAP_TILES_URL` (default OpenStreetMap), `GEOCODING_PROVIDER` (default `nominatim`), `GEOCODING_BASE_URL` (default `https://nominatim.openstreetmap.org`), `SEARCH_RATE_LIMIT_PER_MIN` (default `100`), `SUGGEST_RATE_LIMIT_PER_MIN` (default `60`), y actualizar `development/src/env.mjs` para validarlas con defaults.
- [x] T004 [P] Documentar en `development/README.md` la feature de búsqueda pública, las nuevas dependencias, variables de entorno, requisito de PostGIS y el flujo de validación local referenciando `specs/004-public-search/quickstart.md`.

---

## Phase 2: Foundational - Modelo de datos, PostGIS y esquemas compartidos

**Purpose**: Crear las tablas `Listing`, `ListingPhoto`, `ListingAvailability`, habilitar PostGIS, sembrar datos de ejemplo y definir los esquemas Zod y tipos de dominio compartidos. Bloquea todas las historias de usuario.

**Critical**: Completar antes de implementar servicios de búsqueda o UI.

- [x] T005 Añadir el enum `ListingStatus` (`draft`, `in_review`, `published`, `paused`, `rejected`) y los modelos `Listing`, `ListingPhoto`, `ListingAvailability` en `development/prisma/schema.prisma` con los campos, constraints e índices definidos en `specs/004-public-search/data-model.md`. Añadir relaciones `listings Listing[]` en `User` y `Category`. Usar `Unsupported("geometry(Point, 4326)")` para `location`, `@db.Decimal(10, 7)` para `lat`/`lng`, `@db.Decimal(19, 4)` para `pricePerDay`, `@db.Decimal(3, 2)` para `ratingAverage`, `@db.Date` para `blockedDate`, soft delete `deletedAt` en `Listing` y `ListingPhoto`, `onDelete: Restrict` en FKs a `User` y `Category`, `onDelete: Cascade` en FKs a `Listing` (justificado: hijos del listing).
- [x] T006 Generar la migración `development/prisma/migrations/<timestamp>_listing_search/migration.sql` que: (a) ejecute `CREATE EXTENSION IF NOT EXISTS postgis;`, (b) cree las tablas con columnas, constraints e índices, (c) cree el índice GiST `CREATE INDEX idx_listing_location_gist ON "Listing" USING GIST ("location");`, (d) el campo `location` se cree como `geometry(Point, 4326)` en SQL raw. Revisar el SQL para confirmar que no modifica ni elimina modelos existentes.
- [x] T007 [P] Crear en `development/tests/integration/search/listing.database.integration.test.ts` pruebas de: FK restrict al borrar usuario con listings, FK cascade al borrar listing (borra fotos y disponibilidades), unicidad de slug, unicidad de `(listingId, blockedDate)` en `ListingAvailability`, y que una query con `ST_DWithin` devuelve listings dentro del radio.
- [x] T008 Ejecutar `development/npm run db:generate`, las migraciones y `development/npm run test:integration -- --run development/tests/integration/search/listing.database.integration.test.ts` desde `/development` y corregir el esquema hasta que pase.
- [x] T009 [P] Crear `development/src/features/search/shared/search.schema.ts` con los schemas Zod: `SearchQuerySchema` (query, location `{lat,lng,text}`, categoryId, dateRange `{startDate,endDate}`, maxPricePerDay, maxDistanceKm, minRating, onlyVerified, sortBy enum, page, cursor, seed, limit), `SearchInitialSchema` (seed, limit), `SuggestSchema` (query min 2, type enum, limit), `MapBoundsSchema` (bounds `{north,south,east,west}` + filtros opcionales), y exportar tipos inferidos.
- [x] T010 [P] Crear `development/src/features/search/domain/search-params.ts` con tipos de dominio `SearchParams`, `SearchLocation`, `DateRange`, `SortBy`, `SearchView` (`"grid" | "list"`), y `development/src/features/search/domain/search-result.ts` con `SearchResultDTO`, `SearchResultsPage`, `LocationSuggestion`, `CategorySuggestion`, `MapPin` (solo campos públicos, sin datos privados).
- [x] T011 [P] Crear `development/src/types/search.ts` re-exportando los tipos públicos de `features/search/domain/` para uso transversal en presentación.
- [x] T012 [P] Crear `development/src/lib/validations/search.ts` re-exportando los schemas de `features/search/shared/search.schema.ts` para uso desde el router.
- [x] T013 [P] Crear `development/src/server/lib/geo/postgis.ts` con helpers: `buildPointWKT(lat, lng)` para generar WKT de Point, `stDWithinClause(lat, lng, radiusMeters)` que devuelva el fragmento Prisma raw para filtrar por distancia, `stDistanceClause(lat, lng)` para ordenar por distancia, y `randomOrderSeed(seed)` que devuelva `Prisma.sql\`ORDER BY random(${seed})\`` para paginación coherente de aleatorios.
- [x] T014 [P] Crear `development/src/server/lib/geo/distance.ts` con `haversineDistanceKm(lat1, lng1, lat2, lng2)` para calcular distancia en el DTO cuando se tiene `location` del usuario.
- [x] T015 [P] Modificar `development/prisma/seed.ts` para crear al menos 40 listings de ejemplo distribuidos en ciudades españolas (Madrid, Barcelona, Valencia, Sevilla, Bilbao), con categorías existentes, precios variados (10-200 EUR/día), ratings variados (3.5-5.0), algunos arrendadores verificados y otros no, algunos con bloqueos de disponibilidad y otros sin bloqueos, y al menos una foto por listing. Asegurar que la mayoría estén en estado `published`.

**Checkpoint**: PostgreSQL con PostGIS contiene las tablas `Listing`, `ListingPhoto`, `ListingAvailability` con constraints e índice GiST funcionando. Prisma Client generado. Seed con datos de ejemplo. Esquemas Zod y tipos de dominio listos para servicios y routers.

---

## Phase 3: User Story 1 - Llegar a la web y ver resultados sin estar logado (Priority: P1) 🎯 MVP

**Goal**: Página raíz `/` como landing de búsqueda pública que muestra resultados aleatorios desde la carga inicial, con barra de búsqueda (autocompletado de ubicaciones y categorías), detección GPS o selección manual de ubicación, y capacidad de configurar la búsqueda desde la propia página. Sin login ni identificación.

**Independent Test**: Un visitante nuevo, sin sesión y sin cuenta, abre la URL raíz del sitio y ve directamente una lista de productos publicados (aleatorios) sin haber tecleado nada ni haberse identificado; a partir de ahí puede usar la barra de búsqueda y los filtros de la propia landing para refinar lo que está viendo.

### Tests for User Story 1

- [x] T016 [P] [US1] Crear en `development/tests/unit/search/search.service.test.ts` pruebas de: `searchInitial` devuelve listings `published` con owner `active`, respeta `limit`, genera y usa `seed` para orden aleatorio coherente; `searchSuggest` devuelve ubicaciones y categorías; mapeo a `SearchResultDTO` no incluye datos privados (email, teléfono, dirección exacta).
- [x] T017 [P] [US1] Crear en `development/tests/unit/search/search.schema.test.ts` pruebas de validación Zod: `SearchQuerySchema` acepta inputs válidos y rechaza inválidos (lat fuera de rango, fecha mal formateada, sortBy inválido, limit > 48), `SuggestSchema` rechaza query < 2 chars, `MapBoundsSchema` valida bounds.
- [x] T018 [P] [US1] Crear en `development/tests/integration/search/search.router.integration.test.ts` pruebas con DB real + PostGIS: `search.initial` devuelve resultados aleatorios paginados, `search.query` sin criterios equivale a initial, `search.suggest` devuelve ubicaciones (mock Nominatim) y categorías reales, rate limit responde 429 tras superar umbral, y respuestas no contienen datos privados.

### Implementation for User Story 1

- [x] T019 [P] [US1] Crear `development/src/features/search/infrastructure/listing.repository.ts` con funciones: `findPublishedListingsRandom(db, { seed, limit })` que usa `Prisma.queryRaw` con `ORDER BY random(seed)`, `findPublishedListingsFiltered(db, params)` que construye la query con filtros (categoría, precio, rating, verificados, full-text), `countPublishedListings(db, params)`, y `findListingPrimaryPhoto(db, listingId)`.
- [x] T020 [P] [US1] Crear `development/src/features/search/infrastructure/geocoding.repository.ts` con `searchLocationsNominatim(query, limit)` que llama a Nominatim vía fetch con `q = query + ", España"`, cachea resultados en memoria (TTL 5 min usando un `Map` con timestamps), respeta rate limit, y devuelve `LocationSuggestion[]`. Manejar errores de red devolviendo array vacío.
- [x] T021 [US1] Crear `development/src/features/search/application/search.service.ts` con: `searchInitial(db, { seed, limit })` que genera seed si no se proporciona, llama al repositorio y mapea a `SearchResultsPage`; `searchQuery(db, params)` que aplica filtros, ordenación, paginación (cursor o page), calcula `distanceKm` si hay `location`, y mapea a `SearchResultsPage`; `searchSuggest(db, { query, type, limit })` que llama a geocoding y categorías. Nunca exponer datos privados en el mapeo a DTO.
- [x] T022 [US1] Crear `development/src/server/api/routers/search.router.ts` con `publicProcedure` para `search.initial`, `search.query`, `search.suggest` usando los schemas Zod, delegando en `search.service.ts`, aplicando rate limit (`search:ip:<ip>` 100/min, `suggest:ip:<ip>` 60/min) con `consumeRateLimit`, y mapeando errores con `mapErrorToTRPC`.
- [x] T023 [US1] Modificar `development/src/server/api/root.ts` para registrar `searchRouter` como `search` en el `appRouter`.
- [x] T024 [P] [US1] Crear `development/src/hooks/use-search-params.ts` como hook sobre `nuqs` que lee y actualiza los query params de búsqueda (`q`, `loc`, `lat`, `lng`, `cat`, `dateStart`, `dateEnd`, `maxPrice`, `maxDist`, `minRating`, `verified`, `sort`, `view`, `page`, `seed`) con tipado Zod y sincronización con el historial del navegador.
- [x] T025 [P] [US1] Crear `development/src/hooks/use-geolocation.ts` como hook que usa `navigator.geolocation.getCurrentPosition` con manejo de permisos, errores y estado de carga, respetando la decisión del usuario (no geolocaliza sin consentimiento).
- [x] T026 [P] [US1] Crear `development/src/features/search/presentation/search-bar.tsx` como Client Component con input de búsqueda, debounce 200ms, llamada a `api.search.suggest.useQuery`, dropdown de sugerencias diferenciadas (ubicaciones vs categorías), selección con teclado (flechas + Enter) y ratón, labels explícitos, foco visible y tokens `--ps-*`.
- [x] T027 [P] [US1] Crear `development/src/features/search/presentation/location-detector.tsx` como Client Component con botón "Usar mi ubicación" que llama a `useGeolocation`, y muestra la ubicación detectada o un mensaje si se rechazó el permiso. Usa `useSearchParams` para actualizar `lat`/`lng`/`loc`.
- [x] T028 [P] [US1] Crear `development/src/features/search/presentation/result-card.tsx` como componente que renderiza una tarjeta de listing (vista grid) con imagen principal (`next/image`), título, precio por día, rating, distancia, ciudad, nombre y avatar del arrendador, badge verificado, y enlace al detalle. Solo campos públicos.
- [x] T029 [P] [US1] Crear `development/src/features/search/presentation/empty-state.tsx` como componente que muestra un estado vacío útil con sugerencias (relajar criterios, explorar categorías) cuando no hay resultados, sin errores técnicos visibles.
- [x] T030 [P] [US1] Crear `development/src/features/search/presentation/results-list.tsx` como Client Component que renderiza la lista de resultados usando `result-card.tsx`, muestra skeletons durante carga, y muestra `empty-state.tsx` cuando no hay resultados. Paginación básica (se completará en US4).
- [x] T031 [US1] Crear `development/src/features/search/presentation/search-page.tsx` como Client Component que orquesta `SearchBar`, `LocationDetector`, `ResultsList`, y usa `api.search.query.useQuery` / `api.search.initial.useQuery` según si hay criterios. Sincroniza todo el estado con la URL vía `useSearchParams`.
- [x] T032 [US1] Crear `development/src/app/(public)/layout.tsx` como layout público con header mínimo (logo, enlace a login opcional no bloqueante) sin nav de usuario logado, usando tokens `--ps-*`.
- [x] T033 [US1] Crear `development/src/app/(public)/search/loading.tsx` con skeleton de resultados (grid de placeholders) conforme a `FRONTEND.md` §6.3.
- [x] T034 [US1] Crear `development/src/app/(public)/search/error.tsx` como error boundary de búsqueda con mensaje genérico y botón de reintentar.
- [x] T035 [US1] Modificar `development/src/app/page.tsx` para que deje de hacer `redirect("/register")` y sea un Server Component que lea los query params (`nuqs` server-side), llame a `search.initial` (sin criterios) o `search.query` (con criterios) vía `api` server helper, y renderice el layout público + `SearchPage` con los resultados precargados como props iniciales (para evitar flash de carga en el primer render).
- [x] T036 [US1] Crear `development/src/features/search/presentation/index.ts` como barrel exports de los componentes de presentación.

**Checkpoint**: US1 permite abrir la URL raíz, ver resultados aleatorios sin login, usar la barra de búsqueda con autocompletado, detectar o seleccionar ubicación, y ver resultados filtrados. El estado se refleja en la URL. No se exponen datos privados.

---

## Phase 4: User Story 2 - Filtrar y ordenar resultados (Priority: P1)

**Goal**: Permitir refinar resultados con filtros combinables (categoría, rango de fechas, precio máximo, distancia máxima, rating mínimo, solo verificados) y ordenar (Relevancia, Más cercano, Precio asc/desc, Mejor valorado, Más popular).

**Independent Test**: Partiendo de una búsqueda con resultados, un visitante aplica al menos un filtro y cambia el criterio de ordenación, y la lista se actualiza reflejando ambos sin recargar la página ni identificarse.

### Tests for User Story 2

- [x] T037 [P] [US2] Ampliar `development/tests/unit/search/search.service.test.ts` con pruebas de: filtro por categoría (incluye subcategorías), filtro por rango de fechas (excluye listings con bloqueos solapados), filtro por precio máximo, filtro por distancia máxima con PostGIS, filtro por rating mínimo, filtro solo verificados, combinación AND de múltiples filtros, y cada criterio de ordenación.
- [x] T038 [P] [US2] Ampliar `development/tests/integration/search/search.router.integration.test.ts` con pruebas de: `search.query` con cada filtro individual, combinación de filtros (AND), cambio de ordenación sin perder filtros, y "limpiar filtros" devuelve resultados sin refinar.

### Implementation for User Story 2

- [x] T039 [US2] Ampliar `development/src/features/search/infrastructure/listing.repository.ts` con `findPublishedListingsFiltered` soportando: filtro por categoría (incluye subcategorías via recursive CTE o `categoryId IN (...)`), filtro por rango de fechas (excluye listings con `ListingAvailability.blockedDate` en el rango), filtro por precio (`pricePerDay <= maxPricePerDay`), filtro por distancia (`ST_DWithin` con `maxDistanceKm * 1000`), filtro por rating (`ratingAverage >= minRating`), filtro solo verificados (join con `VerificationState` donde `channel = identity` AND `status = verified`), y ordenación por cada criterio (`sortBy`).
- [x] T040 [US2] Ampliar `development/src/features/search/application/search.service.ts` para soportar todos los filtros y criterios de ordenación en `searchQuery`, calculando `distanceKm` cuando hay `location` y aplicando el algoritmo de "relevance" (combinación de cercanía, rating, popularidad; si no hay criterios, usa `random(seed)`).
- [x] T041 [P] [US2] Crear `development/src/features/search/presentation/filters-panel.tsx` como Client Component con controles para: categoría (select o árbol), rango de fechas (dos date inputs), precio máximo (number input o slider), distancia máxima (number input o slider, deshabilitado si no hay ubicación), rating mínimo (select 1-5), y toggle "Solo usuarios verificados". Todos con labels explícitos, foco visible, navegación por teclado, y actualización de URL vía `useSearchParams`.
- [x] T042 [P] [US2] Crear `development/src/features/search/presentation/sort-selector.tsx` como Client Component con un select de ordenación (Relevancia, Más cercano, Precio asc, Precio desc, Mejor valorado, Más popular) que actualiza `?sort=` en la URL sin perder los filtros aplicados.
- [x] T043 [US2] Integrar `FiltersPanel` y `SortSelector` en `development/src/features/search/presentation/search-page.tsx`, con un botón "Limpiar filtros" que resetea todos los filtros a su estado por defecto y actualiza la URL.
- [x] T044 [US2] Ampliar `development/src/features/search/presentation/empty-state.tsx` para mostrar qué filtros están activos cuando no hay resultados y sugerir relajar criterios específicos.

**Checkpoint**: US2 permite aplicar filtros combinables (AND), cambiar ordenación sin perder filtros, y limpiar filtros. El estado se refleja en la URL. Los resultados se actualizan sin recargar.

---

## Phase 5: User Story 3 - Explorar resultados en mapa interactivo (Priority: P2)

**Goal**: Vista de mapa interactivo con pins de productos, clic en pin para ver preview, y zoom/pan que ajusta los pins al área visible.

**Independent Test**: Partiendo de una búsqueda con resultados geolocalizados, un visitante cambia a la vista de mapa, ve pins, hace clic en uno y aparece una preview sin abandonar la página.

### Tests for User Story 3

- [x] T045 [P] [US3] Ampliar `development/tests/unit/search/search.service.test.ts` con pruebas de `searchMapBounds`: devuelve pins dentro del bounding box, respeta filtros (categoría, precio, rating, verificados, fechas), limita resultados, y solo campos mínimos (sin `owner` ni `distanceKm`).
- [x] T046 [P] [US3] Ampliar `development/tests/integration/search/search.router.integration.test.ts` con pruebas de `search.mapBounds` con DB real + PostGIS: pins dentro de bounds, filtros aplicados, límite respetado, y rate limit.

### Implementation for User Story 3

- [x] T047 [US3] Ampliar `development/src/features/search/infrastructure/listing.repository.ts` con `findPublishedListingsInBounds(db, { bounds, filters, limit })` que filtra listings dentro del bounding box (`lat` BETWEEN south AND north, `lng` BETWEEN west AND east) con los mismos filtros que `searchQuery` (excepto `maxDistanceKm`), limitando resultados, y devolviendo solo campos mínimos para pins.
- [x] T048 [US3] Ampliar `development/src/features/search/application/search.service.ts` con `searchMapBounds(db, { bounds, filters, limit })` que llama al repositorio y mapea a `MapPin[]`.
- [x] T049 [US3] Añadir `search.mapBounds` al router `development/src/server/api/routers/search.router.ts` usando `MapBoundsSchema`, delegando en `search.service.ts`, con rate limit `search:ip:<ip>` (100/min).
- [x] T050 [P] [US3] Crear `development/src/features/search/presentation/map-view.tsx` como Client Component que carga Leaflet con `next/dynamic` (sin SSR), renderiza el mapa centrado en la ubicación de búsqueda, coloca pins con `react-leaflet`, muestra preview al clic (imagen, título, precio, rating, distancia), y usa `api.search.mapBounds.useQuery` al hacer zoom/pan. Incluir error boundary que muestre "Mapa no disponible temporalmente" si Leaflet o los tiles no cargan, manteniendo la vista de lista usable.
- [x] T051 [US3] Integrar `MapView` en `development/src/features/search/presentation/search-page.tsx` con un toggle para alternar entre vista de lista y vista de mapa, sincronizando con `?view=` en la URL. Los filtros aplicados se mantienen al cambiar de vista y los pins se actualizan.

**Checkpoint**: US3 permite ver resultados en mapa, hacer clic en pins para preview, zoom/pan, y degradación elegante si el mapa no carga. Los filtros se sincronizan entre lista y mapa.

---

## Phase 6: User Story 4 - Cambiar vista grid/lista y paginar resultados (Priority: P2)

**Goal**: Alternar entre vista grid y lista, y paginar resultados de forma adaptativa (infinite scroll en móvil, paginación numerada en desktop).

**Independent Test**: Partiendo de una búsqueda con más resultados que una página, un visitante alterna entre grid y lista, y pagina (numérica en desktop, infinite scroll en móvil) sin perder filtros ni ordenación.

### Tests for User Story 4

- [x] T052 [P] [US4] Ampliar `development/tests/unit/search/search.service.test.ts` con pruebas de paginación: cursor-based (infinite scroll) devuelve `nextCursor` correcto y no duplica resultados, offset-based (paginación numerada) calcula `totalPages` correctamente, y `seed` mantiene coherencia al paginar aleatorios.
- [x] T053 [P] [US4] Ampliar `development/tests/integration/search/search.router.integration.test.ts` con pruebas de paginación real: infinite scroll (3 páginas sin duplicados), paginación numerada (página 2 correcta), y límite de 200 resultados en móvil tras el cual se ofrece paginación explícita.

### Implementation for User Story 4

- [x] T054 [US4] Ampliar `development/src/features/search/infrastructure/listing.repository.ts` con soporte de paginación cursor-based (usando `cursor` + `take` + `skip(1)` en Prisma o cursor raw SQL) y offset-based (`skip` + `take`), manteniendo `seed` para coherencia en aleatorios.
- [x] T055 [US4] Ampliar `development/src/features/search/application/search.service.ts` para soportar ambos modos de paginación en `searchQuery`, calculando `nextCursor`, `page`, `totalPages` y `hasMore` correctamente, y respetando el límite de 200 resultados (10 páginas de 20) en infinite scroll.
- [x] T056 [P] [US4] Crear `development/src/hooks/use-infinite-search.ts` como hook que usa `useInfiniteQuery` de React Query con `api.search.query` para infinite scroll, `IntersectionObserver` para detectar scroll, y detiene la carga tras 200 resultados ofreciendo paginación explícita.
- [x] T057 [P] [US4] Crear `development/src/features/search/presentation/view-toggle.tsx` como Client Component con dos botones (grid/lista) que actualizan `?view=` en la URL conservando resultados, filtros y ordenación.
- [x] T058 [P] [US4] Crear `development/src/features/search/presentation/result-row.tsx` como componente que renderiza una fila de listing (vista lista) con imagen, título, precio, rating, distancia, arrendador y badge, más compacto que la tarjeta grid. Solo campos públicos.
- [x] T059 [US4] Ampliar `development/src/features/search/presentation/results-list.tsx` para soportar: vista grid (`result-card.tsx`) y vista lista (`result-row.tsx`) según `?view=`, infinite scroll en móvil (usando `useInfiniteSearch` + `IntersectionObserver`) y paginación numerada en desktop (controles de página que actualizan `?page=`), manteniendo filtros y ordenación al cambiar de página o cargar más.
- [x] T060 [US4] Integrar `ViewToggle` en `development/src/features/search/presentation/search-page.tsx` y asegurar que el cambio de vista conserva el mismo conjunto de resultados, filtros y ordenación.

**Checkpoint**: US4 permite alternar grid/lista y paginar de forma adaptativa (infinite scroll en móvil con límite de 200, numerada en desktop) sin perder filtros ni ordenación. El estado se refleja en la URL.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validar seguridad, accesibilidad, integración, rendimiento y documentación antes del PR.

- [x] T061 [P] Crear `development/tests/e2e/search/search.spec.ts` con Playwright para: landing con resultados aleatorios sin login, autocompletado, detección GPS (mock), aplicar filtros, cambiar ordenación, vista de mapa, alternar grid/lista, paginación, estado vacío, y URL compartible/restaurable. (Diferido si Playwright no está instalado.)
- [x] T062 [P] Configurar en `development/tests/e2e/search/search-accessibility.spec.ts` axe-core para la página de búsqueda (barra, filtros, ordenación, vistas, paginación, pins del mapa), verificando foco, labels, live regions y contraste. (Diferido si Playwright + axe-core no están instalados.)
- [x] T063 Ejecutar en `/development` `npm test` y `npm run test:integration`, cubriendo `development/tests/unit/search/` y `development/tests/integration/search/` y comprobando que `002-registration` y `003-login` siguen funcionando.
- [x] T064 Ejecutar `npx tsc --noEmit` y lint sobre `development/`, corrigiendo tipos, imports y reglas de Server/Client Components.
- [x] T065 Revisar `development/src/server` y tests buscando datos privados (email, teléfono, dirección exacta, datos de pago) en logs, fixtures y respuestas de búsqueda.
- [x] T066 Verificar rate limiting: 100 búsquedas/min por IP, 60 autocompletados/min por IP, y que el 429 incluye `retryAfterSeconds`.
- [x] T067 Verificar que solo listings `published` con owner `active` aparecen en resultados (crear listings en otros estados y confirmar que no aparecen).
- [x] T068 Actualizar `development/README.md` y `specs/004-public-search/quickstart.md` con dependencias nuevas, variables de entorno, comandos y criterios de validación.
- [ ] T069 Verificar manualmente el flujo en móvil y desktop siguiendo `specs/004-public-search/quickstart.md` y registrar resultados.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Sin dependencias; prepara dependencias, Docker y configuración.
- **Phase 2 Foundational**: Depende de Setup y bloquea todas las historias.
- **Phase 3 US1 Landing/búsqueda**: Depende del modelo `Listing` y esquemas compartidos.
- **Phase 4 US2 Filtros/ordenación**: Depende de US1 (necesita `searchQuery` y `SearchPage` funcionando).
- **Phase 5 US3 Mapa**: Depende de US1 (necesita resultados geolocalizados y `SearchPage`); puede correr en paralelo con US4.
- **Phase 6 US4 Vistas/paginación**: Depende de US1 (necesita `ResultsList` y `SearchPage`); puede correr en paralelo con US3.
- **Phase 7 Polish**: Depende de todas las historias incluidas en la entrega.

### User Story Dependencies

- **US1 (P1)**: Tras Phase 2; es el núcleo de la búsqueda pública.
- **US2 (P1)**: Tras US1; necesita `searchQuery` y `SearchPage` para añadir filtros y ordenación.
- **US3 (P2)**: Tras US1; necesita resultados geolocalizados y `SearchPage` para el mapa. Independiente de US2.
- **US4 (P2)**: Tras US1; necesita `ResultsList` y `SearchPage` para vistas y paginación. Independiente de US2 y US3.

### Within Each User Story

- Tests antes de implementación (TDD donde sea viable).
- Schemas Zod antes de servicios.
- Repositorios antes de servicios.
- Servicios antes de routers.
- Routers antes de UI.
- UI antes de integración E2E.

### Parallel Opportunities

- T001, T002, T003, T004 pueden ejecutarse en paralelo (archivos distintos).
- T007 puede ejecutarse en paralelo con T005/T006 (test vs schema/migración).
- T009, T010, T011, T012, T013, T014 pueden ejecutarse en paralelo (archivos distintos).
- T015 puede ejecutarse en paralelo con T009-T014 (seed vs schemas/helpers).
- T016, T017, T018 pueden ejecutarse en paralelo (archivos de test distintos).
- T019, T020 pueden ejecutarse en paralelo (repositorios distintos).
- T024, T025, T026, T027, T028, T029 pueden ejecutarse en paralelo (componentes/hooks distintos).
- T037, T038 pueden ejecutarse en paralelo (archivos de test distintos).
- T041, T042 pueden ejecutarse en paralelo (componentes distintos).
- T045, T046 pueden ejecutarse en paralelo (archivos de test distintos).
- T050 puede ejecutarse en paralelo con T047-T049 (componente vs servicio/router).
- T052, T053 pueden ejecutarse en paralelo (archivos de test distintos).
- T056, T057, T058 pueden ejecutarse en paralelo (hook y componentes distintos).
- T061, T062 pueden ejecutarse en paralelo (specs E2E distintos).

## Parallel Example: User Story 1

```text
Task: "Crear pruebas unitarias de search.service en development/tests/unit/search/search.service.test.ts"
Task: "Crear pruebas unitarias de search.schema en development/tests/unit/search/search.schema.test.ts"
Task: "Crear pruebas de integración de search.router en development/tests/integration/search/search.router.integration.test.ts"
Task: "Crear listing.repository en development/src/features/search/infrastructure/listing.repository.ts"
Task: "Crear geocoding.repository en development/src/features/search/infrastructure/geocoding.repository.ts"
Task: "Crear useSearchParams hook en development/src/hooks/use-search-params.ts"
Task: "Crear useGeolocation hook en development/src/hooks/use-geolocation.ts"
Task: "Crear SearchBar en development/src/features/search/presentation/search-bar.tsx"
Task: "Crear LocationDetector en development/src/features/search/presentation/location-detector.tsx"
Task: "Crear ResultCard en development/src/features/search/presentation/result-card.tsx"
Task: "Crear EmptyState en development/src/features/search/presentation/empty-state.tsx"
```

## Parallel Example: User Story 3 + User Story 4

```text
# US3 y US4 pueden ejecutarse en paralelo tras US1:
Task (US3): "Crear MapView en development/src/features/search/presentation/map-view.tsx"
Task (US4): "Crear ViewToggle en development/src/features/search/presentation/view-toggle.tsx"
Task (US4): "Crear ResultRow en development/src/features/search/presentation/result-row.tsx"
Task (US4): "Crear useInfiniteSearch hook en development/src/hooks/use-infinite-search.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (deps, PostGIS, env).
2. Completar Phase 2: Foundational (modelo Listing, migración, seed, esquemas).
3. Completar Phase 3: User Story 1 (landing + resultados aleatorios + barra + autocompletado + ubicación).
4. **STOP and VALIDATE**: Test User Story 1 independientemente — abrir `/` sin login y ver resultados.
5. Deploy/demo si ready.

### Incremental Delivery

1. Entregar landing con resultados aleatorios + barra de búsqueda + autocompletado + ubicación.
2. Añadir filtros combinables + ordenación.
3. Añadir mapa interactivo con pins y preview.
4. Añadir vistas grid/lista + paginación adaptativa.
5. Completar E2E, axe y auditoría de seguridad.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: User Story 1 (núcleo de búsqueda)
3. Once US1 is done:
   - Developer A: User Story 2 (filtros/ordenación)
   - Developer B: User Story 3 (mapa) — independiente de US2
   - Developer C: User Story 4 (vistas/paginación) — independiente de US2 y US3
4. Stories complete and integrate independently.

## Notes

- Todas las tareas incluyen checkbox, ID, etiquetas de historia cuando aplican y rutas concretas.
- Las tareas de test se incluyen porque `constitution/TESTING.md` exige pruebas unitarias e integración; deben escribirse antes de la implementación de su unidad cuando sea viable.
- Esta feature introduce el modelo `Listing` mínimo; la feature de listings (§2) lo extenderá con wizard de creación, precios escalonados, calendario completo, etc.
- El proveedor de mapas (Leaflet) y geocoding (Nominatim) son open-source y no requieren API key; se pueden cambiar en el futuro vía env vars.
- PostGIS es requerido para búsquedas por proximidad; la imagen Docker debe cambiarse a `postgis/postgis`.
- La degradación elegante del mapa (FR-017) se implementa con error boundary en `MapView`.
- El estado de búsqueda se codifica en la URL con `nuqs` para ser compartible y restaurable sin sesión.
- Los resultados aleatorios iniciales usan `ORDER BY random(seed)` con seed por sesión para coherencia al paginar.
- No se incluye el detalle del producto (§3.3), la tarjeta completa (§3.2) ni la creación/gestión de listings (§2); esta feature enlaza hacia ellos y consume sus datos públicos.
