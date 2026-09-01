# Implementation Plan: Página de Detalle del Producto

**Branch**: `005-listing-detail` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-listing-detail/spec.md`

## Summary

Implementar la página de detalle pública del producto en la URL `/listings/[slug]`, accesible sin sesión ni identificación, que muestra la ficha completa de un listing publicado: galería de imágenes con carrusel/zoom/fullscreen, título, descripción y características, calendario de disponibilidad interactivo, tabla de precios derivada por defecto desde `pricePerDay` (tramos 1d/3d/7d con descuento automático), perfil público del arrendador, botones de Contactar y Reservar como entry-points con gating de login, sección de reviews (o estado vacío), productos similares, información del seguro aplicable y reglas del arrendador con defaults. El detalle se sirve vía tRPC con `publicProcedure` (sin sesión), el rango de fechas seleccionado se codifica en la URL para ser compartible y restaurable, y el renderizado inicial es Server Component con Client Components solo para la interactividad (carrusel, zoom, fullscreen, calendario con selección, recálculo de precio).

La feature **no introduce cambios en el schema Prisma**: reutiliza los modelos `Listing`, `ListingPhoto`, `ListingAvailability`, `User`, `VerificationState` y `Category` ya existentes. Los tramos de precios escalonados se **derivan** desde `pricePerDay` en el servicio (sin persistir tramos custom); las reglas del arrendador se renderizan con **defaults** (política Flexible + horarios genéricos) sin extender el modelo. El contador de vistas (`viewCount`) se incrementa al renderizar el detalle. Los botones "Contactar" y "Reservar" son entry-points que enrutan a `/messages?listing=[slug]` y `/checkout?listing=[slug]&start=...&end=...` respectivamente, mostrando un estado "próximamente" mientras los módulos de chat (§5) y reservas/pagos (§4) no existan.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), Node.js 20+, Next.js 14.2 (App Router)

**Primary Dependencies**: tRPC 11, React Query 5, Prisma 5.20, Zod 3.23, Tailwind CSS 3.4, `nuqs` (URL state para el rango de fechas seleccionado). Reutiliza todos los modelos y helpers existentes de `004-public-search` (`Listing`, `ListingPhoto`, `ListingAvailability`, `search.service`, `postgis.ts`, `distance.ts`) y `002-registration` (`User`, `VerificationState`). No añade dependencias nuevas.

**Storage**: PostgreSQL 15 + extensión PostGIS (sin cambios). Reutiliza las tablas `Listing`, `ListingPhoto`, `ListingAvailability`, `User`, `VerificationState`, `Category`. No se crean tablas ni columnas nuevas en esta feature. El único efecto de escritura es el incremento del contador `viewCount` en `Listing` (operación `UPDATE ... SET "viewCount" = "viewCount" + 1`).

**Testing**: Vitest (unitarios + integración con @testcontainers/postgresql + PostGIS), Playwright (E2E del flujo detalle), axe-core (accesibilidad). Mismo patrón que `004-public-search`.

**Target Platform**: Web (navegadores modernos, móvil y desktop). Next.js App Router en servidor.

**Project Type**: Web service (Next.js + tRPC + Prisma + PostGIS).

**Performance Goals**: Detalle del listing < 500ms p95 (query por slug con joins a fotos, owner, categoría y bloqueos). Incremento de `viewCount` asíncrono/no bloqueante (no debe añadir latencia al render). Render inicial del detalle via Server Component < 1s TTFB. Recálculo de precio al cambiar rango de fechas < 50ms (cálculo puro en cliente).

**Constraints**: Sin sesión ni identificación para ver la ficha. Solo listings en estado `published` AND `deletedAt IS NULL` con owner `accountStatus = active`. Sin datos privados en respuestas (email, teléfono, dirección exacta, datos de pago). URL como fuente de verdad del rango de fechas seleccionado. Accesibilidad WCAG 2.1 AA. Los botones "Contactar" y "Reservar" requieren login (propuesto de forma no bloqueante con callback de retorno).

**Scale/Scope**: 0 tablas nuevas, 0 migraciones, 1 nuevo router tRPC (`listing.router.ts`) con 2 procedimientos públicos (`getBySlug`, `getSimilar`) + 1 procedimiento público de incremento de vistas (`incrementView`), 1 nueva feature folder (`src/features/listing-detail/`), 1 nueva ruta dinámica (`/listings/[slug]` con `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`), ~6-8 Client Components (Gallery con carrusel/zoom/fullscreen, Calendar con selección de rango, PriceTable, ActionButtons con gating de login, SimilarListings), 1 Server Component (página de detalle). ~15-20 archivos nuevos/modificados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Documento | Gate | Estado |
|-----------|------|--------|
| `SECURITY.md` §1.6 — El cliente nunca toca la DB | El detalle se sirve vía tRPC `publicProcedure`; el navegador nunca accede a Prisma ni PostgreSQL | ✅ PASS |
| `SECURITY.md` §4.1 — Clasificación de datos: público vs confidencial | El detalle público solo expone campos públicos (título, descripción, fotos, precio, ubicación aproximada/ciudad, rating, reviews, nombre/avatar del arrendador, badge verificado, tiempo de respuesta, número de transacciones). Nunca email, teléfono, dirección exacta ni datos de pago | ✅ PASS |
| `SECURITY.md` §5.1 — Validación de inputs con Zod | Todos los inputs (slug, rango de fechas) se validan con Zod antes de procesarse | ✅ PASS |
| `SECURITY.md` §5.2 — Rate limiting por IP (anónimo) | Rate limiting sobre `listing.getBySlug`, `listing.getSimilar` e `listing.incrementView`: 100 req/min por IP (umbrales de APIs generales) | ✅ PASS |
| `BACKEND.md` §1.1 — Seguridad por diseño, denegar todo por defecto | El detalle es explícitamente público (`publicProcedure`); solo se sirve si `status = published` AND `deletedAt IS NULL` AND `owner.accountStatus = active`; los procedimientos de mutación de listings no se exponen | ✅ PASS |
| `BACKEND.md` §1.6 — La base de datos no es pública | Todo acceso a datos pasa por servicios y repositorios del servidor; el cliente consume vía tRPC | ✅ PASS |
| `BACKEND.md` §2.1 — Un router por dominio, servicios no importan de `api/` | Nuevo `listing.router.ts` delgado que delega en `listing-detail.service.ts`; el servicio importa de `db/`, `lib/` y otros `services/` | ✅ PASS |
| `BACKEND.md` §4 — Routers delgados, Zod, sin Prisma crudo en respuestas | El router valida con Zod y devuelve DTOs tipados (`ListingDetailDTO`, `SimilarListingDTO`); el servicio mapea a DTOs con solo campos públicos | ✅ PASS |
| `DATABASE.md` §3.1 — Identificadores cuid/uuid | Sin cambios; reutiliza modelos existentes con `@id @default(cuid())` | ✅ PASS |
| `DATABASE.md` §3.2 — Timestamptz(6) | Sin cambios; reutiliza modelos existentes | ✅ PASS |
| `DATABASE.md` §3.3 — Decimal para monetarios | `pricePerDay` ya usa `@db.Decimal(19, 4)`; el cálculo de total en el servicio usa `Decimal`/number con redondeo explícito | ✅ PASS |
| `DATABASE.md` §7.1 — Soft deletes con `deletedAt` | Queries filtran `deletedAt: null` por defecto en `Listing` y `ListingPhoto` | ✅ PASS |
| `DATABASE.md` §4.2 — OnDelete RESTRICT por defecto | Sin cambios; reutiliza relaciones existentes | ✅ PASS |
| `FRONTEND.md` §1 — Server-first, Client Components solo para interacción | Página `/listings/[slug]` es Server Component que precarga el detalle; Gallery, Calendar, PriceTable, ActionButtons son Client Components | ✅ PASS |
| `FRONTEND.md` §5.1 — React Query vía tRPC para estado de servidor | Detalle usa `api.listing.getBySlug.query` (Server Component) y `api.listing.getSimilar.useQuery` (Client Component para similares); no cachear manualmente | ✅ PASS |
| `FRONTEND.md` §10 — `nuqs` para parámetros de búsqueda en URL | Rango de fechas seleccionado (`start`, `end`) gestionado con `nuqs` como fuente de verdad, compartible y restaurable | ✅ PASS |
| `FRONTEND.md` §7 — Tailwind + tokens `DESIGN.md`, sin colores hardcodeados | Todos los componentes usan tokens `--ps-*` y clases Tailwind mapeadas | ✅ PASS |
| `FRONTEND.md` §8 — Accesibilidad WCAG AA, labels explícitos, foco visible | Carrusel, zoom, fullscreen, calendario, botones Contactar/Reservar, productos similares: labels, foco visible, navegación por teclado, alternativas no cromáticas | ✅ PASS |
| `FRONTEND.md` §9.1 — `next/image` para imágenes | Fotos de la galería se sirven con `next/image` con `sizes` apropiados | ✅ PASS |
| `TESTING.md` §2 — Pirámide: unitarios, integración, E2E | Unitarios para `listing-detail.service` (mappers, cálculo de precios derivados, validación de rango), integración con Testcontainers+PostGIS para `listing.router`, E2E con Playwright para flujo búsqueda→detalle→selección de fechas→Contactar/Reservar | ✅ PASS |
| `DESIGN.md` — Tokens `profesional-seguro`, accesibilidad | Detalle reutiliza tokens `--ps-*`, skeletons, estados vacíos, foco visible | ✅ PASS |

**Post-Phase 1 re-check**: El diseño de `data-model.md` y `contracts/listing-detail.md` no introduce violaciones. No se modifican tablas ni columnas (sin migración). El contrato tRPC sigue `BACKEND.md` §4 (routers delgados, Zod, sin Prisma crudo en respuestas, DTOs tipados `ListingDetailDTO` con solo campos públicos). Los procedimientos son `publicProcedure` conforme a `FR-001`. El rate limiting reutiliza `rate-limit.service.ts` con bucket `listing:ip` (100/min) conforme a `SECURITY.md` §5.2. Los Client Components siguen `FRONTEND.md` (Server-first con precarga en Server Component, `nuqs` para URL state del rango, React Query para similares, tokens `DESIGN.md`). El `ListingDetailDTO` no expone datos privados conforme a `SECURITY.md` §4.1. El incremento de `viewCount` es una mutación `publicProcedure` justificada (contador público, no sensible, idempotente por sesión/IP en el plan técnico). No se introducen violaciones que requieran justificación en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/005-listing-detail/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── listing-detail.md  # Phase 1 output
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created yet)
```

