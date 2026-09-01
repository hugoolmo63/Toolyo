# Quickstart: Búsqueda Pública y Página de Inicio

**Feature**: [spec.md](spec.md)

## Prerrequisitos

- `002-registration` completado (modelos `User`, `VerificationState` en DB).
- `003-login` completado (modelo `Session`, contexto tRPC con sesión).
- PostgreSQL levantado con extensión PostGIS disponible: `docker compose up -d db` desde `development/`. La imagen Docker debe soportar PostGIS (ver `docker-compose.yml` — usar imagen `postgis/postgis` en lugar de `postgres` estándar).
- Dependencias instaladas: `npm ci` desde `development/`.
- `.env` configurado con `DATABASE_URL`.
- Al menos un usuario registrado con `accountStatus = active` y `VerificationState` de identidad `verified` (para validar el filtro "Solo verificados").

## Setup

```bash
# Desde development/
# 1. Actualizar docker-compose.yml para usar imagen postgis/postgis
# 2. Levantar BD con PostGIS
docker compose up -d db

# 3. Generar cliente Prisma (con tipos de Listing, ListingPhoto, ListingAvailability)
npm run db:generate

# 4. Aplicar migración (crea tablas + habilita PostGIS + índice GiST)
npm run db:migrate

# 5. Sembrar listings de ejemplo
npm run db:seed

# 6. Arrancar la app
npm run dev
```

## Validación manual del flujo

### 1. Landing con resultados aleatorios sin login

1. Abre `http://localhost:3000/` en una ventana de incógnito (sin sesión).
2. **Esperado**: aterrizas directamente en la página de búsqueda (landing) con una lista de resultados ya cargada (listings de ejemplo aleatorios), sin redirección a login ni muro de autenticación.
3. Verifica que la URL no tiene query params (modo inicial).
4. Recarga la página. **Esperado**: los resultados pueden cambiar (aleatorios) pero la página carga sin errores.

### 2. Autocompletado de ubicaciones y categorías

1. En la barra de búsqueda, escribe "Mad".
2. **Esperado**: aparecen sugerencias de ubicaciones (ej. "Madrid, España") y de categorías (si hay categorías que coincidan), diferenciadas visualmente, en menos de 300 ms.
3. Selecciona una ubicación con el teclado (flechas + Enter) o con el ratón.
4. **Esperado**: la URL se actualiza con `?loc=Madrid...&lat=...&lng=...` y los resultados se filtran por cercanía a esa ubicación.

### 3. Detección GPS de ubicación

1. Abre `http://localhost:3000/` en un dispositivo con GPS o con permiso de geolocalización en el navegador.
2. Pulsa el botón de detección de ubicación.
3. **Esperado**: el navegador pide permiso de geolocalización. Al aceptar, la URL se actualiza con `lat`/`lng` y los resultados se filtran por cercanía.
4. Rechaza el permiso. **Esperado**: la búsqueda sigue siendo usable con selección manual de ubicación; no se bloquea.

### 4. Aplicar filtros combinables

1. Partiendo de una búsqueda con resultados, aplica el filtro de categoría.
2. **Esperado**: la lista se reduce a esa categoría y el filtro aparece como activo. La URL se actualiza con `?cat=...`.
3. Aplica un precio máximo por día.
4. **Esperado**: desaparecen los listings que superan el precio. URL se actualiza con `?maxPrice=...`.
5. Aplica un rango de fechas.
6. **Esperado**: solo se muestran listings con disponibilidad en ese rango (sin bloqueos en `ListingAvailability`). URL se actualiza con `?dateStart=...&dateEnd=...`.
7. Activa "Solo usuarios verificados".
8. **Esperado**: solo se muestran listings cuyo arrendador tiene `VerificationState` de identidad `verified`. URL se actualiza con `?verified=true`.
9. **Esperado en todos los pasos**: los filtros se comportan como AND lógico.

### 5. Cambiar ordenación

1. Partiendo de una búsqueda con resultados y ubicación definida, cambia la ordenación a "Más cercano".
2. **Esperado**: los resultados se reordenan por distancia ascendente sin perder los filtros aplicados. URL se actualiza con `?sort=nearest`.
3. Prueba "Precio ascendente" y "Mejor valorado".
4. **Esperado**: el orden cambia según el criterio elegido manteniendo los filtros.

### 6. Limpiar filtros

1. Con varios filtros aplicados, pulsa "Limpiar filtros".
2. **Esperado**: todos los filtros vuelven a su estado por defecto, la URL se limpia de params de filtro y la lista muestra resultados sin refinar (o aleatorios si no hay ningún criterio).

### 7. Vista de mapa interactivo

