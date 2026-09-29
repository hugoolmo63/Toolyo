# Research: Login contextual no intrusivo

**Feature**: `009-login-contextual` | **Date**: 2026-09-22

Análisis del estado actual y decisiones de diseño. No quedan NEEDS CLARIFICATION pendientes — el contexto técnico estaba completo y las decisiones se resuelven contra el código existente y la constitución.

## Estado actual (hallazgos)

| Elemento | Estado | Implicación |
|----------|--------|-------------|
| `/auth` página completa | `AuthTabs` con login/register por query `?tab=` | Se mantiene para registro, deep links y fallback |
| Middleware | Redirige `/dashboard/*`, `/profile/*` → `/auth?tab=login&callback=…` | Red de seguridad; sin cambios estructurales |
| `api.auth.getSession` | Query pública que devuelve onboarding status o `null` | Reutilizable como fuente única de estado de sesión en cliente |
| `api.auth.loginWithPassword` | Fija cookie vía `ctx.setCookie`, devuelve `callback` validado | Sin cambios de backend |
| `ActionButtons` | Usa `callbackUrl` en redirect | **Bug**: `login-form` lee `callback` → retorno roto. Se corrige en esta feature (FR-011) |
| Estilos de diálogo | `.dialog-backdrop`, `.dialog` en globals.css (usados por `ListingDeleteDialog`) | Reutilizar tokens/clases existentes |
| Header público | Links estáticos login/register, ignora sesión | Sustituir por `UserMenu` session-aware |
| `AppProviders` | Compose de providers cliente (React Query + tRPC) | Punto de montaje natural del provider de diálogo |

## Decisiones

### D1: Estado del diálogo — React Context en `AppProviders`

- **Decision**: `AuthDialogProvider` (React Context) montado en `AppProviders`, con hook `useAuthDialog()` que expone `open()` / `close()`.
- **Rationale**: El estado "diálogo de login abierto" es UI efímera global. Context es suficiente, no requiere dependencia nueva y encaja con el patrón de compose de providers ya existente.
- **Alternatives considered**:
  - *Zustand* (FRONTEND.md §5.2 lo sugiere para estado transversal): descartado — **no está instalado** y añadir una dependencia para un booleano + callback no se justifica; si en el futuro entra Zustand para otro dominio, migrar es trivial.
  - *Estado en URL* (`?login=1`, nuqs está instalado): descartado — ensucia la URL, permite bookmark de un estado sin valor y complica el cierre (history back). El diálogo no necesita ser compartible.
  - *Estado local por componente*: descartado — el diálogo debe abrirse desde header, action buttons y futuros puntos sin duplicar renderizado.

### D2: Elemento de diálogo — `<dialog>` nativo con `showModal()`

- **Decision**: Usar el elemento HTML `<dialog>` con `showModal()`, estilizado con las clases/tokens `.dialog*` existentes.
- **Rationale**: Provee nativamente focus trapping, cierre con Escape, capa superior (top-layer) e inercia del fondo — cubre FR-013 y FRONTEND.md §8 sin librerías ni lógica manual. Soporte universal en navegadores target.
- **Alternatives considered**:
  - *Div con `role="dialog"`* (patrón actual de `ListingDeleteDialog`): requiere implementar a mano focus trap, Escape y bloqueo de scroll. Más código, más riesgo de a11y incompleta.
  - *Radix/shadcn Dialog*: FRONTEND.md menciona shadcn/ui como base, pero **no está instalado** en este proyecto (los estilos son CSS propio con tokens `--ps-*`). Añadir Radix sería la única dependencia nueva; innecesaria dado `<dialog>` nativo.

### D3: Reutilización de `LoginForm` — prop `variant`/`onSuccess`

- **Decision**: Un único `LoginForm` con props opcionales: `variant?: "page" | "dialog"` y `onSuccess?: () => void`. En modo diálogo no navega: cierra, invalida sesión y refresca la ruta.
- **Rationale**: Evita duplicar el formulario (validación Zod, errores inline, remember-me) y mantiene una sola fuente del markup de login.
- **Alternatives considered**:
  - *Componente separado `LoginDialogForm`*: duplicaría campos y validación; divergiría.
  - *Render-prop/children*: sobre-ingeniería para dos modos.

### D4: Estado de sesión — hook `useSession()` compartido

- **Decision**: `src/lib/hooks/use-session.ts` envolviendo `api.auth.getSession.useQuery(undefined, { staleTime: 60_000, retry: false })`. Todos los consumidores (UserMenu, ActionButtons, futuro contenido del diálogo) comparten la misma query key → una sola consulta en caché.
- **Rationale**: FR-012 (coherencia entre componentes) sale gratis por la deduplicación de React Query; centraliza staleTime/retry para evitar drift como el que ya existe (ActionButtons define sus propias opciones).
- **Post-login/logout**: tras `loginWithPassword` o `logout`, `utils.auth.getSession.invalidate()` + `router.refresh()` para refrescar RSC.

### D5: Parámetro de retorno — unificar en `callback`

- **Decision**: El único parámetro aceptado es `callback` (ya soportado por `LoginSchema` y validado por `validateCallbackPath`). Se corrige `ActionButtons` (`callbackUrl` → `callback`).
- **Rationale**: FR-011/SC-004 — hoy el login desde Contactar/Reservar siempre termina en `/dashboard` porque el form ignora `callbackUrl`. Con el diálogo el caso principal desaparece (el usuario no abandona la página), pero la página `/auth` sigue necesitando el retorno para accesos directos.
- **Nota**: En el flujo de diálogo no se usa callback en absoluto — el usuario permanece en contexto.

### D6: `UserMenu` en header público

- **Decision**: `src/components/auth/user-menu.tsx` (Client Component) dentro del header del `(public)/layout.tsx` RSC:
  - `session == null` → botón "Entrar" (`useAuthDialog().open()`) + link "Crear cuenta" → `/auth?tab=register`.
  - `session != null` → botón con identidad (nombre/iniciales) que despliega menú: "Ir a mi panel" (`/dashboard`) + `LogoutButton` reutilizado.
- **Rationale**: Layout sigue siendo RSC (server-first); solo el menú es cliente. Menú con `aria-haspopup`, `aria-expanded`, cierre por Escape y click-outside.
- **Alternatives considered**: *server-rendered header con datos de sesión* — requeriría hacer el layout dinámico por request y complica el streaming/caché; el patrón de query cliente ya existe en `ActionButtons`.

### D7: `/auth` ya autenticado → redirect

- **Decision**: En `app/(auth)/auth/page.tsx` (server), si `getSession` devuelve sesión, `redirect(callback ?? "/dashboard")`.
- **Rationale**: Escenario US4.4 — evita mostrar el formulario a quien ya está identificado.

### D8: Middleware — sin cambios

- **Decision**: Se mantiene tal cual (existencia de cookie → redirect a `/auth?tab=login&callback=…`).
- **Rationale**: Es la red de seguridad para acceso directo a zonas privadas; el diálogo no puede interceptar navegaciones full-page externas. Complementario, no contradictorio.

### D9: Continuación post-login — manual (reintentar acción)

- **Decision**: Tras login vía diálogo, el usuario permanece en la página con su contexto intacto y re-ejecuta la acción (Contactar/Reservar). No se auto-ejecuta la acción pendiente.
- **Rationale**: El spec (US3) exige conservar contexto, no auto-continuación. Auto-ejecutar acciones con side effects (navegar a checkout) tras un gesto intermedio puede sorprender; es extensible después si se desea.
