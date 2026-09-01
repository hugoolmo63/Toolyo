---

description: "Task list for Toolyo listing detail page"
---

# Tasks: Página de Detalle del Producto

**Input**: Design documents from `specs/005-listing-detail/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/listing-detail.md](contracts/listing-detail.md), [quickstart.md](quickstart.md)

**Organization**: Las tareas siguen las capas del plan y están etiquetadas por historia de usuario cuando implementan una entrega funcional. Incluye tests porque el proyecto sigue `constitution/TESTING.md` (pirámide: unitarios + integración + E2E).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- App code lives in `development/src/`
- Tests live in `development/tests/`
- Prisma schema at `development/prisma/schema.prisma` (SIN CAMBIOS en esta feature)
- Paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Esta feature no añade dependencias nuevas ni modifica el schema Prisma. El setup se limita a crear la estructura de carpetas de la feature y documentar la feature en el README.

- [X] T001 [P] Crear la estructura de carpetas de la feature `development/src/features/listing-detail/` con subcarpetas `application/`, `domain/`, `infrastructure/`, `presentation/`, `shared/` (patrón de `features/search/`).
- [X] T002 [P] Actualizar `development/README.md` para documentar la feature de detalle del producto: ruta `/listings/[slug]`, reutilización de modelos existentes, tramos de precios derivados, entry-points para Contactar/Reservar, y referencia a `specs/005-listing-detail/quickstart.md`.

---

## Phase 2: Foundational - Esquemas, tipos de dominio y lógica pura de precios

**Purpose**: Crear los esquemas Zod, los tipos de dominio (DTOs) y la lógica pura de tramos de precios derivados. Bloquea todas las historias de usuario porque el servicio y los componentes consumen estos tipos y schemas.

**Critical**: Completar antes de implementar servicios, router o UI.

- [X] T003 [P] Crear `development/src/features/listing-detail/shared/listing-detail.schema.ts` con los schemas Zod: `GetBySlugSchema` (slug string min 1 max 200), `GetSimilarSchema` (listingId cuid, categoryId cuid, city string nullable, lat number -90..90 nullable, lng number -180..180 nullable, limit int 1..12 default 6), `IncrementViewSchema` (listingId cuid), `DateRangeSchema` (start ISO date YYYY-MM-DD, end ISO date YYYY-MM-DD, end > start), y exportar tipos inferidos.
- [X] T004 [P] Crear `development/src/features/listing-detail/domain/listing-detail.ts` con los tipos de dominio: `ListingDetailDTO`, `OwnerDTO`, `ListingPhotoDTO`, `PriceTierDTO`, `SimilarListingDTO`, `PriceEstimate` (solo campos públicos, sin datos privados) conforme a `specs/005-listing-detail/data-model.md`.
- [X] T005 [P] Crear `development/src/features/listing-detail/domain/price-tiers.ts` con la lógica pura de tramos derivados: constante `PRICE_TIERS` (1d/0%, 3d/5%, 7d/10%), `derivePriceTiers(pricePerDay: number): PriceTierDTO[]`, `getApplicableTier(days: number, tiers: PriceTierDTO[]): PriceTierDTO` (N≤1→1d, 2≤N≤3→3d, N≥4→7d), `calculatePriceEstimate(pricePerDay, startDate, endDate, blockedDates): PriceEstimate` (calcula días, tramo aplicable, total, valida contra blockedDates). Funciones puras, redondeo a 2 decimales.
- [X] T006 [P] Crear `development/src/lib/validations/listing-detail.ts` re-exportando los schemas de `features/listing-detail/shared/listing-detail.schema.ts` para uso desde el router.
- [X] T007 [P] Crear `development/src/types/listing-detail.ts` re-exportando los tipos públicos de `features/listing-detail/domain/` para uso transversal en presentación.

### Tests for Foundational Phase

- [X] T008 [P] Crear `development/tests/unit/listing-detail/price-tiers.test.ts` con pruebas de: `derivePriceTiers` devuelve 3 tramos (1d/3d/7d) con descuentos 0%/5%/10% y totales correctos; `getApplicableTier` devuelve tramo correcto para 1, 2, 3, 4, 7, 10 días; `calculatePriceEstimate` calcula días entre dos fechas, aplica tramo correcto, calcula total, marca `isValid: false` cuando el rango incluye fechas bloqueadas, devuelve `blockedDatesInRange` correcto; redondeo a 2 decimales.
- [X] T009 [P] Crear `development/tests/unit/listing-detail/listing-detail.schema.test.ts` con pruebas de validación Zod: `GetBySlugSchema` acepta slug válido y rechaza vacío/longitud >200; `GetSimilarSchema` rechaza listingId no-cuid, lat fuera de rango, limit >12; `IncrementViewSchema` rechaza listingId no-cuid; `DateRangeSchema` acepta rango válido (end > start) y rechaza end < start, fechas mal formateadas.

**Checkpoint**: Esquemas Zod, tipos de dominio y lógica pura de precios listos con tests unitarios pasando. Servicio, router y UI pueden empezar a consumirlos.

---

## Phase 3: User Story 1 - Ver la ficha completa de un producto (Priority: P1) 🎯 MVP

**Goal**: Página de detalle pública en `/listings/[slug]` que muestra la galería, título, descripción, perfil del arrendador, reviews (o estado vacío), productos similares, información de seguro y reglas, accesible sin sesión.

**Independent Test**: Un visitante sin sesión abre `/listings/[slug]` de un listing publicado y ve la galería, el título, la descripción, el perfil del arrendador, las reviews (o estado vacío), los productos similares, la info de seguro y las reglas, sin ser redirigido a login ni ver errores técnicos.

### Tests for User Story 1

- [X] T010 [P] [US1] Crear `development/tests/unit/listing-detail/listing-detail.service.test.ts` con pruebas de: `getListingBySlug` devuelve `ListingDetailDTO` con todos los campos públicos para un listing publicado con owner active; devuelve `null` para listing inexistente, listing en estado `draft`/`paused`/`rejected`, listing con `deletedAt` no nulo, listing con owner `suspended`/`deleted`; mapeo a DTO no incluye datos privados (email, teléfono, dirección exacta, datos de pago); `priceTiers` derivados correctamente desde `pricePerDay`; `availability` contiene solo fechas bloqueadas futuras; `getSimilarListings` devuelve hasta 6 listings de misma categoría, excluye el listing actual, excluye no publicados, ordena por rating DESC.
- [X] T011 [P] [US1] Crear `development/tests/integration/listing-detail/listing.router.integration.test.ts` con pruebas con DB real + PostGIS: `listing.getBySlug` devuelve detalle completo para slug publicado, devuelve `null` para slug inexistente/no publicado; `listing.getSimilar` devuelve similares de misma categoría, excluye el actual, respeta `limit`; `listing.incrementView` incrementa `viewCount` en 1, deduplica por IP en ventana de 30 min (segunda llamada no incrementa), no incrementa para listing no publicado; rate limit responde 429 tras superar umbral; respuestas no contienen datos privados.

### Implementation for User Story 1

- [X] T012 [P] [US1] Crear `development/src/features/listing-detail/infrastructure/listing-detail.repository.ts` con funciones: `findListingBySlug(db, slug)` que usa Prisma `findUnique` con includes de `photos` (ordenadas por `order`, `deletedAt: null`), `owner` (select campos públicos), `category`, y `availability` (`blockedDate >= CURRENT_DATE`); filtra `status: published`, `deletedAt: null`, `owner.accountStatus: active`, `owner.deletedAt: null`; devuelve `null` si no cumple. `findSimilarListings(db, { listingId, categoryId, city, lat, lng, limit })` que busca listings `published` con owner `active`, excluye `listingId`, prioriza misma categoría, misma ciudad, y zona (PostGIS `ST_DWithin` 50km si lat/lng), ordena por `ratingAverage DESC, reviewCount DESC`, limit `limit`. `findAvailabilityByListingId(db, listingId)` que devuelve fechas bloqueadas futuras. `incrementListingView(db, listingId)` que ejecuta `UPDATE "Listing" SET "viewCount" = "viewCount" + 1 WHERE "id" = $1 AND "deletedAt" IS NULL AND "status" = 'published'` vía `$executeRaw`.
- [X] T013 [US1] Crear `development/src/features/listing-detail/application/listing-detail.service.ts` con: `getListingBySlug(db, slug)` que llama al repositorio, mapea a `ListingDetailDTO` (incluye `priceTiers` derivados vía `derivePriceTiers`, `availability` como array de ISO dates, `owner` con campos públicos y `isVerified` derivado de `VerificationState`), devuelve `null` si el repositorio devuelve null; `getSimilarListings(db, input)` que llama al repositorio y mapea a `SimilarListingDTO[]`; `incrementView(db, listingId, ip, sessionId?)` que deduplica por IP/sesión en ventana de 30 min (caché en memoria `Map` con TTL, clave `view:[listingId]:[ip|sessionId]`) y llama al repositorio fire-and-forget. Nunca exponer datos privados en el mapeo.
- [X] T014 [US1] Crear `development/src/server/api/routers/listing.router.ts` con `publicProcedure` para `listing.getBySlug` (input `GetBySlugSchema`, delega en `getListingBySlug`, rate limit `listing:ip:<ip>` 100/min), `listing.getSimilar` (input `GetSimilarSchema`, delega en `getSimilarListings`, rate limit 100/min), `listing.incrementView` (input `IncrementViewSchema`, mutación, delega en `incrementView`, rate limit 100/min), mapeando errores con `mapErrorToTRPC`.
- [X] T015 [US1] Modificar `development/src/server/api/root.ts` para registrar `listingRouter` como `listing` en el `appRouter`.
- [X] T016 [P] [US1] Crear `development/src/features/listing-detail/presentation/gallery.tsx` como Client Component con carrusel navegable (anterior/siguiente con botones accesibles y flechas de teclado), indicador "foto X de N", zoom (clic en imagen abre overlay con scroll/pan), fullscreen (botón con Fullscreen API, fallback a overlay), swipe en móvil, placeholders accesibles si no hay fotos o si una imagen no carga, `alt` en todas las imágenes, foco visible, Escape para cerrar overlay/fullscreen.
- [X] T017 [P] [US1] Crear `development/src/features/listing-detail/presentation/listing-header.tsx` como Componente que renderiza título, nombre de categoría, ubicación (ciudad + dirección aproximada si existe), badges (verificado, reserva instantánea si `isInstantBooking`), rating promedio y número de reviews. Solo campos públicos.
- [X] T018 [P] [US1] Crear `development/src/features/listing-detail/presentation/description-section.tsx` como Componente que renderiza la descripción completa y las características del producto en texto legible, sin truncado agresivo. Se omite si no hay descripción.
- [X] T019 [P] [US1] Crear `development/src/features/listing-detail/presentation/owner-card.tsx` como Componente que renderiza el perfil público del arrendador: foto (avatarUrl o placeholder), nombre (displayName o "Arrendador"), badge verificado, rating (si disponible), tiempo de respuesta (si disponible), número de transacciones (si disponible). Omite con "N/A" o estado neutro los campos no disponibles. Nunca email, teléfono ni datos privados.
- [X] T020 [P] [US1] Crear `development/src/features/listing-detail/presentation/reviews-section.tsx` como Componente que renderiza la sección de reviews: puntuación media, distribución de estrellas (1-5), reviews individuales con autor, comentario y fotos si las tuviera. Muestra estado vacío "Aún no hay reviews para este producto" si no hay reviews. (Esta feature solo renderiza; las reviews se obtienen del detalle precargado o de un futuro módulo §6.)
- [X] T021 [P] [US1] Crear `development/src/features/listing-detail/presentation/similar-listings.tsx` como Client Component que usa `api.listing.getSimilar.useQuery` con los datos del listing actual, renderiza hasta 6 tarjetas compactas (imagen, título, precio/día, rating, ciudad) enlazando a sus propios detalles, excluye el listing actual, muestra estado vacío u omisión si no hay similares.
- [X] T022 [P] [US1] Crear `development/src/features/listing-detail/presentation/insurance-section.tsx` como Componente que muestra información informativa del seguro aplicable y franquicia (si la categoría la tiene) cuando el arrendador está verificado; muestra aviso "El alquiler no incluye seguro de plataforma porque el arrendador no ha verificado su identidad" cuando no lo está. Informativo, sin contratar ni gestionar reclamaciones.
- [X] T023 [P] [US1] Crear `development/src/features/listing-detail/presentation/rules-section.tsx` como Componente que muestra las reglas del arrendador con defaults: política de cancelación "Flexible — Reembolso 100% hasta 24h antes" y horarios "Recogida y devolución acordadas con el arrendador tras confirmar la reserva", marcadas visualmente como valores por defecto.
- [X] T024 [P] [US1] Crear `development/src/features/listing-detail/presentation/empty-section.tsx` como Componente reutilizable que muestra un estado vacío útil con mensaje y (opcional) sugerencia, para secciones sin datos (reviews, similares, descripción).
- [X] T025 [P] [US1] Crear `development/src/features/listing-detail/presentation/listing-detail-page.tsx` como Client Component que orquesta `Gallery`, `ListingHeader`, `DescriptionSection`, `OwnerCard`, `ReviewsSection`, `SimilarListings`, `InsuranceSection`, `RulesSection` con el detalle precargado como props iniciales. Usa tokens `--ps-*`, skeletons durante carga de similares.
- [X] T026 [P] [US1] Crear `development/src/features/listing-detail/presentation/index.ts` como barrel exports de los componentes de presentación.
- [X] T027 [US1] Crear `development/src/app/(public)/listings/[slug]/page.tsx` como Server Component que lee `slug` de los params y `start`/`end` de los query params, llama a `getListingBySlug(prisma, slug)`, si devuelve `null` llama a `notFound()`, si devuelve el detalle dispara `incrementView` fire-and-forget (vía `api.listing.incrementView.query` o llamada directa al servicio), y renderiza el layout público + `ListingDetailPage` con el detalle precargado como props iniciales.
- [X] T028 [P] [US1] Crear `development/src/app/(public)/listings/[slug]/loading.tsx` con skeleton de detalle (placeholder de galería, título, descripción, perfil, secciones) conforme a `FRONTEND.md` §6.3.
- [X] T029 [P] [US1] Crear `development/src/app/(public)/listings/[slug]/error.tsx` como error boundary de detalle con mensaje genérico y botón de reintentar.
- [X] T030 [P] [US1] Crear `development/src/app/(public)/listings/[slug]/not-found.tsx` como página 404 informativa con mensaje "Este producto no está disponible o no existe", sin filtrar motivo interno (borrador vs. rechazado vs. eliminado).

**Checkpoint**: US1 permite abrir `/listings/[slug]` sin login, ver la ficha completa (galería, título, descripción, perfil, reviews o estado vacío, similares, seguro, reglas), navegar la galería con teclado, y recibir 404 para listings no publicados/inexistentes. No se exponen datos privados.

---

## Phase 4: User Story 2 - Consultar disponibilidad y precios (Priority: P1)

**Goal**: Calendario de disponibilidad interactivo con selección de rango de fechas (recogida y devolución) que marca fechas bloqueadas, y tabla de precios derivados con total estimado que se recalcula al cambiar el rango, reflejado en la URL.

**Independent Test**: Un visitante en la página de detalle selecciona un rango de fechas en el calendario, ve qué días están bloqueados, qué rango es válido, y el precio total estimado según los días seleccionados, sin necesidad de identificarse. El rango se refleja en la URL.

### Tests for User Story 2

- [X] T031 [P] [US2] Ampliar `development/tests/unit/listing-detail/listing-detail.service.test.ts` con pruebas de: validación de rango de fechas contra `availability` del listing (rango sin bloqueos → válido, rango con bloqueos → inválido con `blockedDatesInRange` correcto); cálculo de `PriceEstimate` para 1, 3, 5, 7 días con tramo aplicable correcto y total correcto; `calculatePriceEstimate` con rango vacío devuelve `isValid: false`.

### Implementation for User Story 2

- [X] T032 [P] [US2] Crear `development/src/hooks/use-date-range.ts` como hook sobre `nuqs` que lee y actualiza los query params `start` y `end` (ISO date YYYY-MM-DD) con tipado Zod y sincronización con el historial del navegador. Devuelve `{ start: string | null, end: string | null, setRange: (start, end) => void, clearRange: () => void }`.
- [X] T033 [P] [US2] Crear `development/src/features/listing-detail/presentation/calendar.tsx` como Client Component que renderiza un calendario mensual navegable (mes anterior/siguiente), marca fechas bloqueadas (`availability` precargado) como no disponibles (`aria-disabled`, clase `disabled`), permite seleccionar rango (clic fecha inicial + clic fecha final), resalta el rango, impide seleccionar fechas bloqueadas o pasadas, sincroniza con `?start`/`?end` vía `useDateRange`, accesible por teclado (flechas para navegar días, Enter para seleccionar).
- [X] T034 [P] [US2] Crear `development/src/features/listing-detail/presentation/price-table.tsx` como Client Component que renderiza la tabla de tramos derivados (1d/3d/7d con descuento y total) obtenidos del detalle precargado, y el total estimado para el rango seleccionado (usando `getApplicableTier` y `calculatePriceEstimate` de `domain/price-tiers.ts`). Recalcula sin recargar al cambiar el rango. Muestra tramo aplicable destacado. Si no hay rango seleccionado, muestra solo la tabla de tramos sin total.
- [X] T035 [US2] Integrar `Calendar` y `PriceTable` en `development/src/features/listing-detail/presentation/listing-detail-page.tsx`, pasando `availability` del detalle al calendario y `pricePerDay` + rango seleccionado al price-table. El rango se lee de la URL vía `useDateRange`.

**Checkpoint**: US2 permite seleccionar un rango de fechas en el calendario, ver fechas bloqueadas, ver el total estimado recalculado, y el rango se refleja en la URL (`?start=...&end=...`) para ser compartible y restaurable.

---

## Phase 5: User Story 3 - Iniciar contacto o reserva desde el detalle (Priority: P2)

**Goal**: Botones "Contactar" y "Reservar" como entry-points con gating de login no bloqueante, que preservan el contexto (listing + rango) en el callback y degradan con elegancia mostrando "próximamente" si los módulos destino no existen.

**Independent Test**: Un visitante sin sesión pulsa "Contactar" o "Reservar" y es redirigido a login con callback de retorno al detalle (preservando el rango en "Reservar"); un visitante logado es enrutado a `/messages` o `/checkout` (o ve "próximamente" si no existen).

### Implementation for User Story 3

- [X] T036 [P] [US3] Crear `development/src/features/listing-detail/presentation/action-buttons.tsx` como Client Component con botón "Contactar" (secundario) y "Reservar" (principal). "Contactar": si no hay sesión (verificar vía `useSession` o contexto de auth), redirige a `/auth?tab=login&callbackUrl=/listings/[slug]`; si hay sesión, redirige a `/messages?listing=[slug]`. "Reservar": si no hay sesión, redirige a `/auth?tab=login&callbackUrl=/listings/[slug]?start=...&end=...` (preserva rango de la URL); si hay sesión pero no hay rango válido, muestra mensaje "Selecciona un rango de fechas"; si hay rango válido, redirige a `/checkout?listing=[slug]&start=...&end=...`. Ambos con labels explícitos, foco visible, `aria-label`. Si las rutas destino no existen, la página destino muestra "próximamente" (no se maneja aquí, sino en las páginas destino futuras).
- [X] T037 [US3] Integrar `ActionButtons` en `development/src/features/listing-detail/presentation/listing-detail-page.tsx`, posicionados de forma prominente (sticky en móvil, sidebar en desktop), visibles sin scroll excesivo.

**Checkpoint**: US3 permite pulsar "Contactar" y "Reservar" con gating de login correcto, callback que preserva contexto, y degradación elegante si los módulos destino no existen.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validar seguridad, accesibilidad, integración, rendimiento y documentación antes del PR.

- [X] T038 [P] Crear `development/tests/e2e/listing-detail/listing-detail.spec.ts` con Playwright para: detalle de listing publicado sin login, navegación de galería (carrusel, zoom, fullscreen), selección de rango en calendario, recálculo de precio, URL refleja el rango, botones Contactar/Reservar con gating de login, 404 para slug inexistente, productos similares, secciones vacías (sin reviews). (Diferido si Playwright no está instalado.)
- [X] T039 [P] Configurar `development/tests/e2e/listing-detail/listing-detail-accessibility.spec.ts` con axe-core para la página de detalle (galería, calendario, botones, similares), verificando foco, labels, live regions, contraste y navegación por teclado. (Diferido si Playwright + axe-core no están instalados.)
- [X] T040 Ejecutar en `/development` `npm test` y `npm run test:integration`, cubriendo `development/tests/unit/listing-detail/` y `development/tests/integration/listing-detail/` y comprobando que `002-registration`, `003-login` y `004-public-search` siguen funcionando.
- [X] T041 Ejecutar `npx tsc --noEmit` y lint sobre `development/`, corrigiendo tipos, imports y reglas de Server/Client Components.
- [X] T042 Revisar `development/src/server` y tests buscando datos privados (email, teléfono, dirección exacta, datos de pago) en logs, fixtures y respuestas de detalle.
- [X] T043 Verificar rate limiting: 100 req/min por IP para `listing.getBySlug`, `listing.getSimilar` e `listing.incrementView`, y que el 429 incluye `retryAfterSeconds`.
- [X] T044 Verificar que solo listings `published` con owner `active` aparecen en el detalle (crear listings en otros estados y confirmar que devuelven 404).
- [X] T045 Verificar que `listing.incrementView` deduplica por IP en ventana de 30 min (dos llamadas seguidas no incrementan dos veces) y que fire-and-forget no bloquea el render del detalle.
- [X] T046 Actualizar `development/README.md` y `specs/005-listing-detail/quickstart.md` con la feature de detalle, comandos y criterios de validación.
- [X] T047 Verificar manualmente el flujo en móvil y desktop siguiendo `specs/005-listing-detail/quickstart.md` y registrar resultados.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Sin dependencias; prepara estructura de carpetas y documentación.
- **Phase 2 Foundational**: Depende de Setup y bloquea todas las historias (esquemas, tipos y lógica pura de precios).
- **Phase 3 US1 Ficha completa**: Depende de Foundational (necesita esquemas, tipos y `price-tiers`); introduce el repositorio, servicio, router y la página de detalle.
- **Phase 4 US2 Disponibilidad y precios**: Depende de US1 (necesita `ListingDetailPage` y el detalle precargado con `availability` y `pricePerDay`); añade calendario y tabla de precios.
- **Phase 5 US3 Contactar/Reservar**: Depende de US1 (necesita `ListingDetailPage`); independiente de US2 (los botones funcionan sin rango, pero "Reservar" preserva el rango si existe). Puede correr en paralelo con US2.
- **Phase 6 Polish**: Depende de todas las historias incluidas en la entrega.

### User Story Dependencies

- **US1 (P1)**: Tras Phase 2; es el núcleo del detalle (repositorio, servicio, router, página, componentes informativos).
- **US2 (P1)**: Tras US1; necesita `ListingDetailPage` y el detalle precargado para añadir calendario y tabla de precios.
- **US3 (P2)**: Tras US1; necesita `ListingDetailPage` para añadir los botones. Independiente de US2 (puede correr en paralelo con US2).

### Within Each User Story

- Tests antes de implementación (TDD donde sea viable).
- Schemas Zod antes de servicios.
- Repositorios antes de servicios.
- Servicios antes de routers.
- Routers antes de UI.
- UI antes de integración E2E.

### Parallel Opportunities

- T001, T002 pueden ejecutarse en paralelo (archivos distintos).
- T003, T004, T005, T006, T007 pueden ejecutarse en paralelo (archivos distintos).
- T008, T009 pueden ejecutarse en paralelo (archivos de test distintos).
- T010, T011 pueden ejecutarse en paralelo (archivos de test distintos).
- T016, T017, T018, T019, T020, T021, T022, T023, T024 pueden ejecutarse en paralelo (componentes distintos).
- T028, T029, T030 pueden ejecutarse en paralelo (archivos de ruta distintos).
- T031 puede ejecutarse en paralelo con T032, T033, T034 (test vs hook/componentes distintos).
- T032, T033, T034 pueden ejecutarse en paralelo (hook y componentes distintos).
- T036 puede ejecutarse en paralelo con T031-T035 (US3 vs US2, archivos distintos).
- T038, T039 pueden ejecutarse en paralelo (specs E2E distintos).

## Parallel Example: User Story 1

```text
Task: "Crear pruebas unitarias de listing-detail.service en development/tests/unit/listing-detail/listing-detail.service.test.ts"
Task: "Crear pruebas de integración de listing.router en development/tests/integration/listing-detail/listing.router.integration.test.ts"
Task: "Crear listing-detail.repository en development/src/features/listing-detail/infrastructure/listing-detail.repository.ts"
Task: "Crear Gallery en development/src/features/listing-detail/presentation/gallery.tsx"
Task: "Crear ListingHeader en development/src/features/listing-detail/presentation/listing-header.tsx"
Task: "Crear DescriptionSection en development/src/features/listing-detail/presentation/description-section.tsx"
Task: "Crear OwnerCard en development/src/features/listing-detail/presentation/owner-card.tsx"
Task: "Crear ReviewsSection en development/src/features/listing-detail/presentation/reviews-section.tsx"
Task: "Crear SimilarListings en development/src/features/listing-detail/presentation/similar-listings.tsx"
Task: "Crear InsuranceSection en development/src/features/listing-detail/presentation/insurance-section.tsx"
Task: "Crear RulesSection en development/src/features/listing-detail/presentation/rules-section.tsx"
```

## Parallel Example: User Story 2 + User Story 3

```text
# US2 y US3 pueden ejecutarse en paralelo tras US1:
Task (US2): "Crear useDateRange hook en development/src/hooks/use-date-range.ts"
Task (US2): "Crear Calendar en development/src/features/listing-detail/presentation/calendar.tsx"
Task (US2): "Crear PriceTable en development/src/features/listing-detail/presentation/price-table.tsx"
Task (US3): "Crear ActionButtons en development/src/features/listing-detail/presentation/action-buttons.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (carpetas, README).
2. Completar Phase 2: Foundational (esquemas, tipos, price-tiers, tests unitarios).
3. Completar Phase 3: User Story 1 (repositorio, servicio, router, página, componentes informativos).
4. **STOP and VALIDATE**: Test User Story 1 independientemente — abrir `/listings/[slug]` sin login y ver la ficha completa.
5. Deploy/demo si ready.