1. Partiendo de una búsqueda con resultados geolocalizados, activa la vista de mapa.
2. **Esperado**: se renderiza un mapa (Leaflet) centrado en la ubicación de búsqueda con un pin por cada resultado visible.
3. Haz clic en un pin.
4. **Esperado**: aparece una preview del listing (imagen, título, precio, rating, distancia) sin abandonar la página.
5. Haz zoom o desplaza el mapa.
6. **Esperado**: los pins se ajustan al área visible.
7. Aplica un filtro con el mapa abierto.
8. **Esperado**: los pins se actualizan para reflejar el mismo conjunto de resultados que la lista.

### 8. Degradación del mapa

1. Simula que el proveedor de mapas no carga (bloquea tiles en DevTools o desconecta red).
2. **Esperado**: aparece un mensaje "Mapa no disponible temporalmente" y la vista de lista sigue siendo usable.

### 9. Alternar vista grid/lista

1. Partiendo de una búsqueda con resultados, alterna entre vista grid y lista.
2. **Esperado**: la presentación cambia de formato conservando los mismos resultados, filtros y ordenación. URL se actualiza con `?view=grid` o `?view=list`.

### 10. Paginación adaptativa

1. En desktop con más resultados que una página, llega al final de la página.
2. **Esperado**: aparece paginación numerada para saltar a páginas específicas. URL se actualiza con `?page=2`.
3. En móvil (o DevTools en modo móvil) con más resultados, haz scroll hacia abajo.
4. **Esperado**: se cargan más resultados automáticamente (infinite scroll) con un indicador de carga visible.
5. **Esperado en ambos**: los filtros y la ordenación se mantienen al cambiar de página o cargar más.

### 11. Estado de búsqueda en URL (compartible y restaurable)

1. Aplica una búsqueda con filtros, ordenación y vista concretos.
2. Copia la URL completa.
3. Abre la URL en una nueva ventana de incógnito.
4. **Esperado**: la página se carga con el mismo estado de búsqueda (filtros, ordenación, vista, página) sin tener que reconfigurar nada.
5. Navega con el botón "Atrás" del navegador.
6. **Esperado**: recuperas el estado anterior de búsqueda.

### 12. Estado vacío

1. Aplica filtros que no tengan resultados (ej. precio máximo 0 o ubicación remota sin listings).
2. **Esperado**: se muestra un estado vacío útil que sugiere relajar criterios o explorar categorías populares, sin errores técnicos visibles.

### 13. Sin datos privados en respuestas

1. Abre DevTools → Network.
2. Ejecuta una búsqueda y examina la respuesta de `search.query`.
3. **Esperado**: la respuesta contiene solo campos públicos (`title`, `pricePerDay`, `primaryPhotoUrl`, `ratingAverage`, `owner.displayName`, `owner.avatarUrl`, `owner.isVerified`). Nunca `email`, `phone`, `addressText` exacto ni datos de pago.

## Validación automática

```bash
# Unitarios (lógica de filtros, ordenación, mapeo a DTO, validación Zod)
npm test -- tests/unit/search

# Integración (router + DB real + PostGIS con Testcontainers)
npm run test:integration -- tests/integration/search

# Typecheck
npx tsc --noEmit
```

## Verificación de seguridad

- Verificar que los procedimientos de búsqueda son `publicProcedure` (no requieren sesión).
- Verificar rate limiting: 100 búsquedas/min por IP, 60 autocompletados/min por IP.
- Verificar que las respuestas no contienen datos privados (email, teléfono, dirección exacta, datos de pago).
- Verificar que solo listings `published` con owner `active` aparecen en resultados.
- Verificar que la detección GPS pide permiso explícito y respeta la decisión del usuario.

## Verificación de accesibilidad

- Ejecutar axe-core en la página de búsqueda.
- Verificar que todos los controles (barra, autocompletado, filtros, ordenación, vistas, paginación, pins del mapa) tienen nombre accesible, foco visible y navegación por teclado.
- Verificar que el estado vacío y los skeletons son anunciados por lector de pantalla.

## Dependencias externas nuevas

- `nuqs` — gestión de estado de búsqueda en URL (`FRONTEND.md` §10).
- `leaflet` + `react-leaflet` — mapa interactivo open-source (sin API key).
- Nominatim (OpenStreetMap) — geocoding y autocompletado de ubicaciones (gratuito, sin API key, vía servidor).
- PostGIS — extensión de PostgreSQL para búsquedas geoespaciales (`DATABASE.md` §5.4).

## Notas

- El modelo `Listing` introducido aquí es mínimo; la feature de listings (§2) lo extenderá con wizard de creación, precios escalonados, calendario completo, etc.
- El seed debe crear al menos 30-50 listings de ejemplo con ubicaciones variadas en España para que la búsqueda aleatoria y los filtros tengan resultados significativos.
- La imagen Docker de PostgreSQL debe cambiarse a `postgis/postgis` en `docker-compose.yml` para soportar la extensión PostGIS.
