# Data Model: Caso Dummy de Desarrollo

**Fecha**: 2026-08-25
**Entidad**: `Category` (categoría) — entidad de ejemplo mínima del scaffold.

## Objetivo

Modelar una única entidad de demostración que, respetando `constitution/DATABASE.md`, permita validar el patrón completo de capas. No introduce claves foráneas complejas; la única auto-relación es `parentId`.

## Entidad: `Category`

### Camino de datos conceptual

| Campo | Tipo | Restricción / Notas |
|-------|------|---------------------|
| `id` | String | `@id @default(cuid())`, identificador opaco (DATABASE §3.1) |
| `name` | String | Nombre legible; requerido, sin vacíos (validación Zod) |
| `slug` | String | Único, kebab-case, inmutable tras creación (DATABASE §3.4) |
| `parentId` | String? (nullable) | Auto-referencia a otra `Category`; `null` = raíz |
| `showInNav` | Boolean | Marca de presentación, representa un "estado" mínimo de ejemplo |
| `createdAt` | DateTime | Auditoría; `@db.Timestamptz(6)` (DATABASE §3.2, §7.2) |
| `updatedAt` | DateTime | Auditoría; `@db.Timestamptz(6)` |
| `deletedAt` | DateTime? | Soft delete (DATABASE §7.1); filtrado en `list` |

### Reglas de validación (Zod, `lib/validations/category.schema.ts`)

- `name`: string, `min(1)`, `max(80)` (longitud máxima para evitar abuso).
- `slug`: derivable del `name` (kebab-case) o especificado; patrón `^[a-z0-9]+(?:-[a-z0-9]+)*$`, `max(160)`.
- `parentId`: `cuid()` opcional, o `null`/omitido.
- `showInNav`: booleano, por defecto `true`.

### Restricciones de integridad (PostgreSQL/Prisma)

- `@@unique([slug])` — unicidad de slug.
- `@@index([parentId])` — búsqueda por jerarquía (DATABASE §5.1).
- Relación `parent` / `children` auto-referenciada con `onDelete: Restrict` (por defecto, DATABASE §4.2).

### Transiciones de estado

- Estado lógico: `showInNav` (`true`/`false`) — demo de mutación de un atributo de presentación.
- Soft delete: `deletedAt` cambia de `null` a timestamp; las lecturas excluyen `deletedAt != null`.

## Relaciones con otras entidades

Ninguna en este scaffold. `Category` es autocontenida; su propósito es ser la plantilla mínima reutilizable. La relación real con `Product`/`Listing` (vista en el ER conceptual) se incorporará en los desarrollos que la necesiten y NO se modela aquí para no añadir cadenas de dependencias.