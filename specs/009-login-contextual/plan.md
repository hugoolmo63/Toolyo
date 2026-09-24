# Implementation Plan: Login contextual no intrusivo

**Branch**: `009-login-contextual` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-login-contextual/spec.md`

## Summary

Sustituir la navegación a la página `/auth` como mecanismo de identificación en flujos de usuario por un **diálogo de login superpuesto** (opción A: solo login; el registro permanece como página completa). El header público pasa a ser **consciente de la sesión**: usuario anónimo ve "Entrar" + "Crear cuenta"; usuario identificado ve un menú con "Ir a mi panel" y "Cerrar sesión". Las acciones protegidas (Contactar/Reservar) abren el diálogo conservando el contexto. El middleware y la página `/auth` se mantienen como red de seguridad para accesos directos, unificando el parámetro de retorno (`callback`).

Enfoque técnico: provider de diálogo por React Context en `AppProviders`, elemento `<dialog>` nativo para focus-trap/Escape gratuitos, hook `useSession()` compartido sobre la query tRPC existente `auth.getSession`, y refactor de `LoginForm` para soportar modo diálogo sin redirección. **Cero cambios de backend**.

## Technical Context

**Language/Version**: TypeScript 5.6 / Node 20, React 18.3

**Primary Dependencies**: Next.js 14.2 (App Router, RSC), tRPC 11 + TanStack Query 5, React Hook Form + Zod, Tailwind CSS 3.4 + tokens CSS propios (tema `profesional-seguro`)

**Storage**: N/A — no hay cambios de datos; la sesión existente (cookie opaca + validación DB) se reutiliza tal cual

**Testing**: Vitest (unit + integration con testcontainers), Testing Library para componentes, Puppeteer para E2E existentes en `tests/e2e/`

**Target Platform**: Web (navegadores modernos; `<dialog>` nativo soportado en todos los target)

**Project Type**: Web application — monolito Next.js en `development/` (RSC + Client Components + tRPC)

**Performance Goals**: Apertura del diálogo instantánea (sin navegación); consulta de sesión deduplicada vía caché React Query (staleTime ≥ 30s)

**Constraints**: Server-first (RSC por defecto, Client Components solo donde haya interactividad); accesibilidad obligatoria (focus trap, Escape, aria-modal — FRONTEND.md §8); tokens de diseño obligatorios (DESIGN.md); sin nuevas dependencias si es evitable

**Scale/Scope**: ~6 archivos nuevos/modificados en `development/src`; sin migraciones ni cambios de API

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Documento | Regla aplicable | Evaluación |
|-----------|-----------------|------------|
| FRONTEND.md §4.1 | Server-first: RSC por defecto | ✅ Layouts públicos siguen siendo RSC; solo `UserMenu`, provider y diálogo son Client Components (interactividad real) |
| FRONTEND.md §5.1 | React Query vía tRPC = fuente de verdad de estado servidor | ✅ `useSession()` envuelve `api.auth.getSession.useQuery`; invalidación declarativa tras login/logout |
| FRONTEND.md §5.2 | Zustand para estado global transversal | ⚠️→✅ Zustand **no está instalado**; el estado del diálogo es UI efímera → React Context en `AppProviders` (más simple, sin nueva dependencia). Justificado en research.md |
| FRONTEND.md §5.3 | React Hook Form + Zod en formularios | ✅ Se reutiliza `LoginForm` existente con `LoginSchema` |
| FRONTEND.md §8 / DESIGN.md §7 | Focus trapping en modales, a11y | ✅ `<dialog>` nativo con `showModal()` provee focus trap + Escape + top-layer sin código extra |
| FRONTEND.md §7 | Tailwind + tokens DESIGN.md | ✅ Se reutilizan clases `.dialog*` existentes y tokens `--ps-*` |
| SECURITY.md §2 | Cookies HttpOnly/Secure/SameSite | ✅ Sin cambios: la cookie se sigue fijando vía `ctx.setCookie` en la mutación tRPC existente |
| SECURITY.md | Retorno a destino validado (open redirect) | ✅ `validateCallbackPath` existente se aplica; se unifica el nombre del parámetro |
| TESTING.md | Pirámide de testing | ✅ Unit (hook/dialogo), componente (Testing Library), integración (router sin cambios), E2E (Puppeteer existente) |
| BACKEND.md | Sin acceso directo a datos desde cliente | ✅ Solo se consumen procedimientos tRPC existentes |

**Veredicto**: PASS — sin violaciones; única nota justificada (Context vs Zustand por ausencia de la dependencia).

## Project Structure

### Documentation (this feature)

```text
specs/009-login-contextual/
├── plan.md              # Este archivo
├── research.md          # Decisiones de diseño (Phase 0)
├── data-model.md        # Entidades y contratos de datos (Phase 1)
├── quickstart.md        # Guía de validación (Phase 1)
├── contracts/
│   └── ui-contracts.md  # Contratos de componentes/hooks y parámetros
├── checklists/
│   └── requirements.md  # Checklist de calidad de spec
└── tasks.md             # (/speckit-tasks — no creado por plan)
```

### Source Code (repository root)

```text
development/src/
├── providers/
│   ├── app-providers.tsx            # MOD: monta AuthDialogProvider
│   └── auth-dialog-provider.tsx     # NEW: Context + estado del diálogo + render del <dialog>
├── components/
│   ├── auth/
│   │   ├── login-dialog.tsx         # NEW: <dialog> nativo con LoginForm en modo diálogo
│   │   └── user-menu.tsx            # NEW: header session-aware (Entrar | menú usuario)
│   └── forms/
│       └── login-form.tsx           # MOD: prop variant/onSuccess para modo diálogo
├── lib/
│   └── hooks/
│       └── use-session.ts           # NEW: wrapper compartido de api.auth.getSession
├── app/
│   ├── (public)/layout.tsx          # MOD: header usa <UserMenu/>
│   └── (auth)/auth/page.tsx         # MOD: redirect si ya autenticado
├── features/listing-detail/presentation/
│   └── action-buttons.tsx           # MOD: abre diálogo vía useAuthDialog; unifica callback
└── middleware.ts                    # sin cambios (red de seguridad)

development/tests/
├── unit/auth/
│   └── callback-param.test.ts       # NEW: unificación callback
└── unit/components/ (o e2e/)
    └── login-dialog.test.tsx        # NEW: apertura/cierre/a11y del diálogo
```

**Structure Decision**: Los componentes de autenticación transversales viven en `src/components/auth/` (convención existente: `components/forms` ya aloja los formularios de auth); el provider en `src/providers/` junto a `AppProviders`; el hook compartido en `src/lib/hooks/` (directorio nuevo, primera entrada — alternativa `components/auth/use-session.ts` si se prefiere co-localización). No se crea feature module porque auth es transversal, no un dominio.

## Complexity Tracking

> Sin violaciones de constitución que justificar.
