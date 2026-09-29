# Quickstart: Login contextual no intrusivo

**Feature**: `009-login-contextual` | **Date**: 2026-09-22

Guía de validación end-to-end. Asume el entorno de `development/` ya configurado (ver README / specs anteriores).

## Prerequisitos

```bash
cd development
npm install          # si procede
npm run db:generate  # prisma generate
docker compose up -d # postgres (o la DB de desarrollo habitual)
npm run db:migrate
npm run db:seed      # usuarios de prueba
npm run dev          # http://localhost:3000
```

Credenciales: las del seed (ver `prisma/seed.ts`) o un usuario registrado por `/auth?tab=register`.

## Escenarios de validación manual

### V1 — Login sin abandonar la página (US1)

1. Sin sesión, abrir `/` (landing pública) o `/search`.
2. Pulsar **"Entrar"** en el header → se abre el diálogo sobre la página; la URL **no cambia**.
3. Introducir credenciales válidas → el diálogo se cierra, el header muestra el menú de usuario, **sin recarga ni cambio de página**.
4. Repetir con credenciales inválidas → error visible dentro del diálogo, que permanece abierto.
5. Abrir el diálogo y pulsar Escape / clic fuera / botón de cierre → se cierra sin efectos.

### V2 — Menú de sesión en header (US2)

1. Identificado, verificar en cualquier página pública que el header muestra el indicador de sesión (no "Entrar"/"Crear cuenta").
2. Desplegar el menú → opciones **"Ir a mi panel"** y **"Cerrar sesión"**.
3. "Ir a mi panel" → llega a `/dashboard`.
4. Volver a una pública → "Cerrar sesión" → la sesión termina y el header vuelve al estado anónimo **permaneciendo en la misma página**.

### V3 — Acción protegida con contexto (US3)

1. Sin sesión, abrir un listing `/listings/<slug>` y seleccionar un rango de fechas.
2. Pulsar **"Reservar"** → se abre el diálogo (no hay redirect).
3. Login válido → diálogo cerrado, mismo listing, **fechas intactas**; pulsar "Reservar" de nuevo → continúa el flujo.
4. Repetir cancelando el diálogo → permanece en el listing, la acción no se ejecuta.
5. Con sesión ya iniciada, "Contactar"/"Reservar" funcionan directamente sin diálogo.

### V4 — Acceso directo a zona privada (US4)

1. Sin sesión, navegar directo a `/dashboard/products` → redirect a `/auth?tab=login&callback=%2Fdashboard%2Fproducts`.
2. Login válido en la página → llega a `/dashboard/products` (**no** al dashboard raíz).
3. Con sesión activa, visitar `/auth` → redirect automático a `/dashboard` (no muestra el formulario).

### V5 — Accesibilidad del diálogo (FR-013 / SC-005)

1. Solo teclado: Tab hasta "Entrar" → Enter abre → foco cae en el primer campo → Tab recorre solo elementos del diálogo (focus trap) → Escape cierra → foco vuelve al botón "Entrar".
2. Lector de pantalla: el diálogo se anuncia como diálogo modal con su título.

## Verificación automatizada

```bash
cd development
npm run lint
npx tsc --noEmit
npm run test              # unit: useSession, callback param, provider
npm run test:integration  # router auth (regresión — sin cambios esperados)
```

Tests nuevos esperados (detalle en `tasks.md`):

- `useSession` devuelve `isAuthenticated` correcto según respuesta.
- `LoginForm variant="dialog"` llama `onSuccess` sin `router.push`.
- `UserMenu` renderiza estados anónimo/identificado.
- Middleware/`callback`: `callbackUrl` ya no se emite; `callback` validado rechaza URLs externas.
- Diálogo: apertura por `open()`, cierre por Escape/backdrop, foco inicial.

## Criterios de aceptación (mapeo SC)

| Escenario | SC |
|-----------|-----|
| V1: login sin cambio de URL | SC-001 |
| V3: contexto conservado en acción protegida | SC-002 |
| V2: panel/logout en ≤2 interacciones | SC-003 |
| V4: retorno al destino original | SC-004 |
| V5: operación completa solo teclado | SC-005 |
