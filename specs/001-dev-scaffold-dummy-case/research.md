# Research: Caso Dummy de Desarrollo (Scaffold de Referencia)

**Fecha**: 2026-08-25
**Propósito**: Resolver las decisiones técnicas del caso dummy y dejar constancia de las alternativas consideradas.

> No existían marcadores `[NEEDS CLARIFICATION]` en la especificación; las decisiones de esta investigación corresponden a elecciones de diseño que la spec difirió explícitamente a la fase de planificación.

## R1. Elección de la entidad de ejemplo

- **Decision**: Usar `Category` (categoría) como entidad de demostración única.
- **Rationale**: Es la entidad más simple y autocontenida del modelo conceptual (ER diagram en `docs/03-arquitectura-y-tech-stack.md`). Demuestra de forma completa el patrón de capas — validación con Zod, campo único (`slug`), auto-referencia (`parentId`), una marca de estado (`showInNav`) y auditoría (`createdAt`/`updatedAt`) — sin arrastrar la complejidad de cadenas de claves foráneas (Listing→Booking→Payment) ni lógica de negocio que añadiría ruido al objetivo ("la utilidad, no la funcionalidad").
- **Alternatives considered**:
  - `Listing`: más representativo del negocio, pero demasiado pesado (múltiples relaciones, imágenes, precios escalonados) para un primer scaffold.
  - `Foo`/`Widget` sintético: sin sentido de dominio; no serviría de guía fiel para los desarrollos reales.
  - `Location`: también simple, pero `Category` ofrece la auto-referencia jerárquica que es un patrón recurrente y útil a reutilizar.

## R2. Estructura del proyecto (monolito vs. repos separados)

- **Decision**: Monolito Next.js (App Router) full-stack con tRPC, un único árbol `src/`.
- **Rationale**: tRPC propaga tipos desde el servidor al cliente dentro del mismo `tsconfig`, eliminando la fricción de contrato entre front y back. Es la opción coherente con `constitution/BACKEND.md` §4 y `constitution/FRONTEND.md` §6, y el caso más simple para probar en local.
- **Alternatives considered**:
  - Repos separados `backend/` + `frontend/`: más fricción de configuración y contratos; exceso para un scaffold de referencia.
  - Monorepo (Turborepo/pnpm workspaces): potencia futura, pero prematuro para este caso.

## R3. Base de datos local para el día a día

- **Decision**: PostgreSQL local (vía Docker Compose) para desarrollo, y Testcontainers (PostgreSQL) para los tests de integración.
- **Rationale**: `TESTING.md` §4 exige una base de datos real (no mockear Prisma) en integración; `DATABASE.md`/arquitectura fijan PostgreSQL con Prisma. Docker Compose cubre el arranque local sin servicios cloud.
- **Alternatives considered**:
  - Supabase/Neon (cloud): requiere credenciales, contradice FR-011 ("autocontenido, sin servicios de producción").
  - SQLite: incompatible con las reglas de `DATABASE.md` (PostgreSQL/PostGIS/Decimal avanzado).

## R4. Alcance del testing (pirámide)

- **Decision**: Unitarios (Vitest, lógica pura) + Integración (Vitest + tRPC router contra Postgres de Testcontainers). E2E (Playwright) queda fuera del alcance de este scaffold.
- **Rationale**: `TESTING.md` §2 define la pirámide; para un caso de una sola entidad y un flujo, unitarios + integración son suficientes para demostrar el patrón. E2E se añadirá cuando existan flujos críticos de negocio reales.
- **Alternatives considered**:
  - Incluir E2E desde el inicio: coste de mantenimiento extra sin flujo crítico que justifique (`TESTING.md` §1.4 "coste explícito").

## R5. Procedimientos tRPC del caso

- **Decision**: Exponer `list` (query, pública en el scaffold) y `create` (mutation). Suficiente para demostrar lectura y escritura de extremo a extremo.
- **Rationale**: Cubre FR-002 (lectura/escritura end-to-end) y FR-003 (validación en borde sobre `create`) con el mínimo necesario. El scaffold documenta cómo extender con `update`/`delete`/`soft-delete`.
- **Alternatives considered**:
  - CRUD completo: más APIs que mantener sin valor de referencia adicional.

## R6. Autenticación en el scaffold

- **Decision**: El caso dummy **no** incorpora autenticación real; usa `publicProcedure` para `list`/`create`, y documenta en `trpc.ts` los procedimientos base (`authedProcedure`, etc.) como puntos de extensión preparados pero no cableados a un proveedor.
- **Rationale**: El objetivo es demostrar capas e infraestructura, no auth; integrar Auth.js/NextAuth en este primer caso añadiría superficie sin aportar a "utilidades de desarrollo". Se deja la base procedimental preparada para los desarrollos que sí la requieran.
- **Alternatives considered**:
  - Integrar Auth.js desde ya: más fidelidad con `BACKEND.md` §6, pero aumenta el coste y los secretos requeridos, contradiciendo FR-011.

## R7. Estado de la entidad y soft-delete

- **Decision**: `Category` incluye `showInNav` (booleano de presentación) como "estado" de demostración, y `deletedAt` (soft delete) presente según `DATABASE.md` §7.1, aunque el scaffold solo demuestre `list` (que filtra `deletedAt: null`) y `create`.
- **Rationale**: Documenta el patrón de soft delete y auditoría exigido por la constitución sin implementar flujos de borrado que alargan el scope.
- **Alternatives considered**:
  - Sin `deletedAt`: violaría el estándar de `DATABASE.md` §7.1 que exige el campo en todo modelo de negocio.

## R8. Tema visual

- **Decision**: Reutilizar los tokens del tema `profesional-seguro` (`constitution/DESIGN.md`) y el catálogo de componentes del spec `00-visual-components-ui-kit` como base de `globals.css` y `components/ui`. No se redefinen colores ni componentes.
- **Rationale**: `FRONTEND.md` §7 y `DESIGN.md` §9 obligan a usar tokens, no colores hardcodeados; el catálogo ya está aprobado.
- **Alternatives considered**: Definir estilos ad-hoc → violaría la constitución (no colores fuera de `DESIGN.md`).