### Incremental Delivery

1. Entregar ficha completa con galería, descripción, perfil, reviews (o estado vacío), similares, seguro y reglas.
2. Añadir calendario de disponibilidad + tabla de precios con total estimado.
3. Añadir botones Contactar/Reservar con gating de login.
4. Completar E2E, axe y auditoría de seguridad.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: User Story 1 (núcleo del detalle)
3. Once US1 is done:
   - Developer A: User Story 2 (calendario + precios)
   - Developer B: User Story 3 (botones Contactar/Reservar) — independiente de US2
4. Stories complete and integrate independently.

## Notes

- Todas las tareas incluyen checkbox, ID, etiquetas de historia cuando aplican y rutas concretas.
- Las tareas de test se incluyen porque `constitution/TESTING.md` exige pruebas unitarias e integración; deben escribirse antes de la implementación de su unidad cuando sea viable.
- Esta feature NO modifica el schema Prisma ni crea migraciones; reutiliza los modelos de `004-public-search` y `002-registration`.
- Los tramos de precios escalonados se derivan desde `pricePerDay` (sin persistir tramos custom); la persistencia de `ListingPriceTier` se difiere a la feature de listings §2.
- Las reglas del arrendador se renderizan con defaults (Flexible + horarios genéricos); los campos `cancellationPolicy`/`pickupReturnHours` se difieren a la feature de listings §2.
- Los botones "Contactar" y "Reservar" son entry-points que enrutan a `/messages` y `/checkout` (futuros); muestran "próximamente" si los módulos §5/§4 no existen.
- El incremento de `viewCount` se deduplica por IP/sesión en ventana de 30 min y se ejecuta fire-and-forget para no añadir latencia al render.
- No se incluye la creación/gestión de listings (§2), el chat (§5), las reservas/pagos (§4), las reviews (§6) ni los seguros (§7); esta feature consume los datos públicos que aquellos produzcan y muestra estados vacíos/placeholder cuando no hay datos.