### Source Code (repository root)

```text
development/
├── prisma/
│   └── schema.prisma              # SIN CAMBIOS — reutiliza Listing, ListingPhoto, ListingAvailability, User, VerificationState, Category
├── src/
│   ├── app/
│   │   ├── (public)/              # Route group público existente
│   │   │   ├── layout.tsx         # SIN CAMBIOS — reutiliza layout público con header mínimo
│   │   │   └── listings/          # NUEVO — ruta dinámica de detalle
│   │   │       └── [slug]/
│   │   │           ├── page.tsx       # Server Component — detalle con precarga
│   │   │           ├── loading.tsx    # Skeleton de detalle
│   │   │           ├── error.tsx      # Error boundary de detalle
│   │   │           └── not-found.tsx  # 404 informativo para listings no publicados/inexistentes
│   │   └── api/trpc/[trpc]/
│   │       └── route.ts           # Sin cambios
│   ├── features/
│   │   └── listing-detail/        # NUEVO feature folder (patrón de features/search)
│   │       ├── application/
│   │       │   └── listing-detail.service.ts  # Lógica de detalle, similares, cálculo de precios derivados, validación de rango, incremento de vistas
│   │       ├── domain/
│   │       │   ├── listing-detail.ts          # Tipos de dominio (ListingDetailDTO, SimilarListingDTO, PriceTier, PriceEstimate)
│   │       │   └── price-tiers.ts             # Lógica pura de tramos derivados (1d/3d/7d con descuento)
│   │       ├── infrastructure/
│   │       │   └── listing-detail.repository.ts  # Queries Prisma: findBySlug, findSimilar, incrementView, findAvailability
│   │       ├── presentation/
│   │       │   ├── listing-detail-page.tsx    # Client Component — orquesta la ficha interactiva
│   │       │   ├── gallery.tsx                # Client Component — carrusel, zoom, fullscreen
│   │       │   ├── listing-header.tsx         # Componente — título, categoría, ubicación, badges
│   │       │   ├── description-section.tsx    # Componente — descripción y características
│   │       │   ├── calendar.tsx               # Client Component — selección de rango de fechas con bloqueos
│   │       │   ├── price-table.tsx            # Client Component — tabla de tramos derivados + total estimado
│   │       │   ├── owner-card.tsx             # Componente — perfil público del arrendador
│   │       │   ├── action-buttons.tsx         # Client Component — Contactar/Reservar con gating de login
│   │       │   ├── reviews-section.tsx        # Componente — reviews o estado vacío
│   │       │   ├── similar-listings.tsx       # Client Component — productos similares (React Query)
│   │       │   ├── insurance-section.tsx      # Componente — info de seguro o aviso
│   │       │   ├── rules-section.tsx          # Componente — reglas con defaults
│   │       │   ├── empty-section.tsx          # Estado vacío genérico para secciones sin datos
│   │       │   └── index.ts                   # Barrel exports
│   │       └── shared/
│   │           └── listing-detail.schema.ts   # Schemas Zod (slug, date range, price estimate input)
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   └── listing.router.ts          # NUEVO — listing.getBySlug, listing.getSimilar, listing.incrementView
│   │   │   └── root.ts                        # MODIFICADO — registra listingRouter
│   │   └── lib/
│   │       └── geo/
│   │           └── distance.ts                # Reutilizado — haversineDistanceKm para similares por zona
│   ├── lib/
│   │   └── validations/
│   │       └── listing-detail.ts              # Re-export de features/listing-detail/shared/listing-detail.schema.ts
│   ├── hooks/
│   │   └── use-date-range.ts                  # Hook sobre nuqs para rango de fechas en URL (start/end)
│   └── types/
│       └── listing-detail.ts                  # Tipos globales de presentación de detalle
├── tests/
│   ├── unit/
│   │   └── listing-detail/
│   │       ├── listing-detail.service.test.ts  # Mappers, cálculo de precios derivados, validación de rango
│   │       ├── price-tiers.test.ts             # Lógica pura de tramos derivados
│   │       └── listing-detail.schema.test.ts   # Validación Zod
│   └── integration/
│       └── listing-detail/
│           └── listing.router.integration.test.ts  # DB real + PostGIS, getBySlug, getSimilar, incrementView, 404
└── prisma/
    └── seed.ts                            # SIN CAMBIOS — reutiliza seed de 004-public-search
```

