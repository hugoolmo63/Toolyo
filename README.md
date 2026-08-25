# Toolyo — Scaffold de Desarrollo (Caso Dummy)

Caso dummy de referencia que atraviesa todas las capas de la arquitectura Toolyo:
**interfaz → API (tRPC) → lógica de negocio → acceso a datos**, usando la entidad
mínima **`Category`** como ejemplo.

El objetivo no es la funcionalidad, sino establecer las **facilidades de desarrollo**
(estructura conforme a la `constitution/`, validación en borde, jerarquía de errores,
auditoría, seed y pruebas reproducibles) que sirven de **plantilla viva** para el resto
de desarrollos.

El código de la app vive en [`development/`](development/). Ahí está la separación por
capas de la feature `Category`: `domain`, `shared`, `infrastructure`, `application` y
`presentation`. Los archivos bajo `development/src/app` y `development/src/server` actúan
como fachadas finas para mantener Next.js y tRPC en sus puntos de entrada, sin mezclar la
lógica con la presentación.

## Stack

- Next.js 14+ (App Router) · TypeScript (strict)
- tRPC + React Query (type-safety end-to-end)
- Prisma + PostgreSQL
- Zod (validación compartida front/back)
- Tailwind CSS + tokens del tema `profesional-seguro` (`constitution/DESIGN.md`)
- Vitest (unitarios + integración con Testcontainers)

## Arranque rápido

```bash
npm install
cp .env.example .env
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

Abre `http://localhost:3000/categories`.

## Pruebas

```bash
npm test               # unitarios (lógica pura)
npm run test:integration  # integración (tRPC + PostgreSQL real)
```

## Mapa capa → fichero (puntos de extensión)

| Capa | Fichero de referencia |
|------|-----------------------|
| Modelo de datos | `development/prisma/schema.prisma` |
| Dominio (slug, DTO, select) | `development/src/features/categories/domain/category.ts` |
| Validación (Zod compartido) | `development/src/features/categories/shared/category.schema.ts` |
| Infraestructura de datos | `development/src/features/categories/infrastructure/category.repository.ts` |
| Lógica de negocio (servicio) | `development/src/features/categories/application/category.service.ts` |
| Router tRPC | `development/src/server/api/routers/category.router.ts` |
| App router (merge) | `development/src/server/api/root.ts` |
| Core tRPC (procedimientos base) | `development/src/server/api/trpc.ts` |
| Página (Server Component) | `development/src/features/categories/presentation/categories-page.tsx` |
| Formulario (Client Component) | `development/src/features/categories/presentation/category-form.tsx` |
| Loading / Error | `development/src/features/categories/presentation/categories-loading.tsx`, `development/src/features/categories/presentation/categories-error.tsx` |
| Tests unitarios | `development/tests/unit/` |
| Tests de integración | `development/tests/integration/` |

## Cómo añadir una nueva entidad (plantilla)

Replica el patrón `Category` en estos artefactos:

1. Añade el modelo en `prisma/schema.prisma` (id cuid, auditoría, soft-delete).
2. Crea el schema Zod en `src/server/lib/validations/<entidad>.schema.ts`.
3. Crea el servicio puro en `src/server/services/<entidad>.service.ts`.
4. Crea el router en `src/server/api/routers/<entidad>.router.ts` y regístralo en `root.ts`.
5. Crea la página/formulario en `src/app/(app)/<entidad>/`.
6. Añade tests en `tests/unit/` y `tests/integration/`.

Los procedimientos base de autenticación (`authedProcedure`, etc.) están preparados en
`src/server/api/trpc.ts` como puntos de extensión pero **no cableados** en este scaffold
(ver `research.md` R6).

## Documentación

- Spec: `specs/001-dev-scaffold-dummy-case/spec.md`
- Plan: `specs/001-dev-scaffold-dummy-case/plan.md`
- Modelo de datos: `specs/001-dev-scaffold-dummy-case/data-model.md`
- Contrato API: `specs/001-dev-scaffold-dummy-case/contracts/category-api.md`
- Guía de validación: `specs/001-dev-scaffold-dummy-case/quickstart.md`