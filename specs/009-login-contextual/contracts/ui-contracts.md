# UI Contracts: Login contextual no intrusivo

**Feature**: `009-login-contextual` | **Date**: 2026-09-22

Contratos de la capa de presentación. **La API tRPC no cambia** — se consumen los procedimientos existentes: `auth.loginWithPassword`, `auth.logout`, `auth.getSession`.

## Parámetros de URL (convención única)

| Param | Ubicación | Semántica |
|-------|-----------|-----------|
| `tab` | `/auth?tab=login\|register` | Selecciona pestaña en la página completa de auth (existente) |
| `callback` | `/auth?...&callback=/ruta/interna` | Destino de retorno tras login en página completa. Único nombre válido; `callbackUrl` queda eliminado |

## `AuthDialogProvider` + `useAuthDialog()`

Provider de React Context montado en `AppProviders` (envuelve toda la app).

```ts
interface AuthDialogContextValue {
  open(): void;    // abre el diálogo de login
  close(): void;   // cierra el diálogo (cancelación o post-login)
  isOpen: boolean;
}
function useAuthDialog(): AuthDialogContextValue; // throw si falta provider
```

- `open()` es idempotente; `close()` no tiene side effects de navegación.
- El provider renderiza `<LoginDialog open={isOpen} onClose={close}/>` — los consumidores nunca renderizan el diálogo ellos mismos.

## `LoginDialog`

```ts
interface LoginDialogProps {
  open: boolean;
  onClose(): void;   // Escape, backdrop, botón de cierre, o post-login
}
```

- Elemento `<dialog>` nativo (`showModal()`/`close()`), clases `.dialog-backdrop`/`.dialog` existentes.
- Contenido: `LoginForm variant="dialog" onSuccess={onClose}` + enlace a `/auth?tab=register`.
- A11y: `aria-labelledby` al título; foco inicial en el primer campo; Escape y click en backdrop cierran vía `onClose`.

## `LoginForm` (modificado)

```ts
interface LoginFormProps {
  variant?: "page" | "dialog"; // default "page" (comportamiento actual)
  onSuccess?: () => void;      // solo relevante en "dialog"; sustituye al redirect
}
```

- `variant="page"`: comportamiento actual — `router.push(data.callback)` + `router.refresh()`.
- `variant="dialog"`: tras login OK → `utils.auth.getSession.invalidate()` + `router.refresh()` + `onSuccess()`. **Sin navegación**.
- Errores (credenciales, validación) se muestran inline en ambos modos.

## `useSession()`

```ts
function useSession(): {
  session: OnboardingStatus | null | undefined; // undefined = cargando
  isLoading: boolean;
  isAuthenticated: boolean;                     // session != null
}
```

- Wrapper de `api.auth.getSession.useQuery` con opciones fijas (`staleTime: 60_000`, `retry: false`).
- Todos los consumidores comparten la query key `auth.getSession` → deduplicación automática.

## `UserMenu` (header público)

Componente cliente sin props; consume `useSession()` + `useAuthDialog()`.

| Estado | Render |
|--------|--------|
| `isLoading` | Placeholder discreto (sin layout shift brusco) |
| anónimo | Botón "Entrar" → `open()`; link "Crear cuenta" → `/auth?tab=register` |
| identificado | Botón de identidad → menú con "Ir a mi panel" (`/dashboard`) y `LogoutButton` |

- Menú desplegable: `aria-haspopup="menu"`, `aria-expanded`, cierre por Escape y click-outside; foco gestionado.

## `ActionButtons` (modificado)

- Sustituye `router.push("/auth?tab=login&callbackUrl=…")` por `useAuthDialog().open()`.
- La consulta de sesión pasa a `useSession()` (mismas opciones, caché compartida).
- La construcción de callback URL queda obsoleta en este componente (el usuario no abandona la página).

## `AuthPage` (`/auth`, modificado)

- Server-side: si `getSession` devuelve sesión → `redirect(callback validado ?? "/dashboard")`.
- Sin sesión → comportamiento actual (`AuthTabs`).

## `LogoutButton` (existente, reutilizado)

- Se reutiliza tal cual dentro de `UserMenu` y del shell de dashboard.
- Post-logout: `invalidate(getSession)` + `router.refresh()`; el destino tras logout desde página pública es permanecer en la página (hoy navega a `/auth` — se ajusta a FR-008: solo redirige fuera si está en zona privada; desde pública se queda).
