# Data Model: Búsqueda Pública y Página de Inicio

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-01

## Entidades nuevas

### Listing

Publicación de un producto disponible para alquiler. Esta feature introduce el modelo mínimo necesario para servir resultados de búsqueda pública; la feature de listings (§2) lo extenderá con wizard de creación, precios escalonados, calendario completo, etc.

| Campo | Tipo | Constraints | Notas |
|-------|------|-------------|-------|
| `id` | String | `@id @default(cuid())` | Identificador interno |
| `ownerId` | String | FK → `User.id`, `onDelete: Restrict` | Arrendador; si se borra el usuario, no se borran sus listings (RESTRICT) |
| `categoryId` | String | FK → `Category.id`, `onDelete: Restrict` | Categoría del listing |
| `title` | String | not null, max 80 | Título del producto |
| `slug` | String | `@unique`, kebab-case | Slug derivado del título, inmutable tras creación |
| `description` | String `@db.Text` | nullable | Descripción enriquecida (markdown ligero en la feature de listings) |
| `pricePerDay` | Decimal | `@db.Decimal(19, 4)`, not null | Precio por día en EUR (moneda base). La feature de listings añadirá precios escalonados |
| `location` | Unsupported("geometry(Point, 4326)") | nullable | Punto geoespacial PostGIS para búsquedas por proximidad |
| `lat` | Decimal | `@db.Decimal(10, 7)`, nullable | Latitud en WGS84; duplicado del Point para queries sin PostGIS |
| `lng` | Decimal | `@db.Decimal(10, 7)`, nullable | Longitud en WGS84; duplicado del Point para queries sin PostGIS |
| `addressText` | String | nullable | Dirección textual aproximada (no exacta, para privacidad del arrendador) |
| `city` | String | nullable | Ciudad resuelta por geocoding, para autocompletado de ubicaciones |
| `status` | ListingStatus | not null, default `draft` | Estado de publicación; solo `published` aparece en búsqueda pública |
| `ratingAverage` | Decimal | `@db.Decimal(3, 2)`, default 0 | Rating promedio desnormalizado (actualizado por la feature de reviews) |
| `reviewCount` | Int | default 0 | Número de reviews desnormalizado |
| `viewCount` | Int | default 0 | Contador de vistas desnormalizado (para "Más popular") |
| `isInstantBooking` | Boolean | default false | Reserva instantánea (solo para usuarios verificados; la feature de listings lo configurará) |
| `createdAt` | DateTime | `@default(now()) @db.Timestamptz(6)` | Auditoría |
| `updatedAt` | DateTime | `@updatedAt @db.Timestamptz(6)` | Auditoría |
| `deletedAt` | DateTime | `@db.Timestamptz(6)`, nullable | Soft delete (`DATABASE.md` §7.1) |

**Enum `ListingStatus`**:
```prisma
enum ListingStatus {
  draft
  in_review
  published
  paused
  rejected
}
```

**Índices**:
- `@@unique([slug])` — búsqueda por slug en detalle del producto
- `@@index([status, deletedAt])` — filtrar listings publicados y no eliminados (query principal de búsqueda)
- `@@index([categoryId, status, deletedAt])` — filtro por categoría + estado
- `@@index([ownerId, status])` — dashboard del arrendador (futuro)
- `@@index([pricePerDay])` — filtro de precio máximo
- `@@index([ratingAverage])` — filtro y ordenación por rating
- GiST index sobre `location` — creado en migración SQL para `ST_DWithin` y `ST_Distance`

**Relaciones**:
- `User` 1 — N `Listing` (un arrendador tiene múltiples listings; `ownerId` FK)
- `Category` 1 — N `Listing` (una categoría tiene múltiples listings; `categoryId` FK)
- `Listing` 1 — N `ListingPhoto` (un listing tiene múltiples fotos; `onDelete: Cascade`)
- `Listing` 1 — N `ListingAvailability` (un listing tiene múltiples bloqueos de calendario; `onDelete: Cascade`)

**Reglas de negocio**:
- Solo listings con `status = published` AND `deletedAt IS NULL` aparecen en búsqueda pública.
- Solo listings cuyo `owner` tiene `accountStatus = active` AND `deletedAt IS NULL` aparecen en búsqueda pública.
- `location`, `lat`, `lng` se establecen al crear/editar el listing (feature de listings §2); la búsqueda los lee.
- `ratingAverage` y `reviewCount` son campos desnormalizados actualizados por la feature de reviews (§6); la búsqueda los lee para ordenación y filtro.
- `viewCount` se incrementa al ver el detalle del producto (§3.3); la búsqueda lo lee para ordenación "Más popular".

### ListingPhoto

Fotos de un listing. Esta feature solo necesita la primera foto (imagen principal) para la tarjeta de resultado; la feature de listings (§2) añadirá hasta 10 fotos con ordenación drag & drop.

