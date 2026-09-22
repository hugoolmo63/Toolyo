# Data Model: Vista Pública del Perfil de Usuario

## PublicUserProfileDTO

Proyección serializable para `/users/[id]`; nunca es el modelo Prisma completo.

| Campo | Tipo | Regla de exposición |
|---|---|---|
| `id` | `String` | Identificador de ruta público actual. |
| `displayName` | `String/null` | Nombre visible; fallback si está vacío. |
| `avatarUrl` | `String/null` | Solo URL pública validada. |
| `createdAt` | `DateTime/string` | Fecha localizada; no exponer metadata interna adicional. |
| `ratingAverage` | `Decimal/number/null` | Solo agregado público. |
| `transactionCount` | `Int` | Contador agregado no negativo. |
| `badges` | objeto | `registered`, `verified`, `superLessor`; derivados en servidor. |
| `preferredLocation` | coordenadas aproximadas/null | Solo para el mapa; nunca texto de coordenadas exactas. |
| `listings` | `PublicListingCard[]` | Solo publicados, activos y no eliminados. |
| `reviews` | `PublicReview[]` | Solo reseñas públicas/moderadas; puede ser vacío mientras el módulo no exista. |

## PublicListingCard

| Campo | Tipo | Regla |
|---|---|---|
| `id`, `slug` | `String` | Enlace al detalle público. |
| `title` | `String` | Título público. |
| `coverImageUrl` | `String/null` | Primera foto no eliminada. |
| `pricePerDay` | `number` | Precio público por día. |
| `city` | `String/null` | Zona pública; nunca dirección exacta. |
| `ratingAverage`, `reviewCount` | `number` | Agregados públicos si están disponibles. |

## PublicReview

Contrato preparado para el módulo de reviews:

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `String` | Identificador interno no necesariamente visible en UI. |
| `author` | `{ displayName, avatarUrl }` | Solo identidad pública mínima; sin contacto. |
| `rating` | `number` 1–5 | Valoración validada. |
| `comment` | `String/null` | Texto moderado; puede mostrar estado no disponible. |
| `createdAt` | `string` | Fecha pública localizada. |

## Relaciones y filtros

- `User` 1:N `Listing`; perfil filtra `status = published` y `deletedAt IS NULL`.
- `Listing` 1:N `ListingPhoto`; la card selecciona la foto de menor `order` con `deletedAt IS NULL`.
- `User` 1:N `VerificationState`; una verificación de identidad vigente alimenta `verified`.
- `User.createdAt` alimenta la fecha de registro pública.
- `Review` es dependencia opcional/futura; la ausencia de tabla no debe impedir renderizar perfil y listings.

## Estados

- Perfil: visible si usuario activo y no eliminado; de lo contrario 404/no disponible.
- Listing: visible si publicado y no eliminado; cualquier otro estado queda fuera.
- Reseña: visible solo si pública/moderada; eliminada, oculta o pendiente queda fuera.
- Ubicación: válida si coordenadas dentro de latitud/longitud; públicamente se transforma a círculo de 750 m de radio.