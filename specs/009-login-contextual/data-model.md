# Data Model: Login contextual no intrusivo

**Feature**: `009-login-contextual` | **Date**: 2026-09-22

**Sin cambios de modelo de datos.** La feature es exclusivamente de capa de presentación/navegación. Se documentan las entidades consumidas y las reglas de los datos de interfaz.

## Entidades existentes (solo consumo)

### Sesión (existente, sin modificar)

- **Fuente**: cookie opaca `SESSION_COOKIE_NAME` (HttpOnly, SameSite=Lax, Secure en prod) validada en servidor contra DB.
- **Representación en cliente**: resultado de `api.auth.getSession` → objeto de onboarding status del usuario o `null`.
- **Ciclo de vida**: creada por `auth.loginWithPassword`, revocada por `auth.logout`. Esta feature no altera TTL ni revocación.
- **Reglas**:
  - `null` → estado anónimo (header muestra "Entrar"/"Crear cuenta"; acciones protegidas abren diálogo).
  - no `null` → estado identificado (header muestra menú de usuario).
  - Una cookie presente pero con sesión expirada/revocada se resuelve a `null` por la validación servidor — el cliente nunca infiere sesión desde la cookie.

### Destino de retorno (`callback`)

- **Tipo**: string — ruta interna relativa (`/...`).
- **Validación** (existente, `validateCallbackPath` + `LoginSchema.callback`):
  - Debe empezar por `/` y no por `//` (rechaza protocol-relative/external).
  - No puede contener `\` ni `\0`; longitud máxima 512.
  - Inválido/ausente → fallback `"/dashboard"`.
- **Uso**:
  - Middleware → `/auth?tab=login&callback=<destino>` (acceso directo a zona privada).
  - `/auth` página → tras login, `router.push(callback)`.
  - Flujo de diálogo → **no aplica** (sin navegación, el contexto se conserva in situ).

## Estado de UI nuevo (efímero, no persistido)

| Estado | Tipo | Ámbito |
|--------|------|--------|
| Diálogo de login abierto/cerrado | booleano | React Context global (`AuthDialogProvider`) |
| Menú de usuario desplegado | booleano | Estado local de `UserMenu` |

## Transiciones de estado relevantes

```text
ANÓNIMO
  ├── "Entrar" (header) → diálogo abierto
  ├── acción protegida → diálogo abierto
  │       ├── login OK → diálogo cerrado + sesión activa + contexto intacto → IDENTIFICADO
  │       ├── login error → diálogo abierto con error inline (sigue ANÓNIMO)
  │       └── cancelar (Escape/✕/backdrop) → diálogo cerrado (sigue ANÓNIMO, sin acción)
  └── URL privada directa → redirect /auth → login OK → redirect a destino → IDENTIFICADO

IDENTIFICADO
  ├── "Ir a mi panel" → /dashboard
  ├── "Cerrar sesión" (pública) → sesión revocada + misma página → ANÓNIMO
  ├── "Cerrar sesión" (área privada) → sesión revocada + fuera de zona privada → ANÓNIMO
  └── sesión expirada en siguiente consulta → ANÓNIMO (header y acciones lo reflejan)
```
