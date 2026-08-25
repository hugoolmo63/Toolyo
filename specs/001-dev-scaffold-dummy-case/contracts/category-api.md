# API Contract: `category` (scaffold de referencia)

**Fecha**: 2026-08-25
**Dominio**: Categorías (entidad de ejemplo del caso dummy)
**Transporte**: tRPC (tipos compartidos end-to-end; sin capa REST pública)

## Procedimientos

### `category.list` — consulta pública

**Entrada**: sin argumentos (o shape vacío).

**Salida**: array de categorías activas (no eliminadas):

```ts
type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  showInNav: boolean;
  parentId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
```

**Reglas**:
- Filtra `deletedAt: null` (soft delete, `DATABASE.md` §7.1).
- No expone `deletedAt` ni campos sensibles (no aplica en este caso, pero se documenta el patrón de mapper/select explícito, `BACKEND.md` §4.3).

### `category.create` — mutación

**Entrada** (`CreateCategorySchema`, Zod compartido):

```ts
type CreateCategoryInput = {
  name: string;          // min 1, max 80
  slug: string;          // ^[a-z0-9]+(?:-[a-z0-9]+)*$, max 160
  parentId?: string;     // cuid() opcional
  showInNav?: boolean;   // default true
};
```

**Salida**: `CategoryDto` (la entidad creada).

**Errores**:
- Validación: `ValidationError` → código `400` (params inválidos desde el borde).
- Slug duplicado: `ConflictError` → `409`.
- Padre inexistente: `NotFoundError` → `404`.
- Error inesperado: `internal_server_error` genérico, detalle solo al logger (sin stack trace al cliente).

## Contrato visual / UI

- Página `/categories`: lista de categorías leída vía `category.list` en un Server Component.
- Formulario `/categories/new`: `category.create` desde un Client Component; errores de campo mostrados junto al input (on blur y al enviar), con toast de éxito.

## Criterios de aceptación del contrato

- `list` devuelve solo categorías no eliminadas y sin `deletedAt`.
- `create` rechaza un `name` vacío o un `slug` mal formado con error en el borde, sin tocar capas internas.
- `create` con `slug` ya existente devuelve conflicto explícito (409), no error genérico.
- El formulario muestra los errores de validación por campo y reutiliza el mismo schema Zod que el backend.