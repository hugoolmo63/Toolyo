# Implementation Plan: Aplicación Móvil Multiplataforma (Web + Android + iPhone)

**Branch**: `014-app-movil-multiplataforma` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-app-movil-multiplataforma/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Entregar la misma aplicación en web, Android e iPhone desde una única base de código. La app Next.js existente en `development/` se conserva como fuente de verdad y se envuelve con **Capacitor** en shells nativos Android/iOS que cargan el despliegue web existente (enfoque remote-URL), de modo que los módulos de usuario final ya implementados funcionan con paridad total sin reescribir la UI ni la capa de datos. Se añaden capacidades nativas (cámara/galería, geolocalización, notificaciones, enlaces profundos, estado de red) mediante plugins de Capacitor y adaptaciones de layout para áreas seguras. La generación de artefactos instalables (APK Android y archivo/iOS) se automatiza con GitHub Actions, distribuyéndose como **artefactos internos** adjuntos a las ejecuciones y releases, sin publicación en tiendas. El backoffice administrativo permanece web-only.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 20; Java 17 + Android Gradle para el shell Android; Xcode/Swift toolchain para el shell iOS

**Primary Dependencies**: Next.js 14 App Router, React 18, tRPC 11, Prisma 5, PostgreSQL, Zod, Vitest, Playwright; se añaden `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios` y los plugins `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/push-notifications`, `@capacitor/app`, `@capacitor/network`, `@capacitor/status-bar` (ver `research.md`)

**Storage**: PostgreSQL mediante Prisma para la única entidad nueva (tokens de dispositivo para notificaciones push); los artefactos nativos no se persisten en base de datos (metadatos de build viven en la ejecución de GitHub Actions)

**Testing**: Vitest para detección de plataforma, parseo de enlaces profundos y contratos de asociación; Playwright con proyectos de viewport móvil (Pixel/iPhone) para paridad y áreas seguras; compilación nativa (`cap sync` + Gradle/Xcode) como verificación de build en CI

**Target Platform**: Web (navegadores), Android (minSdk según política del plan), iOS (versión mínima según política del plan); shell Capacitor cargando el despliegue web por entorno

**Project Type**: Aplicación web full-stack Next.js + app móvil híbrida (un único código de frontend, dos shells nativos)

**Performance Goals**: Paridad de acción visible entre plataformas en menos de 1 minuto (SC-002); arranque del shell nativo hasta contenido interactivo dentro de los objetivos de web móvil ya vigentes; builds nativas reproducibles por versión

**Constraints**: La app es server-first (Server Components, tRPC, Prisma, cookies de sesión `HttpOnly`) y no puede exportarse como estático; el shell nativo carga el despliegue web del entorno correspondiente. El endpoint del servicio es configurable en un único punto (variable de entorno y entrada del pipeline) con override en tiempo de ejecución en builds internas, y soporta disponibilidad exclusiva desde direcciones de la red local (intranet); el HTTP en claro se permite solo en builds internas/de desarrollo y en producción se exige HTTPS. Seguridad, autenticación y autorización por recurso idénticas a web. Sin secretos en artefactos. Artefactos iOS instalables en dispositivo sujetos a firma/provisioning.

**Scale/Scope**: Paridad total con los módulos de usuario final (búsqueda, detalle, reservas, mensajería, reviews, perfil, login). Backoffice excluido. Capacidades nativas del MVP: cámara/galería, geolocalización, notificaciones y enlaces profundos, más estado de red.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 gate: PASS

| Gate | Verificación |
|---|---|
| Fuente de verdad | Se conserva la app Next.js y el modelo Prisma existentes; solo se añade una entidad de tokens de dispositivo. |
| Gobernanza por capas | El plan respeta `FRONTEND.md` (server-first, App Router, tRPC), `SECURITY.md` (sesión, autorización, artefactos sin secretos), `DESIGN.md` (tokens y a11y) y `TESTING.md` (pirámide). |
| Normas declarativas | Requisitos y criterios del spec son verificables; las decisiones tecnológicas se documentan en `research.md`. |
| Responsabilidad por dominio | La feature toca frontend, seguridad y CI; cada cambio se valida contra su documento rector. |
| Revisión de cumplimiento | Se añade verificación de paridad de seguridad y de a11y en la fase de diseño. |

No se detectan violaciones constitucionales.

## Project Structure

### Documentation (this feature)

