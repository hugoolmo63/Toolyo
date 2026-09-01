# Research: Página de Detalle del Producto

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-01

## Dependencia: reutilización del modelo `Listing` de `004-public-search`

**Decisión**: Esta feature **no introduce cambios en el schema Prisma**. Reutiliza los modelos `Listing`, `ListingPhoto`, `ListingAvailability`, `User`, `VerificationState` y `Category` ya existentes de `004-public-search` y `002-registration`. El único efecto de escritura es el incremento del contador `viewCount` en `Listing` (operación `UPDATE`).

**Rationale**: El modelo `Listing` introducido en `004-public-search` ya contiene todos los campos públicos necesarios para servir el detalle: `title`, `slug`, `description`, `pricePerDay`, `lat`/`lng`/`city`/`addressText`, `status`, `ratingAverage`, `reviewCount`, `viewCount`, `isInstantBooking`, relaciones a `owner` (User), `category` (Category), `photos` (ListingPhoto) y `availability` (ListingAvailability). No hay necesidad de añadir columnas ni tablas para esta feature. Las decisiones de alcance (tramos derivados sin `ListingPriceTier`, reglas con defaults sin `cancellationPolicy`/`pickupReturnHours`) se tomaron con el usuario en `/speckit-specify` y se documentan más abajo.

**Alternativas consideradas**:
- Introducir `ListingPriceTier` para tramos escalonados persistidos: descartado por decisión del usuario (Q1: opción C — tramos derivados por defecto). Solapa con la feature de listings §2.
- Introducir campos `cancellationPolicy`/`pickupReturnHours` en `Listing`: descartado. Se renderizan defaults (Flexible + horarios genéricos) hasta que la feature de listings §2 los introduzca.
- Introducir modelo `Review` ahora: descartado. Esta feature solo **lee** reviews si existieran; el modelo `Review` y su flujo de creación pertenecen al módulo de reviews (§6). Mientras no exista, se muestra estado vacío.

## Tramos de precios derivados desde `pricePerDay` (Q1: opción C)

**Decisión**: La tabla de precios se **deriva por defecto** desde `pricePerDay` en el servicio, sin persistir tramos custom. Se muestran tres tramos informativos (1 día, 3 días, 7 días) calculados linealmente desde `pricePerDay` con un descuento automático creciente por tramo para reflejar "más días, menor precio/día":

| Tramo | Días | Descuento sobre `pricePerDay` | Precio/día efectivo | Total |
|-------|------|-------------------------------|---------------------|-------|
| 1 día | 1 | 0% | `pricePerDay` | `pricePerDay × 1` |
| 3 días | 3 | 5% | `pricePerDay × 0.95` | `pricePerDay × 0.95 × 3` |
| 7 días | 7 | 10% | `pricePerDay × 0.90` | `pricePerDay × 0.90 × 7` |

Para un rango seleccionado de N días, el tramo aplicable es:
- N ≤ 1 → tramo 1 día (sin descuento)
- 2 ≤ N ≤ 3 → tramo 3 días (5%)
- N ≥ 4 → tramo 7 días (10%)

El cálculo es **puro** y vive en `domain/price-tiers.ts`, testeable unitariamente sin DB. Los porcentajes (0%, 5%, 10%) son defaults razonables alineados con prácticas comunes de alquiler (descuentos por volumen); se definen como constantes configurables en el código para poder ajustarlos sin tocar la lógica. La persistencia de tramos custom (`ListingPriceTier`) queda diferida a la feature de listings (§2).

**Rationale**: El MVP (§10) dice "precio fijo por día (sin escalonado en MVP)", pero DET-004 pide "tabla de precios escalonados (días vs. precio/día vs. total)". La opción C (híbrido) resuelve esta tensión: muestra una tabla escalonada informativa sin tocar el modelo ni inflar el alcance. El descuento automático creciente refleja el comportamiento esperado de "más días, menor precio/día" sin requerir configuración del arrendador. Cuando la feature de listings §2 introduzca `ListingPriceTier`, el servicio podrá preferir tramos persistidos si existen y caer a los derivados si no.

**Alternativas consideradas**:
- Solo `pricePerDay` sin tramos (opción A): descartado por el usuario. No cumple DET-004.
- Extender con `ListingPriceTier` persistido (opción B): descartado por el usuario. Solapa con §2 e infla el alcance.
- Tramos derivados sin descuento (solo lineal): descartado. No refleja el comportamiento esperado de "más días, menor precio/día" y hace la tabla escalonada trivial (todos los tramos tienen el mismo precio/día).

