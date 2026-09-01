# Implementation Plan: Inicio de Sesión y Gestión de Sesión

**Branch**: `03-login` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-login/spec.md`

## Summary

Implementar el login por email/contraseña reutilizando la infraestructura de cuenta y verificación de `002-registration`. La estrategia de sesión es un token opaco de 32 bytes almacenado en una cookie HttpOnly/Secure/SameSite=Lax y respaldado por una nueva tabla `Session` en PostgreSQL que permite revocación inmediata. Se cablea el contexto tRPC para que `authedProcedure` funcione con sesiones reales, se añade middleware de Next.js para proteger rutas autenticadas, y se implementa logout idempotente, rate limiting de login, auditoría de eventos y redirección post-login según el estado de onboarding. La pantalla de autenticación es unificada (`/auth`) con tabs para alternar entre "Iniciar sesión" y "Crear cuenta", reutilizando el formulario de registro existente y redirigiendo `/register` a `/auth?tab=register`.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), Node.js 20+, Next.js 14.2 (App Router)

**Primary Dependencies**: tRPC 11, React Query 5, Prisma 5.20, Zod 3.23, React Hook Form 7, Tailwind CSS 3.4. Reutiliza `password.ts`, `rate-limit.service.ts`, `normalization.ts`, `capabilities.service.ts` y `SecurityEvent` de `002-registration`. No añade dependencias nuevas.

**Storage**: PostgreSQL 15 (via Prisma). Nueva tabla `Session` con token opaco, `userId`, `expiresAt`, `revokedAt`, `ip`, `userAgent` y auditoría.

**Testing**: Vitest (unitarios + integración con @testcontainers/postgresql), Playwright (E2E), axe-core (accesibilidad). Mismo patrón que `002-registration`.

**Target Platform**: Web (navegadores modernos, móvil y desktop). Next.js App Router en servidor.

**Project Type**: Web service (Next.js + tRPC + Prisma).

**Performance Goals**: Login < 500ms p95 (incluye hash verification + DB write). Carga de sesión desde DB < 50ms p95 (índice único por token).

**Constraints**: Sin secretos en logs ni respuestas. Cookie HttpOnly/Secure/SameSite=Lax. Rate limit 5 intentos/min por IP y por email. Sesión corta 1h (30d con "recuérdame"). Revocación inmediata. No enumeración de cuentas.

**Scale/Scope**: 1 nueva tabla (`Session`), 1 nuevo servicio (`login.service.ts`), 3 nuevos procedimientos tRPC (`loginWithPassword`, `logout`, `getSession`), 1 middleware de Next.js, 1 página unificada (`/auth` con tabs login/registro), 2 Client Components (`LoginForm` + `AuthTabs`), 1 Server Component (dashboard mínimo). ~10-14 archivos nuevos/modificados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Documento | Gate | Estado |
|-----------|------|--------|
| `SECURITY.md` §2.1 — Sesiones cortas, cookies HttpOnly/Secure/SameSite, revocación | Token opaco en DB, cookie HttpOnly/Secure/SameSite=Lax, `revokedAt` para revocación inmediata | ✅ PASS |
| `SECURITY.md` §2.3 — Contraseñas con Argon2id o bcrypt, mínimo 12 chars | Reutiliza `password.ts` (scrypt + `timingSafeEqual`). scrypt es aceptado por OWASP; migrar a Argon2id es mejora futura documentada | ✅ PASS (con nota) |
| `SECURITY.md` §5.2 — Rate limiting por IP y por usuario, 5 intentos/min para auth | Dos buckets: `login:ip:<ip>` y `login:email:<email>`, 5/min cada uno | ✅ PASS |
| `SECURITY.md` §8.1 — Logging de login fallido, cambios de credenciales, rate limiting | `SecurityEvent` con `login_success`, `login_failure`, `login_blocked`, `logout`, `session_revoked` | ✅ PASS |
| `BACKEND.md` §4.1 — `authedProcedure` requiere sesión válida | Contexto tRPC carga sesión desde cookie; `authedProcedure` existente funciona sin cambios | ✅ PASS |
| `BACKEND.md` §6.1 — Auth.js con JWT estratégico, sesiones cortas, refresh tokens | Se usa sesión opaca DB-backed en lugar de JWT. La constitución permite JWT pero exige una sola estrategia; el token opaco cumple todos los requisitos (HttpOnly, revocable, corto) sin exponer claims al cliente | ✅ PASS (decisión justificada en research.md) |
| `BACKEND.md` §9.1 — Jerarquía de errores, no exponer info interna | Reutiliza `AppError`, `UnauthorizedError`, `ValidationError`. Error genérico `invalid_credentials` sin distinguir email vs password | ✅ PASS |
| `FRONTEND.md` §1 — Server-first, Client Components solo para interacción | Página `/auth` es Server Component; `AuthTabs` y `LoginForm` son Client Components (React Hook Form + Zod) | ✅ PASS |
| `FRONTEND.md` §5.3 — React Hook Form + Zod para formularios | Formulario de login usa RHF + Zod compartido con backend | ✅ PASS |
| `FRONTEND.md` §10 — Route groups, `next/link` | Login vive en `(auth)`, dashboard en `(app)`. Middleware protege `(app)` | ✅ PASS |
| `TESTING.md` §2 — Pirámide: unitarios, integración, E2E | Unitarios para `login.service`, integración para `auth.router` con DB real, E2E para flujo login→dashboard→logout | ✅ PASS |
| `DESIGN.md` — Tokens `profesional-seguro`, accesibilidad WCAG AA | Formulario reutiliza tokens `--ps-*` de `002-registration`, labels explícitos, foco visible | ✅ PASS |

**Post-Phase 1 re-check**: El diseño de `data-model.md` y `contracts/auth-login.md` no introduce violaciones. La tabla `Session` sigue las convenciones de `DATABASE.md` (cuid, timestamptz, índices, soft-delete via `revokedAt`). El contrato tRPC sigue `BACKEND.md` §4 (routers delgados, Zod, sin Prisma crudo en respuestas).

## Project Structure

### Documentation (this feature)

```text
specs/003-login/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── auth-login.md    # Phase 1 output
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created yet)
```

### Source Code (repository root)

```text
development/
├── prisma/
│   ├── schema.prisma              # + modelo Session, + relación sessions en User
│   └── migrations/
│       └── <timestamp>_login_session/migration.sql
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── auth/
│   │   │   │   └── page.tsx       # Server Component — pantalla unificada con tabs
│   │   │   └── register/
│   │   │       └── page.tsx       # Modificado — redirige a /auth?tab=register
│   │   ├── (app)/
│   │   │   └── dashboard/
│   │   │       └── page.tsx       # Server Component — área autenticada mínima
│   │   └── api/trpc/[trpc]/
│   │       └── route.ts           # Modificado: pasa req al contexto
│   ├── components/forms/
│   │   ├── auth-tabs.tsx          # Client Component — tabs login/registro + arte dinámico
│   │   ├── login-form.tsx         # Client Component — RHF + Zod (formulario de login)
│   │   └── registration-form.tsx  # Reutilizado de 002-registration (sin cambios)
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   └── auth.router.ts # + loginWithPassword, logout, getSession
│   │   │   ├── root.ts            # Sin cambios (auth router ya registrado)
│   │   │   └── trpc.ts            # Modificado: createTRPCContext lee cookie
│   │   ├── auth/
│   │   │   ├── login.service.ts   # Nuevo — lógica de login
│   │   │   ├── session.service.ts # Modificado — createSession, validateSession, revokeSession
│   │   │   └── rate-limit.service.ts # Reutilizado
│   │   └── services/
│   │       └── security-event.service.ts # Modificado — eventos de login/logout
│   ├── lib/
│   │   ├── auth.ts                # Modificado — helpers de cookie, validación de callback
│   │   └── validations/
│   │       └── auth.ts            # + LoginSchema
│   ├── middleware.ts              # Nuevo — protege rutas (app), redirige a /auth
│   └── types/
│       └── auth.ts                # + SessionClaims, LoginResult
├── tests/
│   ├── unit/
│   │   └── auth/
│   │       ├── login.service.test.ts      # Nuevo
│   │       └── session.service.test.ts    # Nuevo
│   └── integration/
│       └── auth/
│           └── login.router.integration.test.ts # Nuevo
└── middleware.ts                  # Nuevo — Next.js middleware
```

**Structure Decision**: Estructura web application existente bajo `development/`, respetando la separación por capas de `002-registration` (domain, application, infrastructure, presentation). Los archivos nuevos siguen las convenciones de `BACKEND.md` §2.1 (servicios en `server/auth/`, routers en `server/api/routers/`, validaciones en `lib/validations/`) y `FRONTEND.md` §2.1 (páginas en `app/(auth)/` y `app/(app)/`, componentes en `components/forms/`). La pantalla unificada `/auth` reemplaza a `/login` como página separada y reutiliza el `RegistrationForm` existente dentro de un componente `AuthTabs` que alterna entre login y registro. La ruta `/register` existente se redirige a `/auth?tab=register` para mantener compatibilidad. No se crean nuevos route groups ni carpetas genéricas.

## Complexity Tracking

> No hay violaciones de la constitución que requieran justificación. La decisión de usar token opaco DB-backed en lugar de JWT está justificada en `research.md` y cumple todos los requisitos de `SECURITY.md` §2.1.
