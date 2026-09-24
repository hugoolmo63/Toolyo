# Research: Gestión de productos para alquiler

## Decision 1: Reutilizar `Listing` como entidad de producto

- **Decision**: La feature usará el modelo `Listing` existente como producto de alquiler y reutilizará `ListingPhoto`, `ListingAvailability`, `Category` y `User`.
- **Rationale**: El schema actual ya contiene propietario, categoría, título, descripción, precio diario, ubicación aproximada, estado, auditoría, soft delete e índices por propietario/estado. Añadir otra entidad duplicaría el concepto de publicación y rompería la continuidad con búsqueda y detalle.
- **Alternatives considered**: Crear un modelo `RentalProduct` separado; descartado porque obligaría a duplicar relaciones, búsquedas, detalle público y reglas de publicación.

## Decision 2: Crear un router privado de dominio con procedimientos autenticados

- **Decision**: La gestión se expondrá mediante un router tRPC separado para listings del propietario, usando `authedProcedure` y autorización de ownership dentro del servicio/repository.
- **Rationale**: `authedProcedure` ya existe y carga la sesión desde cookie. La constitución exige routers por dominio, validación Zod en los bordes y una segunda comprobación de autorización sobre el recurso concreto. Un router separado evita mezclar lectura pública de detalle con mutaciones privadas.
- **Alternatives considered**: Hacer las operaciones desde Server Actions o ampliar directamente el router público de detalle; descartado porque no sigue el contrato tRPC vigente y aumenta el riesgo de mezclar superficies públicas y privadas.

## Decision 3: Borradores y retirada mediante estados existentes + `deletedAt`

- **Decision**: La creación comienza en `draft`; la publicación cambia a `published`; la retirada usa `deletedAt` como soft delete y las consultas activas filtran `deletedAt: null`. `paused`, `in_review` y `rejected` se muestran como estados gestionables sin inventar un nuevo enum.
- **Rationale**: Coincide con `ListingStatus`, con la regla de soft delete de la constitución y con el comportamiento público existente que solo muestra listings publicados no eliminados. Preserva trazabilidad y evita borrar información necesaria para operaciones futuras.
- **Alternatives considered**: Añadir `removed` al enum o borrar físicamente; descartado porque no es necesario para el MVP y el borrado físico contradice la política de datos y auditoría.

## Decision 4: Persistir las fotos como registros de `ListingPhoto` y limitar el alcance de subida

- **Decision**: La gestión recibe referencias de imágenes válidas y mantiene su orden y texto alternativo en `ListingPhoto`; el flujo de subida o almacenamiento de archivos se tratará como dependencia de infraestructura existente y no se inventa un proveedor nuevo en esta feature.
- **Rationale**: El modelo actual ya soporta URL, orden, texto alternativo y soft delete. La especificación necesita gestionar imágenes, pero el repositorio no define todavía un proveedor de almacenamiento que deba introducirse sin requisito.
- **Alternatives considered**: Añadir un proveedor de imágenes y un pipeline completo en esta feature; descartado por scope y porque cambiaría la arquitectura de infraestructura.

## Decision 5: Validación compartida y dinero decimal

- **Decision**: Los schemas Zod compartidos validarán campos, límites de texto, precio positivo, cantidad de fotos y estados permitidos; el precio persistirá como `Decimal` en EUR, sin `Float`.
- **Rationale**: Es obligatorio en BACKEND/SECURITY y el schema ya define `pricePerDay` como `Decimal(19,4)`. Compartir el schema evita divergencias entre formulario y tRPC.
- **Alternatives considered**: Validar solo en el navegador o convertir a `number` como fuente de verdad; descartado por seguridad y riesgo de precisión monetaria.

## Decision 6: No permitir retirada destructiva con compromisos activos

- **Decision**: El servicio de retirada debe consultar las relaciones de solicitudes/reservas disponibles en el modelo actual o en el módulo de alquiler cuando exista; si detecta un compromiso activo, devuelve un conflicto y mantiene el listing.
- **Rationale**: La especificación exige no cancelar compromisos automáticamente. En el schema actual todavía no existe un modelo `Booking`, por lo que el plan debe dejar el adaptador de comprobación preparado para la dependencia de reservas sin inventar una migración de reservas dentro de esta feature.
- **Alternatives considered**: Eliminar siempre y cancelar implícitamente; descartado por riesgo de incumplimiento y pérdida de datos.

## Decision 7: Panel con paginación/filtros y consistencia tras mutaciones

- **Decision**: El panel consultará productos por propietario con paginación estable y filtros de estado básicos; las mutaciones invalidarán la consulta del panel y la consulta pública relacionada.
- **Rationale**: Cumple FR-017 sin asumir que todos los productos caben en una sola respuesta. Sigue el patrón React Query/tRPC del proyecto y evita que el usuario vea datos obsoletos después de crear, editar o retirar.
- **Alternatives considered**: Cargar todo el inventario en una única consulta; descartado por escalabilidad y por el requisito de localizar productos en cantidades elevadas.

## Decision 8: Pruebas según la pirámide del proyecto

- **Decision**: Cubrir validadores y reglas de transición/ownership con Vitest unitario, routers con integración contra PostgreSQL efímero y los flujos principales del panel con Playwright y axe-core.
- **Rationale**: Es la estrategia exigida por `constitution/TESTING.md`; permite comprobar tanto seguridad de recursos como comportamiento visible.
- **Alternatives considered**: Solo pruebas E2E; descartado porque sería lento, menos diagnóstico y dejaría sin cobertura aislada las reglas de negocio.
