# Contract: Gestión privada de productos para alquiler

## Scope and access

- Router de dominio: `listingManagement`.
- Todos los procedimientos requieren `authedProcedure`.
- El servicio aplica autorización de recurso con `ownerId = ctx.session.userId`.
- Las respuestas no incluyen datos privados de otros usuarios ni identificadores internos innecesarios.
- Los inputs se validan con schemas Zod compartidos.

## `listMine`

**Type**: query

**Input**

```ts
{
  status?: "draft" | "in_review" | "published" | "paused" | "rejected";
  query?: string;
  page?: number; // default 1
  pageSize?: number; // bounded, default 20
}
```

**Output**

```ts
{
  items: Array<{
    id: string;
    slug: string;
    title: string;
    primaryPhotoUrl: string | null;
    category: { id: string; name: string; slug: string };
    pricePerDay: string;
    status: "draft" | "in_review" | "published" | "paused" | "rejected";
    updatedAt: string;
    deletedAt: string | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
}
```

**Rules**

- Devuelve únicamente listings del usuario autenticado.
- Por defecto excluye `deletedAt != null`; una vista histórica explícita puede incluirlos sin tratarlos como activos.
- Orden estable por `updatedAt DESC`, después `id DESC`.

## `getMine`

**Type**: query

**Input**

```ts
{ listingId: string }
```

**Output**

```ts
{
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: { id: string; name: string; slug: string };
  pricePerDay: string;
  location: { city: string | null; lat: number | null; lng: number | null; addressText: string | null };
  status: "draft" | "in_review" | "published" | "paused" | "rejected";
  photos: Array<{ id: string; url: string; altText: string | null; order: number }>;
  availability: Array<{ blockedDate: string; reason: string | null }>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  activeCommitments: { pendingRequests: number; activeRentals: number };
}
```

**Rules**

- Un listing inexistente o ajeno produce el mismo `NOT_FOUND` observable.
- La respuesta se mapea explícitamente; no se devuelven objetos Prisma crudos.

## `create`

**Type**: mutation

**Input**

```ts
{
  title: string;
  description?: string;
  categoryId: string;
  pricePerDay: string;
  city?: string;
  lat?: number;
  lng?: number;
  addressText?: string;
  photos?: Array<{ url: string; altText?: string; order: number }>;
  publish?: boolean;
}
```

**Output**

```ts
{ listingId: string; slug: string; status: "draft" | "published" | "in_review" }
```

**Rules**

- El propietario se obtiene de la sesión, nunca del input.
- `publish: true` valida todos los requisitos de publicación; si no, crea `draft`.
- Una repetición de la misma confirmación no crea un segundo listing.

## `update`

**Type**: mutation

**Input**

```ts
{
  listingId: string;
  title?: string;
  description?: string;
  categoryId?: string;
  pricePerDay?: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  addressText?: string | null;
  photos?: Array<{ id?: string; url: string; altText?: string; order: number }>;
}
```

**Output**

```ts
{ listingId: string; updatedAt: string; status: string }
```

**Rules**

- Solo modifica un listing perteneciente al usuario y no eliminado.
- Los datos se validan antes de cambiar cualquier campo.
- La actualización del listing y sus fotos es atómica.
- Si el listing publicado deja de cumplir requisitos, permanece con el estado vigente solo si las reglas del dominio lo permiten; en caso contrario se devuelve una validación clara y se conserva la versión anterior.

## `publish`

**Type**: mutation

**Input**

```ts
{ listingId: string }
```

**Output**

```ts
{ listingId: string; status: "published" | "in_review" }
```

**Rules**

- Solo el propietario puede solicitar publicación.
- Revalida campos, categoría, fotos y políticas de publicación.
- Si se requiere moderación, devuelve `in_review`; nunca autoasigna aprobación administrativa.

## `remove`

**Type**: mutation

**Input**

```ts
{ listingId: string; confirmation: true }
```

**Output**

```ts
{ listingId: string; removedAt: string }
```

**Rules**

- Requiere confirmación explícita.
- Comprueba compromisos activos dentro de la transacción o servicio de dominio.
- Si hay compromisos incompatibles, devuelve `CONFLICT` y no cambia el listing.
- Si ya está retirado, la operación es idempotente y devuelve su estado retirado sin repetir efectos.

## Error mapping

- `UNAUTHORIZED`: no hay sesión válida.
- `NOT_FOUND`: recurso inexistente, ajeno o no visible para el propietario.
- `BAD_REQUEST`: input mal formado o validación de campos fallida.
- `CONFLICT`: transición de estado inválida o compromisos activos impiden la retirada.
- `TOO_MANY_REQUESTS`: límite de mutaciones sensibles excedido.
- Errores inesperados: respuesta genérica y detalle solo en logging estructurado.
