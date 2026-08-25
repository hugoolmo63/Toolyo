# Quickstart: Caso Dummy de Desarrollo

Guía de validación de extremo a extremo. Los detalles de implementación y de código viven en `tasks.md` y en la fase de implementación; este documento solo describe cómo **levantar y verificar** el scaffold en local.

## Prerrequisitos

- Node.js 20+ LTS y un gestor de paquetes (npm).
- Docker (para PostgreSQL local y Testcontainers en integración).
- No se requieren credenciales ni servicios cloud.

## 1. Instalación

```bash
npm install
```

## 2. Configuración del entorno

- Copia el ejemplo de variables (`cp .env.example .env`) y ajusta la URL de base de datos local.
- La validación de entorno (`env.mjs`) **falla explícitamente** si falta una variable crítica (p. ej. `DATABASE_URL`), enumerando qué falta.

## 3. Base de datos local

```bash
docker compose up -d db          # levanta PostgreSQL local
npm run db:migrate               # aplica migraciones
npm run db:seed                  # semilla mínima (categorías de ejemplo)
```

## 4. Arranque de la aplicación

```bash
npm run dev
```

Abre la ruta `/categories`:
- Se muestra el listado de categorías sembradas (lectura end-to-end: UI → API → servicio → DB).
- La ruta `/categories/new` permite crear una categoría; la validación del formulario y del backend reutilizan el mismo esquema Zod.

## 5. Pruebas

```bash
npm test               # unitarios (Vitest, lógica pura)
npm run test:integration   # integración (tRPC router + PostgreSQL real vía Testcontainers)
```

Ambas suites son **deterministas**: producen el mismo resultado en cada ejecución.

## 6. Verificación del flujo completo (escenario de aceptación)

1. Arranca con `npm run dev` y abre `/categories`.
2. Verifica que se listan las categorías sembradas (estado inicial no vacío).
3. Ve a `/categories/new`, envía un `name` vacío → se muestra error de validación en el campo, sin llegar al backend.
4. Crea una categoría válida → aparece en el listado (persistida en DB).
5. Intenta crear una categoría con un `slug` ya existente → se muestra conflicto explícito.
6. Ejecuta `npm test` y `npm run test:integration` → resultados verdes.

## 7. Puntos de extensión (plantilla para nuevos desarrollos)

Para añadir una nueva entidad siguiendo el patrón, replica estos artefactos:

| Artefacto | Ruta de referencia |
|-----------|--------------------|
| Modelo Prisma | `development/prisma/schema.prisma` |
| Dominio (slug, select, DTO) | `development/src/features/categories/domain/category.ts` |
| Schema Zod compartido | `development/src/features/categories/shared/category.schema.ts` |
| Infraestructura de datos | `development/src/features/categories/infrastructure/category.repository.ts` |
| Servicio (lógica pura) | `development/src/features/categories/application/category.service.ts` |
| Router tRPC | `development/src/server/api/routers/category.router.ts` |
| App router (merge) | `development/src/server/api/root.ts` |
| Página (Server Component) | `development/src/app/(app)/categories/page.tsx` |
| Formulario (Client Component) | `development/src/app/(app)/categories/new/form.tsx` |
| Tests unitarios / integración | `tests/unit/` y `tests/integration/` |

Los detalles de cada contrato y regla están en [`data-model.md`](./data-model.md) y [`contracts/category-api.md`](./contracts/category-api.md).