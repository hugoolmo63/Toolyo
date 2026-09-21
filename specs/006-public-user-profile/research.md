# Research: Vista Pública del Perfil de Usuario

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-18

## Proyección pública y Prisma

**Decisión**: Añadir una consulta/repositorio específico de perfil que use un `select` explícito sobre `User`, filtre `accountStatus = active` y `deletedAt IS NULL`, incluya solo listings `published`/no eliminados y sus fotos principales, y derive los badges en la capa de aplicación.

**Rationale**: El perfil público es una frontera de privacidad; reutilizar el objeto Prisma completo aumentaría el riesgo de filtrar email, teléfono, sesiones o credenciales. La consulta específica permite probar el contrato y optimizar joins.

**Alternativas consideradas**:

- Reutilizar directamente `User` con `include`: descartado por exposición accidental de campos privados.
- Leer desde el router en la página: descartado porque contradice la separación repositorio/servicio del proyecto.

## Componentes y ruta

**Decisión**: Mantener `app/users/[id]/page.tsx` como Server Component fino y colocar `UserProfileHeader`, `UserProfileBadges`, `UserProfileLocationMap`, `UserProfileListings` y `UserProfileReviews` en `src/components/profile/`. Crear un `ListingCard` público compatible con el DTO existente porque no hay un componente con ese nombre en el árbol actual; `ResultCard` de búsqueda no se copia, se adapta mediante un DTO común.

**Rationale**: Cumple la estructura solicitada y evita que la página concentre lógica. Los componentes de presentación pueden probarse con datos serializables y el mapa queda aislado como Client Component.

**Alternativas consideradas**:

- Colocar todo bajo `features/users/presentation`: descartado para esta entrega porque la solicitud fija `components/profile/`, aunque la lógica de datos sí permanece en `features/users`.
- Importar `ResultCard` directamente: descartado porque su contrato depende de resultados de búsqueda y filtros como `distanceKm`.

## Ubicación aproximada

**Decisión**: Interpretar `preferredLocation` como coordenadas almacenadas en formato interno validado y representarlas públicamente con un círculo de radio 750 m, sin imprimir latitud/longitud ni geocodificar una dirección exacta en la UI.

**Rationale**: Protege la privacidad personal y cumple el requisito de zona aproximada. Leaflet ya está instalado y el proyecto cuenta con carga dinámica sin SSR para mapas y tiles OpenStreetMap.

**Alternativas consideradas**:

- Mostrar un marker exacto: descartado por riesgo de identificar el domicilio.
- Mostrar solo texto de ciudad: descartado porque el requisito pide mapa visual y zona aproximada.

## Badges y reseñas

**Decisión**: `Registrado` se deriva de una cuenta activa; `Verificado` de la verificación confirmada; `Superarrendador` requiere una función de política de negocio y se oculta si no hay criterios/datos implementados. Las reseñas se modelan como una proyección pública opcional con estado vacío hasta que exista el modelo Review; nunca se inventan reseñas.

**Rationale**: Evita conceder confianza desde el cliente y mantiene una entrega incremental compatible con el schema actual, que no contiene `Review` ni un campo explícito de Superarrendador.

**Alternativas consideradas**:

- Persistir booleans de badges en el frontend: descartado por manipulación y desincronización.
- Crear un modelo Review dentro de esta vista: descartado; la creación/moderación de reseñas pertenece a su propio módulo.

## Contactar

**Decisión**: Renderizar un botón público que actúe como entry point hacia el flujo de mensajería; si el visitante no tiene sesión, conservar el contexto mediante callback y solicitar autenticación. No se muestra ningún canal directo.

**Rationale**: Mantiene la vista 100% pública y respeta la minimización de datos de seguridad.

## Testing

**Decisión**: Unitarios para mapeo público, badges, sanitización de ubicación y orden/estado de reseñas; integración con PostgreSQL para filtros de visibilidad y ausencia de campos privados; E2E/accesibilidad para navegación pública, botón Contactar, fallbacks y mapa cuando el entorno permita navegador.

**Rationale**: Se alinea con la pirámide de `constitution/TESTING.md` y prueba privacidad en la frontera real de datos.

**Alternativas consideradas**: Solo snapshot de React, descartado porque no detecta filtraciones ni filtros Prisma incorrectos.