## Botones "Contactar" y "Reservar" como entry-points (Q2 y Q3: opción A)

**Decisión**: Los botones "Contactar" y "Reservar" son **entry-points** con gating de login, no implementan los flujos completos de chat (§5) ni reservas/pagos (§4).

- **Contactar**: si el visitante no está logado, redirige a `/auth?tab=login&callbackUrl=/listings/[slug]` (login no bloqueante con callback de retorno). Si está logado, redirige a `/messages?listing=[slug]`. Si la ruta `/messages` no existe aún (módulo de chat §5 no construido), la página muestra un estado informativo "Esta funcionalidad estará disponible próximamente" sin errores, y el visitante puede volver a la ficha.
- **Reservar**: si el visitante no está logado, redirige a `/auth?tab=login&callbackUrl=/listings/[slug]?start=...&end=...` (preserva el rango seleccionado en el callback). Si está logado pero no hay rango válido seleccionado, muestra un mensaje indicando que seleccione un rango. Si hay rango válido, redirige a `/checkout?listing=[slug]&start=[fecha]&end=[fecha]`. Si la ruta `/checkout` no existe aún (módulo de reservas/pagos §4 no construido), la página muestra un estado informativo "próximamente".

**Rationale**: Los módulos de chat (§5) y reservas/pagos (§4) no están construidos en el estado actual del proyecto. Implementar chat mínimo (polling) o solicitud de reserva manual mínima (opciones B) habría inflado el alcance de esta feature y solapado con esos módulos. La opción A (entry-points) proporciona los botones de conversión del detalle con gating de login correcto, preserva el contexto (listing + rango) en el callback, y degrada con elegancia mostrando "próximamente" mientras los módulos destino no existan. Cuando se construyan §4 y §5, solo habrá que crear las rutas `/checkout` y `/messages`; los entry-points del detalle ya enrutarán correctamente.

**Alternativas consideradas**:
- Chat mínimo por polling (Q2 opción B): descartado por el usuario. Requiere tabla `Message`, hilo de conversación, polling 30s. Solapa con §5.
- Solicitud de reserva manual mínima sin pago (Q3 opción B): descartado por el usuario. Requiere tabla `Booking`, estados pendiente/aprobado/rechazado, aprobación manual. Solapa con §4.
- No mostrar los botones hasta que §4/§5 existan: descartado. DET-006 y DET-007 los exigen, y el detalle sin botones de acción reduce la conversión percibida.

## Reglas del arrendador con defaults (FR-013)

**Decisión**: La sección de reglas muestra **valores por defecto** sin extender el modelo `Listing`:
- **Política de cancelación**: "Flexible — Reembolso 100% hasta 24h antes de la recogida" (default). Cuando la feature de listings §2 introduzca el campo `cancellationPolicy` en `Listing`, el servicio podrá leerlo y mostrar la política configurada; hasta entonces, se muestra el default.
- **Horarios de recogida/devolución**: "Recogida y devolución acordadas con el arrendador tras confirmar la reserva" (default genérico). Cuando §2 introduzca `pickupReturnHours`, se mostrará el configurado.

**Rationale**: DET-011 exige mostrar las reglas del arrendador. El modelo `Listing` actual no tiene campos de reglas. Introducirlos ahora solaparía con la feature de listings §2 (que gestiona la creación/edición del listing y configurará estos campos). Mostrar defaults claros cumple DET-011 sin inflar el alcance ni tocar el schema. Los defaults se marcan visualmente como "valores por defecto" para que el visitante sepa que pueden cambiar al confirmar la reserva.

**Alternativas consideradas**:
- Introducir `cancellationPolicy`/`pickupReturnHours` en `Listing` ahora: descartado. Solapa con §2.
- Ocultar la sección de reglas hasta que §2 exista: descartado. DET-011 la exige.
- Hardcodear reglas por categoría: descartado. Las reglas son por arrendador, no por categoría.

## Incremento del contador de vistas (`viewCount`)

**Decisión**: El contador `viewCount` del listing se incrementa al renderizar su detalle público. El mecanismo de deduplicación es **por sesión/IP con ventana de tiempo**: un mismo visitante (identificado por IP o por sesión si está logado) solo incrementa el contador una vez por listing en una ventana de 30 minutos. La implementación usa una caché en memoria (`Map` con TTL 30 min, clave `view:[listingId]:[ip|sessionId]`) en el servidor, reutilizando el patrón de caché de `geocoding.repository.ts`. El incremento se hace con `UPDATE "Listing" SET "viewCount" = "viewCount" + 1 WHERE "id" = $1 AND "deletedAt" IS NULL` vía Prisma `$executeRaw`, y se ejecuta de forma **no bloqueante** (fire-and-forget con `catch` silencioso) para no añadir latencia al render del detalle.