```text
specs/014-app-movil-multiplataforma/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
.github/workflows/
└── mobile.yml                      # Generación de artefactos nativos Android/iOS

development/
├── capacitor.config.ts             # Configuración del shell nativo (appId, server.url desde MOBILE_SERVER_URL)
├── .env.example                    # Documenta MOBILE_SERVER_URL y el modo de endpoint (interno/producción)
├── android/                        # Proyecto nativo Android (generado y versionado)
│   └── app/src/main/res/xml/network_security_config.xml  # Cleartext acotado a destinos locales
├── ios/                            # Proyecto nativo iOS (generado y versionado)
│   └── App/App/Info.plist          # ATS con NSAllowsLocalNetworking (solo builds internas)
├── package.json                    # Dependencias y scripts de Capacitor
├── next.config.mjs                 # Ajustes de headers/assetlinks si aplica
├── src/
│   ├── app/
│   │   └── .well-known/            # assetlinks.json y apple-app-site-association (route handlers)
│   ├── lib/native/                 # Detección de plataforma, endpoint configurable y wrappers de plugins
│   ├── components/native/          # Shell provider, banner offline, safe-area, deep-link, ajustes de endpoint
│   └── server/services/            # Registro/envío de push reutilizando notifications
└── tests/
    ├── unit/native/                # Detección de plataforma, parseo de enlaces y resolución de endpoint
    └── e2e/mobile/                 # Playwright con viewports móviles

specs/014-app-movil-multiplataforma/
├── contracts/mobile-platform.md
├── data-model.md
└── quickstart.md
```

**Structure Decision**: Se reutiliza la aplicación existente en `development/`. Capacitor añade dos proyectos nativos (`android/`, `ios/`) que actúan como contenedores del mismo frontend Next.js; la lógica de integración nativa vive en `src/lib/native` y `src/components/native`, sin duplicar UI. La automatización de builds se añade como un workflow dedicado `.github/workflows/mobile.yml` que reutiliza los patrones de `ci.yml` y `release.yml`. No se crea una segunda aplicación ni un backend alternativo.

## Development Phases

### Fase 1 — Shell Capacitor y paridad web

1. Añadir Capacitor y los proyectos `android/`/`ios/`; definir `capacitor.config.ts` con `appId`, `appName` y `server.url` alimentado desde `MOBILE_SERVER_URL` (configuración en un único punto, entrada del pipeline).
2. Implementar detección de plataforma y el provider del shell nativo; garantizar que la navegación, las cookies de sesión `HttpOnly` y tRPC funcionan dentro del WebView.
3. Verificar paridad de los módulos de usuario final (búsqueda, detalle, reservas, mensajería, reviews, perfil, login) y excluir el backoffice de la app.
4. Implementar la configuración de endpoint (FR-016/FR-017): resolución desde variable de entorno con override en tiempo de ejecución en builds internas, y soporte de direcciones de red local con `network_security_config.xml` en Android y `NSAllowsLocalNetworking` en iOS; en producción, HTTPS sin excepciones.

### Fase 2 — Experiencia y capacidades nativas

1. Adaptar layout a áreas seguras (viewport `viewport-fit=cover`, `env(safe-area-inset-*)`, utilidades alineadas con `DESIGN.md`) y a la navegación táctil/atrás del sistema.
2. Integrar cámara/galería, geolocalización, compartición y estado de red mediante plugins, con degradación controlada y solicitud de permisos en contexto.
3. Implementar enlaces profundos (App Links/Universal Links) con las rutas de asociación servidas desde la web y redirección tras login.

### Fase 3 — Notificaciones push y sesión/versión

1. Registrar tokens de dispositivo por usuario/plataforma y enviar notificaciones de mensajes nuevos reutilizando el servicio de `notifications` (FCM/APNs).
2. Respetar el permiso del usuario y permitir operar sin notificaciones.
3. Exponer la versión de app/shell y ofrecer la vía de actualización cuando proceda.

### Fase 4 — Pipeline de builds nativas en GitHub Actions

1. Crear `.github/workflows/mobile.yml` con jobs Android (ubuntu) e iOS (macos) que ejecuten `npm ci`, `cap sync` y la compilación nativa por versión, tomando `MOBILE_SERVER_URL` como entrada de `workflow_dispatch` (o valor por entorno) para generar el shell apuntando a la dirección configurada.
2. Subir los artefactos (APK y archivo/iOS) y adjuntarlos a la release en tags `v*.*.*`, con metadatos de versión/plataforma/fecha.
3. Fallar de forma explícita si una build no puede completarse y documentar los secretos de firma requeridos sin incluirlos en el repositorio.

## Phase 0 — Research Output

Decisiones sobre integración Capacitor/Next.js, plugins nativos, enlaces profundos, notificaciones, sesión en WebView y pipeline de builds: [research.md](./research.md).

## Phase 1 — Design Output

- [data-model.md](./data-model.md)
- [contracts/mobile-platform.md](./contracts/mobile-platform.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check: PASS

| Principio | Evidencia |
|---|---|
| Fuente de verdad | Un solo código de frontend; shells nativos como contenedores del despliegue web. |
| Seguridad por diseño | Sesión `HttpOnly`, autorización por recurso y artefactos sin secretos (FR-013). |
| Frontend server-first | Se mantienen App Router, Server Components y tRPC; no se duplica la capa de datos. |
| Diseño y a11y | Áreas seguras y tokens de `DESIGN.md`; navegación táctil y teclado/lector compatibles. |
| Testing | Unitarios de integración nativa, E2E con viewports móviles y verificación de build en CI. |
| Menor privilegio en CI | Permisos mínimos, secretos de firma fuera del repositorio y artefactos auditables. |

No se requieren entradas en Complexity Tracking.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
