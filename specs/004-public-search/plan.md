# Implementation Plan: Búsqueda Pública y Página de Inicio

**Branch**: `04-public-search` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-public-search/spec.md`

## Summary

Implementar la página de búsqueda pública como landing del sitio en la URL raíz (`/`), accesible sin sesión ni identificación, que muestra resultados aleatorios de listings publicados desde la carga inicial y permite al visitante configurar la búsqueda desde la propia página (barra con autocompletado de ubicaciones y categorías, detección GPS o selección manual, filtros combinables, ordenación, vistas grid/lista, mapa interactivo con pins y paginación adaptativa). La búsqueda se sirve vía tRPC con `publicProcedure` (sin sesión), el estado se codifica en la URL para ser compartible y restaurable, y el renderizado inicial es Server Component con Client Components solo para la interactividad (autocompletado, mapa, filtros dinámicos, infinite scroll).

La feature introduce el modelo `Listing` mínimo necesario para servir resultados de búsqueda (la feature completa de creación/gestión de listings, §2, se hará después y extenderá este modelo). Se añade PostGIS para búsquedas por proximidad y un servicio de geocoding para resolver texto de ubicación a coordenadas. El proveedor de mapas se integra con degradación elegante si no carga.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), Node.js 20+, Next.js 14.2 (App Router)

**Primary Dependencies**: tRPC 11, React Query 5, Prisma 5.20, Zod 3.23, Tailwind CSS 3.4. Reutiliza `Category` del scaffold y `User`/`VerificationState` de `002-registration`. Añade: `nuqs` (URL state como fuente de verdad para filtros), proveedor de mapas (Leaflet + react-leaflet, open-source, sin API key) y Nominatim (geocoding gratuito, OpenStreetMap) para autocompletado de ubicaciones. PostGIS ya está referenciado en `DATABASE.md` §5.4.

**Storage**: PostgreSQL 15 + extensión PostGIS. Nuevo modelo `Listing` con coordenadas geoespaciales (`Unsupported("geometry(Point, 4326)")` + columnas `lat`/`lng` Decimal), precio por día, estado de publicación, rating agregado y relaciones a `User` (arrendador) y `Category`. Nuevos modelos `ListingPhoto` (imagen principal y orden) y `ListingAvailability` (bloqueos de calendario para filtrar por rango de fechas).

**Testing**: Vitest (unitarios + integración con @testcontainers/postgresql + PostGIS), Playwright (E2E del flujo de búsqueda), axe-core (accesibilidad). Mismo patrón que `002-registration` y `003-login`.

**Target Platform**: Web (navegadores modernos, móvil y desktop). Next.js App Router en servidor.

**Project Type**: Web service (Next.js + tRPC + Prisma + PostGIS).

**Performance Goals**: Búsqueda inicial (aleatoria) < 500ms p95 (query simple con `ORDER BY random()` paginada o sampling). Búsqueda con filtros < 2s p90 (con índice GIST para proximidad). Autocompletado < 300ms p95 (debounce 200ms + query ligera). Render inicial de la landing con resultados via Server Component < 1s TTFB.

**Constraints**: Sin sesión ni identificación para buscar, filtrar, ordenar, paginar o ver resultados. Solo listings en estado `Publicado` y arrendadores con cuenta `active`. Sin datos privados en respuestas (email, teléfono, dirección exacta, datos de pago). URL como fuente de verdad del estado de búsqueda. Degradación elegante del mapa si el proveedor no carga. Accesibilidad WCAG 2.1 AA.

**Scale/Scope**: 3 nuevas tablas (`Listing`, `ListingPhoto`, `ListingAvailability`), 1 nueva extensión de BD (PostGIS), 1 nuevo router tRPC (`search.router.ts`) con 4 procedimientos públicos, 1 nueva feature folder (`src/features/search/`), 1 nueva página raíz (`/` reemplaza redirect a `/register`), ~6-8 Client Components (SearchBar con autocompletado, FiltersPanel, SortSelector, ViewToggle, ResultsList con infinite scroll, MapView con pins, LocationDetector), 1 Server Component (landing page). ~20-28 archivos nuevos/modificados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Documento | Gate | Estado |
|-----------|------|--------|
| `SECURITY.md` §1.6 — El cliente nunca toca la DB | La búsqueda se sirve vía tRPC `publicProcedure`; el navegador nunca accede a Prisma ni PostgreSQL | ✅ PASS |
| `SECURITY.md` §4.1 — Clasificación de datos: público vs confidencial | La búsqueda pública solo expone campos públicos (título, imagen, precio, ubicación aproximada, rating, nombre/avatar del arrendador, badge verificado). Nunca email, teléfono, dirección exacta ni datos de pago | ✅ PASS |
| `SECURITY.md` §5.1 — Validación de inputs con Zod | Todos los inputs de búsqueda (término, ubicación, filtros, ordenación, página) se validan con Zod antes de procesarse | ✅ PASS |
| `SECURITY.md` §5.2 — Rate limiting por IP (anónimo) | Rate limiting sobre procedimientos de búsqueda y autocompletado: 100 req/min por IP (umbrales de APIs generales) | ✅ PASS |
| `BACKEND.md` §1.1 — Seguridad por diseño, denegar todo por defecto | La búsqueda es explícitamente pública (`publicProcedure`); los procedimientos de mutación de listings no se exponen en esta feature | ✅ PASS |
| `BACKEND.md` §1.6 — La base de datos no es pública | Todo acceso a datos pasa por servicios y repositorios del servidor; el cliente consume vía tRPC | ✅ PASS |
| `BACKEND.md` §2.1 — Un router por dominio, servicios no importan de `api/` | Nuevo `search.router.ts` delgado que delega en `search.service.ts`; el servicio importa de `db/`, `lib/` y otros `services/` | ✅ PASS |
| `BACKEND.md` §4 — Routers delgados, Zod, sin Prisma crudo en respuestas | El router valida con Zod y devuelve DTOs tipados (no objetos Prisma crudos); el servicio mapea a `SearchResultDTO` | ✅ PASS |
| `DATABASE.md` §3.1 — Identificadores cuid/uuid | `Listing`, `ListingPhoto`, `ListingAvailability` usan `@id @default(cuid())` | ✅ PASS |
| `DATABASE.md` §3.2 — Timestamptz(6) | Todos los campos temporales usan `@db.Timestamptz(6)` | ✅ PASS |
| `DATABASE.md` §3.3 — Decimal para monetarios | `pricePerDay` usa `@db.Decimal(19, 4)` | ✅ PASS |
| `DATABASE.md` §5.4 — PostGIS para geoespacial | Coordenadas con `Unsupported("geometry(Point, 4326)")` + índice GiST; `lat`/`lng` Decimal para queries rápidas sin cargar PostGIS | ✅ PASS |
| `DATABASE.md` §7.1 — Soft deletes con `deletedAt` | `Listing`, `ListingPhoto` tienen `deletedAt DateTime?`; queries filtran `deletedAt: null` por defecto | ✅ PASS |
| `DATABASE.md` §4.2 — OnDelete RESTRICT por defecto | FK `Listing.ownerId → User.id` con `onDelete: Restrict`; `Listing.categoryId → Category.id` con `onDelete: Restrict`. `ListingPhoto` y `ListingAvailability` usan `Cascade` (justificado: son hijos del listing) | ✅ PASS |
| `FRONTEND.md` §1 — Server-first, Client Components solo para interacción | Landing `/` es Server Component que precarga resultados iniciales; SearchBar, FiltersPanel, MapView, ResultsList son Client Components | ✅ PASS |
| `FRONTEND.md` §5.1 — React Query vía tRPC para estado de servidor | Búsquedas usan `api.search.query.useQuery` / `api.search.suggest.useQuery`; no cachear manualmente en Zustand | ✅ PASS |
| `FRONTEND.md` §10 — `nuqs` para parámetros de búsqueda en URL | Estado de búsqueda (término, ubicación, filtros, ordenación, vista, página) gestionado con `nuqs` como fuente de verdad | ✅ PASS |
| `FRONTEND.md` §7 — Tailwind + tokens `DESIGN.md`, sin colores hardcodeados | Todos los componentes usan tokens `--ps-*` y clases Tailwind mapeadas | ✅ PASS |
| `FRONTEND.md` §8 — Accesibilidad WCAG AA, labels explícitos, foco visible | Todos los controles de búsqueda tienen labels, foco visible, navegación por teclado, alternativas no cromáticas | ✅ PASS |
| `FRONTEND.md` §9.1 — `next/image` para imágenes | Fotos de listings se sirven con `next/image` con `sizes` apropiados | ✅ PASS |
| `TESTING.md` §2 — Pirámide: unitarios, integración, E2E | Unitarios para `search.service` (mappers, lógica de filtros), integración con Testcontainers+PostGIS para `search.router`, E2E con Playwright para flujo landing→buscar→filtrar→ver resultado | ✅ PASS |
| `DESIGN.md` — Tokens `profesional-seguro`, accesibilidad | Búsqueda reutiliza tokens `--ps-*`, skeletons, estados vacíos, foco visible | ✅ PASS |

**Post-Phase 1 re-check**: El diseño de `data-model.md` y `contracts/search.md` no introduce violaciones. Las tablas `Listing`, `ListingPhoto`, `ListingAvailability` siguen las convenciones de `DATABASE.md` (cuid, timestamptz, decimal, soft-delete, índices GiST, `onDelete: Restrict` por defecto con `Cascade` justificado en hijos). El enum `ListingStatus` usa PascalCase conforme a `DATABASE.md` §2.2. El contrato tRPC sigue `BACKEND.md` §4 (routers delgados, Zod, sin Prisma crudo en respuestas, DTOs tipados `SearchResultDTO` con solo campos públicos). Los procedimientos son `publicProcedure` conforme a `FR-001`/`FR-018`. El rate limiting reutiliza `rate-limit.service.ts` con buckets `search:ip` (100/min) y `suggest:ip` (60/min) conforme a `SECURITY.md` §5.2. Los Client Components siguen `FRONTEND.md` (Server-first con precarga en Server Component, `nuqs` para URL state, React Query para datos, `next/dynamic` para Leaflet sin SSR, tokens `DESIGN.md`). El `SearchResultDTO` no expone datos privados conforme a `SECURITY.md` §4.1. No se introducen violaciones que requieran justificación en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-public-search/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── search.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created yet)
```