**Rationale**: `FR-018` exige incrementar `viewCount` para alimentar la ordenación "Más popular" de la búsqueda. Sin deduplicación, un visitante que recargue la página 100 veces inflaría artificialmente el contador. La ventana de 30 min es un balance entre precisión (cuenta visitas reales) y simplicidad (no requiere persistir un log de vistas por visitante). La caché en memoria es suficiente para una sola instancia; para multiinstancia se migraría a Redis (configurable vía `RATE_LIMIT_STORE` ya existente). El fire-and-forget evita que un fallo en el incremento bloquee el render del detalle.

**Alternativas consideradas**:
- Incrementar en cada render sin deduplicación: descartado por inflación artificial con recargas.
- Tabla `ListingView` con log por visitante: descartado por alcance (añade tabla + migración) y por volumen de escritura. Se considera para Fase 2 si se necesita analytics detallado.
- Incrementar solo en cliente (post-load): descartado por `SECURITY.md` §1.6 (el cliente no toca la DB) y por fiabilidad (ad-blockers bloquearían la llamada).
- Incrementar en el Server Component de forma síncrona: descartado por latencia añadida al TTFB. Fire-and-forget es preferible.

## Galería de imágenes: carrusel, zoom, fullscreen

**Decisión**: La galería se implementa como Client Component con:
- **Carrusel**: navegación anterior/siguiente con botones accesibles (labels, foco visible, teclado), indicador "foto X de N", swipe en móvil.
- **Zoom**: clic en la imagen activa abre un overlay con la imagen a tamaño completo y scroll/pan para hacer zoom. Degradación: si la imagen no carga, placeholder con `alt`.
- **Fullscreen**: botón "Pantalla completa" que usa la Fullscreen API del navegador; si no está disponible (ej. iOS Safari), cae al overlay de zoom.

**Rationale**: DET-001 exige carrusel, zoom y fullscreen. Sin librerías externas (sin añadir dependencias), se implementa con estado de cliente React + APIs del navegador. El carrusel usa transform CSS para transiciones suaves. El zoom usa un overlay con `object-fit: contain` y scroll para pan. Fullscreen usa `requestFullscreen()` con fallback al overlay. La accesibilidad (FR-014) requiere que todos los controles sean navegables por teclado (flechas para anterior/siguiente, Escape para cerrar overlay/fullscreen).

**Alternativas consideradas**:
- `swiper`/`embla-carousel`: viables pero añaden dependencias. La constitución no las prescribe y el carrusel básico es implementable sin ellas.
- `react-zoom-pan-pinch`: viable pero añade dependencia. El zoom básico con overlay es suficiente para el alcance.
- Lightbox externo (ej. `yet-another-react-lightbox`): viable pero añade dependencia. Se considera para Fase 2 si se necesitan features avanzadas (pinch-zoom en móvil, thumbnails, etc.).

## Calendario de disponibilidad interactivo

**Decisión**: El calendario se implementa como Client Component que:
- Consulta los bloqueos del listing (`ListingAvailability`) precargados desde el Server Component (todos los bloqueos futuros del listing en una sola query).
- Renderiza un calendario mensual navegable (mes anterior/siguiente) con fechas bloqueadas marcadas visualmente (clase `disabled`, `aria-disabled="true"`, color `--ps-neutral-400`).
- Permite seleccionar un rango (fecha de recogida y fecha de devolución) con clic en fecha inicial y clic en fecha final; el rango se resalta.
- Impide seleccionar fechas bloqueadas o pasadas: si el visitante intenta seleccionar una fecha bloqueada, se marca el rango como inválido y se indica qué fecha está bloqueada.
- Sincroniza el rango con la URL vía `nuqs` (`?start=YYYY-MM-DD&end=YYYY-MM-DD`) para que sea compartible y restaurable.
- Recalcula el precio total al cambiar el rango (llamada pura a `price-tiers.ts`).

**Rationale**: DET-003 exige un calendario interactivo con selección de fechas de recogida y devolución. Sin librerías externas (sin añadir dependencias), se implementa con estado de cliente React. Precargar todos los bloqueos futuros del listing en el Server Component evita una llamada por mes navegado. La validación contra `ListingAvailability` es informativa (la confirmación real de la reserva se hace en §4). El estado en la URL cumple `FR-005` (compartible y restaurable).