**Structure Decision**: Estructura web application existente bajo `development/`, respetando el patrón feature-based de `features/search` (subcarpetas `application/`, `domain/`, `infrastructure/`, `presentation/`, `shared/`). La nueva feature `listing-detail` sigue el mismo patrón. La ruta dinámica `/listings/[slug]` vive bajo el route group `(public)` existente, reutilizando el layout público con header mínimo. Los Client Components de detalle viven en `features/listing-detail/presentation/` siguiendo `FRONTEND.md` §2.2 ("colocar lo cerca de donde se usa"). El hook de cliente `use-date-range` vive en `hooks/` siguiendo `FRONTEND.md` §2.1. El estado de URL del rango de fechas se gestiona con `nuqs` (`FRONTEND.md` §10). El router tRPC `listing.router.ts` es delgado y delega en `listing-detail.service.ts` (`BACKEND.md` §2.1). No se modifica el schema Prisma ni se crean migraciones; toda la feature se apoya en los modelos existentes de `004-public-search`.

## Complexity Tracking

> No hay violaciones de la constitución que requieran justificación. Las decisiones técnicas (tramos derivados sin modelo nuevo, reglas con defaults, entry-points para Contactar/Reservar, incremento de vistas asíncrono) están justificadas en `research.md` y cumplen todos los documentos aplicables de `constitution/`.