### Source Code (repository root)

```text
development/
├── prisma/
│   ├── schema.prisma              # + modelos Listing, ListingPhoto, ListingAvailability
│   └── migrations/
│       └── <timestamp>_listing_search/migration.sql  # + extensión PostGIS
├── src/
│   ├── app/
│   │   ├── page.tsx               # MODIFICADO — pasa de redirect(/register) a landing de búsqueda (Server Component)
│   │   ├── (public)/              # NUEVO route group para páginas públicas con layout compartido
│   │   │   ├── layout.tsx         # Layout público (header mínimo, sin nav de usuario logado)
│   │   │   └── search/
│   │   │       ├── page.tsx       # Server Component — landing de búsqueda con resultados iniciales
│   │   │       ├── loading.tsx    # Skeleton de resultados
│   │   │       └── error.tsx      # Error boundary de búsqueda
│   │   └── api/trpc/[trpc]/
│   │       └── route.ts           # Sin cambios (ya pasa req al contexto)
│   ├── features/
│   │   └── search/                # NUEVO feature folder (patrón de features/categories)
│   │       ├── application/
│   │       │   └── search.service.ts      # Lógica de búsqueda, filtros, ordenación, aleatoriedad
│   │       ├── domain/
│   │       │   ├── search-params.ts       # Tipos de dominio de parámetros de búsqueda
│   │       │   └── search-result.ts       # Tipos de resultado de búsqueda (DTO)
│   │       ├── infrastructure/
│   │       │   ├── listing.repository.ts  # Queries Prisma + PostGIS para listings publicados
│   │       │   └── geocoding.repository.ts # Integración con Nominatim (geocoding/autocompletado)
│   │       ├── presentation/
│   │       │   ├── search-page.tsx        # Client Component — orquesta la búsqueda interactiva
│   │       │   ├── search-bar.tsx         # Client Component — barra con autocompletado (ubicaciones + categorías)
│   │       │   ├── filters-panel.tsx      # Client Component — filtros combinables
│   │       │   ├── sort-selector.tsx      # Client Component — selector de ordenación
│   │       │   ├── view-toggle.tsx        # Client Component — grid/lista
│   │       │   ├── results-list.tsx       # Client Component — lista/grid con infinite scroll y paginación
│   │       │   ├── result-card.tsx        # Componente — tarjeta de producto (vista grid)
│   │       │   ├── result-row.tsx         # Componente — fila de producto (vista lista)
│   │       │   ├── map-view.tsx           # Client Component — mapa Leaflet con pins y preview
│   │       │   ├── location-detector.tsx  # Client Component — detección GPS o selección manual
│   │       │   ├── empty-state.tsx        # Estado vacío cuando no hay resultados
│   │       │   └── index.ts               # Barrel exports
│   │       └── shared/
│   │           └── search.schema.ts       # Schemas Zod compartidos (query, suggest, filters)
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   └── search.router.ts       # NUEVO — search.query, search.suggest, search.mapBounds, search.initial
│   │   │   └── root.ts                    # MODIFICADO — registra searchRouter
│   │   ├── lib/
│   │   │   └── geo/
│   │   │       ├── postgis.ts             # Helpers de PostGIS (ST_DWithin, ST_Distance, random sampling)
│   │   │       └── distance.ts            # Cálculo de distancia Haversine para DTOs
│   │   └── services/
│   │       └── rate-limit.service.ts      # Reutilizado — buckets para search y suggest
│   ├── lib/
│   │   ├── validations/
│   │   │   └── search.ts                  # Re-export de features/search/shared/search.schema.ts
│   │   └── geo/
│   │       └── geocode.ts                 # Helper cliente para geocoding (si se necesita en cliente)
│   ├── hooks/
│   │   ├── use-search-params.ts           # Hook sobre nuqs para estado de búsqueda en URL
│   │   ├── use-geolocation.ts             # Hook para detección GPS con permiso
│   │   └── use-infinite-search.ts         # Hook para infinite scroll con React Query
│   └── types/
│       └── search.ts                      # Tipos globales de presentación de búsqueda
├── tests/
│   ├── unit/
│   │   └── search/
│   │       ├── search.service.test.ts     # Lógica de filtros, ordenación, mapeo a DTO
│   │       └── search.schema.test.ts      # Validación Zod de inputs
│   └── integration/
│       └── search/
│           └── search.router.integration.test.ts  # DB real + PostGIS, búsqueda, filtros, mapa
└── prisma/
    └── seed.ts                            # MODIFICADO — añade listings de ejemplo para búsqueda
```

**Structure Decision**: Estructura web application existente bajo `development/`, respetando el patrón feature-based de `features/categories` (subcarpetas `application/`, `domain/`, `infrastructure/`, `presentation/`, `shared/`). La nueva feature `search` sigue el mismo patrón. La página raíz `/` pasa de `redirect("/register")` a Server Component que renderiza la landing de búsqueda. Se introduce el route group `(public)` para páginas públicas con layout compartido (header mínimo sin nav de usuario logado). Los Client Components de búsqueda viven en `features/search/presentation/` siguiendo `FRONTEND.md` §2.2 ("colocar lo cerca de donde se usa"). Los hooks de cliente viven en `hooks/` siguiendo `FRONTEND.md` §2.1. El estado de URL se gestiona con `nuqs` (`FRONTEND.md` §10). El router tRPC `search.router.ts` es delgado y delega en `search.service.ts` (`BACKEND.md` §2.1).

## Complexity Tracking

> No hay violaciones de la constitución que requieran justificación. Las decisiones técnicas (PostGIS, Leaflet, Nominatim, nuqs, modelo Listing mínimo) están justificadas en `research.md` y cumplen todos los documentos aplicables de `constitution/`.