**Alternativas consideradas**:
- `react-day-picker`/`react-calendar`: viables pero añaden dependencias. El calendario básico es implementable sin ellas.
- Cargar bloqueos por mes bajo demanda: descartado por complejidad y por latencia añadida. Precargar todos los bloqueos futuros es una sola query ligera (un listing tiene como máximo ~365 bloqueos/año).
- Selección de rango con drag: descartado por accesibilidad (drag no es navegable por teclado). Clic en fecha inicial + clic en fecha final es accesible.

## Productos similares: misma categoría y/o misma zona

**Decisión**: Los productos similares se obtienen con un procedimiento tRPC `listing.getSimilar` que:
- Excluye el listing actual (`id != currentId`).
- Filtra listings `published` AND `deletedAt IS NULL` con owner `active` (mismo `BASE_WHERE` que la búsqueda).
- Prioriza por: (1) misma categoría (`categoryId = currentCategoryId`), (2) misma ciudad (`city = currentCity`), (3) misma zona (PostGIS `ST_DWithin` con radio 50km si el listing actual tiene `location`).
- Ordena por relevancia (rating + popularidad) y limita a 6 resultados.
- Devuelve `SimilarListingDTO` (campos mínimos: id, slug, title, pricePerDay, primaryPhotoUrl, ratingAverage, city) para renderizar tarjetas compactas que enlazan al detalle.

**Rationale**: DET-009 exige productos similares en la misma zona/categoría. Reutilizar el `BASE_WHERE` y los helpers de `004-public-search` (joins de owner, verificación, foto principal) mantiene consistencia. La priorización (categoría → ciudad → zona) refleja la intuición de "similar". El límite de 6 evita sobrecargar la ficha. El DTO mínimo reutiliza la estructura de `SearchResultDTO` simplificada.

**Alternativas consideradas**:
- Solo misma categoría: descartado. DET-009 pide "misma zona/categoría".
- Solo misma zona (PostGIS): descartado. Listings sin `location` no tendrían similares.
- Recomendación personalizada (ML): descartado por alcance. Se considera para Fase 2.

## Estado del rango de fechas en URL con `nuqs`

**Decisión**: El rango de fechas seleccionado (recogida y devolución) se gestiona con `nuqs` y se codifica en la URL como query params `?start=YYYY-MM-DD&end=YYYY-MM-DD`. El hook `use-date-range.ts` lee y actualiza estos params con tipado Zod y sincronización con el historial del navegador.

**Rationale**: `FRONTEND.md` §10 prescribe `nuqs` para parámetros de búsqueda en URL. `FR-005` exige que el rango se refleje en la URL para ser compartible y restaurable. `nuqs` integra con App Router y permite tipar los query params. El Server Component de la página lee los params en el primer render para precargar el cálculo de precio; el Client Component (Calendar) actualiza los params al interactuar.

**Alternativas consideradas**:
- `useSearchParams` nativo: viable pero más verboso y sin tipado. `nuqs` añade tipado y sincronización con el historial.
- Estado en Zustand + sync manual: descartado por duplicación de fuente de verdad.
- Estado solo en cliente sin URL: descartado por `FR-005` (no es compartible ni restaurable).

## 404 para listings no publicados/inexistentes

**Decisión**: Cuando se accede a la URL de un listing que no existe, fue eliminado (`deletedAt IS NOT NULL`), no está publicado (`status != published`) o cuyo arrendador está suspendido/eliminado (`accountStatus != active`), el servicio devuelve `null` y el Server Component renderiza la página `not-found.tsx` con `notFound()` de Next.js, produciendo un 404 HTTP informativo. El mensaje no filtra el motivo interno (borrador vs. rechazado vs. eliminado) por privacidad.

**Rationale**: `FR-017` exige un 404 informativo sin filtrar el motivo interno. Usar `notFound()` de Next.js produce un 404 HTTP correcto y renderiza `not-found.tsx` con un mensaje genérico ("Este producto no está disponible o no existe"). El servicio devuelve `null` (no un error) para que el Server Component decida llamar a `notFound()`; esto evita que un listing en borrador produzca un 500.

**Alternativas consideradas**:
- Devolver un error 403 con motivo: descartado por filtrar estado interno (borrador vs. rechazado).
- Renderizar la ficha con un aviso "no disponible": descartado. Un listing en borrador no debe ser visible públicamente de ninguna forma.
- Redirigir a la búsqueda: descartado. El visitante puede haber llegado desde un enlace compartido y debe saber que el producto no existe, no ser redirigido sin explicación.
