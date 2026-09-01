# Quickstart: Página de Detalle del Producto

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-01

Guía de validación local para verificar que la página de detalle del producto funciona end-to-end. No incluye código de implementación; los detalles viven en `tasks.md` y la implementación.

## Prerrequisitos

1. **PostgreSQL con PostGIS** corriendo (Docker `postgis/postgis` configurado en `004-public-search`).
2. **Dependencias instaladas** (`npm install` en `/development`).
3. **Migraciones aplicadas** (`npm run db:migrate` en `/development`) — sin cambios en esta feature; reutiliza las migraciones de `004-public-search`.
4. **Seed ejecutado** (`npm run db:seed` en `/development`) — reutiliza el seed de `004-public-search` con 40+ listings de ejemplo.
5. **Variables de entorno** configuradas (`.env` a partir de `.env.example`) — sin variables nuevas en esta feature.
6. **Servidor de desarrollo** corriendo: `npm run dev` en `/development`.

## Escenarios de validación

### 1. Detalle de un listing publicado (sin sesión)

**Pasos**:
1. Abrir la landing de búsqueda (`http://localhost:3000/`).
2. Hacer clic en cualquier tarjeta de resultado → navega a `/listings/[slug]`.
3. Verificar que la página carga sin redirección a login.
4. Verificar que se muestra la galería, el título, la descripción, el perfil del arrendador, el calendario, la tabla de precios, los botones Contactar/Reservar, la sección de reviews (o estado vacío), los productos similares, la info de seguro y las reglas.

**Resultado esperado**: Ficha completa visible sin sesión, HTTP 200, sin datos privados (email, teléfono, dirección exacta).

### 2. Detalle desde un enlace compartido (sin estado previo)

**Pasos**:
1. Copiar la URL de un detalle (`http://localhost:3000/listings/[slug]`).
2. Abrir en una ventana de incógnito (sin sesión ni estado previo).
3. Verificar que la ficha se renderiza correctamente.

**Resultado esperado**: Ficha completa visible, independiente de sesión y estado previo.

### 3. Galería con carrusel, zoom y fullscreen

**Pasos**:
1. Abrir el detalle de un listing con varias fotos.
2. Navegar con los botones anterior/siguiente (y flechas de teclado).
3. Verificar el indicador "foto X de N".
4. Hacer clic en la imagen → abre overlay de zoom.
5. Hacer scroll/pan en el overlay para hacer zoom.
6. Pulsar el botón "Pantalla completa" → entra en fullscreen (o fallback a overlay si no está disponible).
7. Pulsar Escape → cierra overlay/fullscreen.

**Resultado esperado**: Carrusel navegable, zoom funcional, fullscreen funcional, foco visible en todos los controles, navegación por teclado.

### 4. Calendario con selección de rango y fechas bloqueadas

**Pasos**:
1. Abrir el detalle de un listing con bloqueos de disponibilidad (ver seed de `004-public-search`).
2. Verificar que las fechas bloqueadas aparecen marcadas como no disponibles.
3. Seleccionar una fecha de recogida y una fecha de devolución posterior (rango válido).
4. Verificar que el rango se resalta y se muestra el número de días.
5. Verificar que la URL se actualiza con `?start=YYYY-MM-DD&end=YYYY-MM-DD`.
6. Intentar seleccionar un rango que incluya una fecha bloqueada.
7. Verificar que el sistema impide la selección o la marca como inválida.

**Resultado esperado**: Calendario interactivo, fechas bloqueadas marcadas, rango válido seleccionable, rango inválido impedido, URL refleja el rango.

### 5. Tabla de precios derivados y total estimado

**Pasos**:
1. Abrir el detalle de un listing.
2. Verificar que la tabla de precios muestra 3 tramos: 1 día (0% descuento), 3 días (5% descuento), 7 días (10% descuento).
3. Seleccionar un rango de 2 días en el calendario.
4. Verificar que el total estimado usa el tramo de 3 días (5% descuento).
5. Cambiar el rango a 5 días.
6. Verificar que el total estimado usa el tramo de 7 días (10% descuento).

**Resultado esperado**: Tabla con tramos derivados, total recalculado al cambiar rango, tramo aplicable correcto según días.

### 6. Botones Contactar y Reservar con gating de login

**Pasos**:
1. Abrir el detalle sin sesión.
2. Pulsar "Contactar" → redirige a `/auth?tab=login&callbackUrl=/listings/[slug]`.
3. Volver al detalle y pulsar "Reservar" sin rango seleccionado → muestra mensaje "Selecciona un rango de fechas".
4. Seleccionar un rango válido y pulsar "Reservar" → redirige a `/auth?tab=login&callbackUrl=/listings/[slug]?start=...&end=...`.
5. (Opcional) Iniciar sesión y repetir → redirige a `/messages?listing=[slug]` (Contactar) o `/checkout?...` (Reservar). Si las rutas no existen, muestra "próximamente".