| Campo | Tipo | Constraints | Notas |
|-------|------|-------------|-------|
| `id` | String | `@id @default(cuid())` | Identificador interno |
| `listingId` | String | FK → `Listing.id`, `onDelete: Cascade` | Si se borra el listing, se borran sus fotos |
| `url` | String | not null | URL de la imagen (CDN/storage) |
| `altText` | String | nullable | Texto alternativo para accesibilidad |
| `order` | Int | default 0 | Orden de la foto (0 = principal) |
| `createdAt` | DateTime | `@default(now()) @db.Timestamptz(6)` | Auditoría |
| `updatedAt` | DateTime | `@updatedAt @db.Timestamptz(6)` | Auditoría |
| `deletedAt` | DateTime | `@db.Timestamptz(6)`, nullable | Soft delete |

**Índices**:
- `@@index([listingId, order, deletedAt])` — obtener fotos de un listing ordenadas

**Relaciones**:
- `Listing` 1 — N `ListingPhoto`

### ListingAvailability

Bloqueos de calendario de un listing (fechas no disponibles). Esta feature usa esta tabla para filtrar listings con disponibilidad en un rango de fechas; la feature de listings (§2) añadirá el calendario completo con bloqueos manuales.

| Campo | Tipo | Constraints | Notas |
|-------|------|-------------|-------|
| `id` | String | `@id @default(cuid())` | Identificador interno |
| `listingId` | String | FK → `Listing.id`, `onDelete: Cascade` | Si se borra el listing, se borran sus bloqueos |
| `blockedDate` | DateTime | `@db.Date`, not null | Fecha bloqueada (sin hora) |
| `reason` | String | nullable | Motivo del bloqueo (manual, reserva confirmada, etc.) |
| `createdAt` | DateTime | `@default(now()) @db.Timestamptz(6)` | Auditoría |
| `updatedAt` | DateTime | `@updatedAt @db.Timestamptz(6)` | Auditoría |

**Índices**:
- `@@unique([listingId, blockedDate])` — un listing no puede tener dos bloqueos para la misma fecha
- `@@index([listingId, blockedDate])` — consultar bloqueos de un listing en un rango

**Relaciones**:
- `Listing` 1 — N `ListingAvailability`

**Reglas de negocio**:
- Un listing pasa el filtro de rango de fechas si no tiene ningún `ListingAvailability` con `blockedDate` dentro del rango solicitado (recogida a devolución, ambos extremos excluidos si se solapa con un bloqueo).
- Un listing sin ningún registro en `ListingAvailability` se considera disponible siempre.

## Entidades reutilizadas (sin cambios)

### User (de `002-registration`)

Se consulta para filtrar listings por `accountStatus = active` AND `deletedAt IS NULL` (arrendadores válidos) y para obtener el badge de verificación (filtro "Solo usuarios verificados"). En la búsqueda pública solo se exponen campos públicos: `id` (para avatar/nombre en futura feature de perfil), badge de verificación (derivado de `VerificationState` con `channel = identity` y `status = verified`). Nunca se expone `emailNormalized`, `phoneE164` ni otros datos privados.

### VerificationState (de `002-registration`)

Se consulta el `VerificationState` con `channel = identity` y `status = verified` del arrendador para determinar si un listing debe incluirse cuando el filtro "Solo usuarios verificados" está activo.

### Category (del scaffold existente)

Se consulta para el autocompletado de categorías y para el filtro de categoría. Se reutiliza el modelo `Category` existente con su árbol jerárquico (`parentId`, `children`).

## Cambios en el schema Prisma

1. Añadir los modelos `Listing`, `ListingPhoto`, `ListingAvailability` y el enum `ListingStatus` a `development/prisma/schema.prisma`.
2. Añadir las relaciones `listings Listing[]` en `User` y `Category`.
3. Crear una migración `20260901_listing_search` que:
   - Habilita la extensión PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
   - Crea las tablas `Listing`, `ListingPhoto`, `ListingAvailability` con sus columnas, constraints e índices.
   - Crea el índice GiST sobre `location`: `CREATE INDEX idx_listing_location_gist ON "Listing" USING GIST ("location");`
   - El campo `location` se crea como `geometry(Point, 4326)` en SQL raw ya que Prisma no soporta el tipo nativamente (`Unsupported`).
4. No modifica ni elimina modelos existentes.

## Diagrama de relaciones

```text
User 1───N Listing
Category 1───N Listing
Listing 1───N ListingPhoto
Listing 1───N ListingAvailability
User 1───N VerificationState (reutilizada)
User 1───N Session (reutilizada de 003-login)
```

## Notas sobre la extensión a la feature de listings (§2)

El modelo `Listing` introducido aquí es intencionalmente mínimo. La feature de listings (§2) lo extenderá con:
- Wizard de creación en 4 pasos (categoría, fotos y descripción, precios y disponibilidad, ubicación).
- Precios escalonados (tabla `ListingPriceTier` o campo JSON).
- Calendario completo con bloqueos manuales (extensión de `ListingAvailability`).
- Mínimo de días de alquiler (`minDays`).
- Estados del listing con flujo de revisión (`draft` → `in_review` → `published`/`rejected`).
- Previsualización antes de publicar.
- Hasta 10 fotos con ordenación drag & drop (extensión de `ListingPhoto`).

Esta feature no pre-crea esos campos; los deja para la feature de listings para no inflar el alcance.
