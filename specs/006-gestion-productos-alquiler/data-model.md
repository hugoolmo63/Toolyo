# Data Model: Gestión de productos para alquiler

## Existing entities reused

### `User`

- **Purpose**: Propietario autenticado de los productos.
- **Relevant fields**: `id`, `accountStatus`, `displayName`, `createdAt`, `updatedAt`, `deletedAt`.
- **Relationship**: Un usuario puede tener muchos `Listing` mediante `ownerId`.
- **Rules**: Las operaciones privadas usan el `userId` de la sesión; nunca aceptan un `ownerId` arbitrario como autoridad.

### `Category`

- **Purpose**: Clasificación del producto.
- **Relevant fields**: `id`, `name`, `slug`, `parentId`, `deletedAt`.
- **Relationship**: Un `Listing` pertenece a una categoría activa.
- **Rules**: No se puede crear o publicar un producto con una categoría inexistente o eliminada.

### `Listing`

- **Purpose**: Publicación de un producto disponible para alquiler.
- **Fields used by this feature**:
  - `id`: identificador de negocio no enumerable.
  - `ownerId`: propietario y clave de autorización de recurso.
  - `categoryId`: categoría activa.
  - `title`: nombre público; obligatorio y con límite de longitud.
  - `slug`: identificador público único generado al crear; no se cambia al editar el título.
  - `description`: descripción libre opcional, sanitizada y con límite de longitud.
  - `pricePerDay`: importe positivo en EUR con precisión decimal.
  - `lat`, `lng`, `addressText`, `city`: ubicación aproximada; la dirección exacta no se expone públicamente.
  - `status`: `draft`, `in_review`, `published`, `paused` o `rejected`.
  - `createdAt`, `updatedAt`, `deletedAt`: auditoría y soft delete.
- **Indexes relevant to feature**: `ownerId,status`; `status,deletedAt`; `categoryId,status,deletedAt`.
- **Invariants**:
  - Un listing privado solo se devuelve si `ownerId` coincide con la sesión.
  - Un listing público solo se devuelve si `status = published` y `deletedAt IS NULL`.
  - Solo una acción explícita de publicación puede mover un borrador a `published`.
  - La retirada establece `deletedAt`; no elimina físicamente el registro.

### `ListingPhoto`

- **Purpose**: Imágenes ordenadas de un producto.
- **Fields**: `id`, `listingId`, `url`, `altText`, `order`, `createdAt`, `updatedAt`, `deletedAt`.
- **Rules**: Solo se aceptan URLs de imagen válidas; el orden no se repite dentro del producto; las fotos retiradas se excluyen de las consultas activas.
- **Relationship**: Muchas fotos pertenecen a un `Listing`.

### `ListingAvailability`

- **Purpose**: Fechas bloqueadas del producto.
- **Rules**: La gestión de productos no borra bloqueos al editar datos generales; las operaciones de disponibilidad posteriores deben conservar ownership y unicidad por producto/fecha.

## Future/dependent entity

### Solicitud o alquiler activo

- **Purpose**: Compromiso que puede impedir retirar un producto.
- **Dependency**: El schema actual no contiene todavía un modelo de reservas. El servicio de retirada debe encapsular la comprobación para conectarla al módulo de reservas cuando esté disponible.
- **Rule**: Si existe una solicitud pendiente o un alquiler vigente asociado, devolver conflicto y no marcar el listing como retirado.

## State transitions

```text
draft ── publish ──> published
published ── pause ──> paused
paused ── resume ──> published
in_review ── approve ──> published
in_review ── reject ──> rejected
rejected ── edit/resubmit ──> in_review
any non-deleted state ── remove ──> soft-deleted (deletedAt != null)
```

- Las transiciones administrativas (`in_review`, `rejected`) solo se exponen si el dominio de moderación las necesita; el propietario no puede autoaprobarse.
- La publicación requiere datos obligatorios válidos y las reglas de moderación/identidad vigentes.
- La retirada es irreversible desde el panel en esta feature, pero conserva el registro para auditoría y compromisos.

## Validation rules

- Título: requerido, no vacío, longitud máxima definida por el schema compartido.
- Descripción: opcional, longitud máxima y sanitización de contenido.
- Categoría: requerida, existente, activa y no eliminada.
- Precio: decimal EUR estrictamente mayor que cero; nunca `Float`.
- Ubicación: coordenadas válidas si se proporcionan; dirección exacta no se publica.
- Imágenes: URLs válidas, orden único, texto alternativo cuando la imagen tenga función informativa; mínimo requerido solo al publicar.
- Identificador: se genera una vez y permanece estable para enlaces públicos.
- Ownership: `ownerId` procede de la sesión y la consulta/mutación filtra por él.
- Soft delete: `deletedAt IS NULL` en panel activo y oferta pública; un producto retirado no recibe nuevas solicitudes.
- Idempotencia: crear/publicar/retirar debe tolerar reintentos sin duplicar productos ni ejecutar dos veces una retirada.

## Transaction boundaries

- Crear `Listing` y sus `ListingPhoto` iniciales: una transacción.
- Actualizar datos del listing y reemplazar el conjunto de fotos: una transacción; las fotos eliminadas se marcan como soft-deleted.
- Publicar o retirar: una transacción con validación de estado y comprobación de compromisos activos.
- Las mutaciones críticas deben registrar evento estructurado y conservar `createdAt`/`updatedAt`.