**Resultado esperado**: Gating de login no bloqueante, callback preserva contexto, estados "próximamente" sin errores si los módulos destino no existen.

### 7. 404 para listings no publicados/inexistentes

**Pasos**:
1. Abrir `http://localhost:3000/listings/slug-inexistente`.
2. Verificar que se renderiza la página 404 informativa ("Este producto no está disponible o no existe").
3. (Opcional) Cambiar un listing a `status = draft` en BD y abrir su URL → verificar que también devuelve 404.

**Resultado esperado**: 404 HTTP informativo, sin filtrar motivo interno, sin error 500.

### 8. Productos similares

**Pasos**:
1. Abrir el detalle de un listing con categoría y zona con otros listings.
2. Verificar que la sección "Productos similares" muestra hasta 6 tarjetas.
3. Verificar que el listing actual no aparece en los similares.
4. Verificar que cada tarjeta enlaza a su propio detalle.

**Resultado esperado**: Similares de misma categoría/zona, sin duplicar el actual, enlaces correctos.

### 9. Secciones vacías (sin reviews, sin fotos, sin similares)

**Pasos**:
1. Abrir el detalle de un listing sin reviews (verificar en BD).
2. Verificar que la sección de reviews muestra "Aún no hay reviews para este producto".
3. (Opcional) Abrir el detalle de un listing sin fotos → verificar placeholder accesible en la galería.
4. (Opcional) Abrir el detalle de un listing sin similares → verificar que la sección se omite o muestra estado vacío.

**Resultado esperado**: Estados vacíos útiles, sin secciones en blanco ni errores.

### 10. Información de seguro según verificación del arrendador

**Pasos**:
1. Abrir el detalle de un listing cuyo arrendador está verificado.
2. Verificar que la sección de seguro muestra información del seguro aplicable (informativa).
3. Abrir el detalle de un listing cuyo arrendador NO está verificado.
4. Verificar que la sección de seguro muestra aviso "El alquiler no incluye seguro de plataforma porque el arrendador no ha verificado su identidad".

**Resultado esperado**: Info de seguro condicional según verificación, sin contratar ni gestionar reclamaciones (informativo).

### 11. Incremento del contador de vistas

**Pasos**:
1. Abrir el detalle de un listing y anotar su `viewCount` (visible en BD o en la ficha si se muestra).
2. Recargar la página inmediatamente.
3. Verificar que `viewCount` NO se incrementa (deduplicación dentro de ventana de 30 min).
4. Esperar 30+ minutos (o cambiar la IP simulada) y recargar.
5. Verificar que `viewCount` se incrementa en 1.

**Resultado esperado**: Contador incrementa solo una vez por visitante en ventana de 30 min, no infla con recargas.

### 12. Accesibilidad (teclado y lector de pantalla)

**Pasos**:
1. Navegar la ficha solo con teclado (Tab, flechas, Enter, Escape).
2. Verificar que todos los controles (carrusel, zoom, fullscreen, calendario, botones, similares) son accesibles.
3. Verificar foco visible en todos los controles.
4. Verificar `alt` en todas las imágenes.
5. (Opcional) Ejecutar axe-core sobre la página de detalle.

**Resultado esperado**: Navegación completa por teclado, foco visible, `alt` presente, sin violaciones críticas de WCAG AA.

## Comandos de test

```bash
# Desde /development

# Unitarios (servicio, price-tiers, schemas)
npm test -- --run tests/unit/listing-detail/

# Integración (router con DB real + PostGIS)
npm run test:integration -- --run tests/integration/listing-detail/listing.router.integration.test.ts

# Typecheck
npx tsc --noEmit

# Lint
npm run lint

# E2E (Playwright, si está configurado)
npx playwright test tests/e2e/listing-detail/
```

## Criterios de validación

- [ ] Todos los escenarios 1-12 pasan manualmente.
- [ ] Tests unitarios de `listing-detail.service`, `price-tiers` y `listing-detail.schema` pasan.
- [ ] Tests de integración de `listing.router` pasan (getBySlug, getSimilar, incrementView, 404).
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Lint sin errores.
- [ ] Sin datos privados en respuestas (verificar con inspector de red).
- [ ] Accesibilidad: navegación por teclado completa, foco visible, `alt` en imágenes.
- [ ] Las features existentes (`002-registration`, `003-login`, `004-public-search`) siguen funcionando.
