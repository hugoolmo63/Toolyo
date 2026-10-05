---

description: "Task list for the multiplatform mobile app feature"
---

# Tasks: Aplicación Móvil Multiplataforma (Web + Android + iPhone)

**Input**: Design documents from `/specs/014-app-movil-multiplataforma/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included because `constitution/TESTING.md` is mandatory for this project (pirámide de testing) and the plan defines a mobile testing strategy. Unit and E2E tasks are marked accordingly.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- App existente: `development/` (Next.js). Native shells: `development/android/`, `development/ios/`.
- Integración nativa: `development/src/lib/native/`, `development/src/components/native/`.
- Tests: `development/tests/{unit,e2e}/native/`.
- CI: `.github/workflows/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Añadir Capacitor, configurar el shell y versionar los proyectos nativos.

- [X] T001 Add Capacitor core/cli/android/ios and the required plugins (`@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/push-notifications`, `@capacitor/app`, `@capacitor/network`, `@capacitor/status-bar`) with exact versions (published ≥7 days) and scripts (`cap:sync`, `build:android`, `build:ios`) in development/package.json
- [X] T002 [P] Create development/capacitor.config.ts with `appId`, `appName`, `webDir`, `server.url` from `MOBILE_SERVER_URL`, `server.allowNavigation` (app domain only, never `*`) and `server.cleartext` from `MOBILE_ALLOW_CLEARTEXT`
- [X] T003 [P] Document `MOBILE_SERVER_URL`, `MOBILE_ALLOW_CLEARTEXT` and `MOBILE_ALLOW_RUNTIME_OVERRIDE` with examples (public HTTPS and local-network HTTP) in development/.env.example
- [X] T004 Generate and version the native projects via `npx cap add android` and `npx cap add ios` (baseline commit of development/android and development/ios)

**Checkpoint**: Shell creado y sincronizable; `npx cap sync` funciona.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida que DEBE existir antes de cualquier user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Implement platform detection (native shell vs browser) in development/src/lib/native/platform.ts
- [X] T006 [P] Implement endpoint resolution (`MobileEndpointConfig`: baseUrl, allowRuntimeOverride, allowCleartext) in development/src/lib/native/endpoint-config.ts per contracts/mobile-platform.md §1.1
- [X] T007 [P] Add Android cleartext policy scoped to local destinations in development/android/app/src/main/res/xml/network_security_config.xml and reference it from development/android/app/src/main/AndroidManifest.xml (no global cleartext)
- [X] T008 [P] Add iOS ATS local networking (`NSAppTransportSecurity` → `NSAllowsLocalNetworking`) in development/ios/App/App/Info.plist (no `NSAllowsArbitraryLoads`)
- [X] T009 Create `NativeShellProvider` in development/src/components/native/native-shell-provider.tsx and mount it in development/src/app/layout.tsx (depends on T005, T006)
- [X] T010 [P] Unit tests for platform detection and endpoint resolution in development/tests/unit/native/platform.test.ts and development/tests/unit/native/endpoint-config.test.ts (depends on T005, T006)

**Checkpoint**: Shell detecta plataforma y resuelve endpoint; base lista para user stories.

---

## Phase 3: User Story 1 - La misma aplicación en web, Android e iPhone (Priority: P1) 🎯 MVP

**Goal**: La app instalable en Android e iPhone ofrece paridad total con web y el backoffice queda excluido.

**Independent Test**: Instalar en Android e iPhone, iniciar sesión con la misma cuenta usada en web y comprobar que búsqueda, detalle, reservas, mensajería, reviews y perfil muestran los mismos datos; una acción en móvil se refleja en web en <1 min.

- [X] T011 [US1] Configure `server.allowNavigation` and WebView cookie/session behavior so tRPC and `HttpOnly` session cookies work in development/capacitor.config.ts (depends on T002)
- [X] T012 [P] [US1] Exclude `/admin` from mobile destinations and guard navigation in development/src/lib/native/platform.ts
- [X] T013 [P] [US1] E2E parity test with mobile viewports (Pixel + iPhone) covering search, detail, booking, messaging, reviews and profile in development/tests/e2e/mobile/parity.spec.ts
- [ ] T014 [US1] Validate parity on real Android/iOS devices following specs/014-app-movil-multiplataforma/quickstart.md scenario 1 — BLOQUEADA: requiere dispositivos físicos y build firmada; ejecutar manualmente en el entorno del equipo

**Checkpoint**: US1 funcional y testable de forma independiente (MVP).

---

## Phase 4: User Story 2 - Generación de builds nativas desde GitHub (Priority: P1)

**Goal**: El repositorio genera artefactos instalables Android/iOS con metadatos y los adjunta a la release.

**Independent Test**: Lanzar el workflow sobre una versión y descargar APK + artefacto iOS; forzar un fallo y comprobar que no se publica artefacto incompleto.

- [X] T015 [US2] Create .github/workflows/mobile.yml with `workflow_dispatch` inputs (`server_url`, `allow_cleartext`) and `push` trigger on tags `v*.*.*` per contracts/mobile-platform.md §4.1
- [X] T016 [US2] Implement the Android job in .github/workflows/mobile.yml (ubuntu, JDK 17, Android SDK, `npm ci`, `cap sync`, Gradle `assembleDebug`/`assembleRelease` with conditional keystore from secrets)
- [X] T017 [P] [US2] Implement the iOS job in .github/workflows/mobile.yml (macos runner, Xcode, `npm ci`, `cap sync`, `xcodebuild` with conditional signing from secrets)
- [X] T018 [US2] Upload artifacts with version/platform/date/signature metadata and attach them to the GitHub Release on tags; fail the run explicitly on build error (no incomplete artifact) in .github/workflows/mobile.yml
- [X] T019 [US2] Document required signing/push secrets (names only, no values) in .github/workflows/mobile.yml comments and development/README.md

**Checkpoint**: US1 y US2 funcionan de forma independiente.

---

## Phase 5: User Story 3 - Experiencia adaptada al dispositivo móvil (Priority: P2)

**Goal**: Interfaz cómoda y correcta en móvil: áreas seguras, gestos, navegación táctil y acceso a cámara/galería/ubicación.

**Independent Test**: Recorrer en dispositivo con notch los flujos de búsqueda, detalle, reserva y mensajería sin contenido cortado, con "atrás" del sistema funcionando y subida de fotos por cámara/galería.

- [X] T020 [P] [US3] Implement safe-area layout (`viewport-fit=cover`, `env(safe-area-inset-*)` utilities aligned with DESIGN.md) in development/src/app/layout.tsx and development/src/styles/globals.css
- [X] T021 [US3] Implement back button/gesture handling via `@capacitor/app` in development/src/components/native/back-button-handler.tsx
- [X] T022 [P] [US3] Implement camera/gallery wrapper in development/src/lib/native/camera.ts and wire it into the listing photo upload flow
- [X] T023 [P] [US3] Implement geolocation wrapper in development/src/lib/native/geolocation.ts and wire it into the search location selector
- [X] T024 [US3] Implement permission-denial degradation with clear guidance in development/src/components/native/permission-state.tsx
- [X] T025 [P] [US3] E2E mobile layout and permission test in development/tests/e2e/mobile/experience.spec.ts

**Checkpoint**: Experiencia móvil validada con US1 y US2.

---

## Phase 6: User Story 4 - Continuidad de sesión y acceso a contenido compartido (Priority: P2)

**Goal**: Los enlaces compartidos abren la app en el contenido correcto y la sesión persiste entre aperturas.

**Independent Test**: Compartir un enlace a un listing, abrirlo con y sin sesión y verificar la redirección tras login; cerrar y reabrir la app y comprobar que la sesión sigue activa.

- [X] T026 [US4] Implement the deep-link parser (pure, returns internal route or `null`) in development/src/lib/native/deep-link.ts per contracts/mobile-platform.md §2.1
- [X] T027 [US4] Implement the `appUrlOpen` handler with post-login redirect in development/src/components/native/deep-link-handler.tsx (depends on T026)
- [X] T028 [P] [US4] Add route handlers for `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` in development/src/app/.well-known/ (values injected from build config/secrets)
- [X] T029 [P] [US4] Unit tests for the deep-link parser in development/tests/unit/native/deep-link.test.ts
- [X] T030 [US4] Verify and configure session persistence across app restarts (WebView cookie behavior) in development/capacitor.config.ts and document the result

**Checkpoint**: Enlaces profundos y sesión validados.

---

## Phase 7: User Story 5 - Notificaciones y estado sin conexión (Priority: P3)

**Goal**: Avisos de mensajes nuevos por notificación y estado claro cuando no hay conexión o el endpoint no es alcanzable.

**Independent Test**: Recibir un mensaje con la app en segundo plano y abrir la conversación desde el aviso; desactivar la red y comprobar el estado sin pérdida de datos.

- [X] T031 [US5] Add the `MobilePlatform` enum and `DevicePushToken` model with relations/indexes and generate the migration in development/prisma/schema.prisma per data-model.md
- [X] T032 [US5] Implement `mobile.registerDevice` and `mobile.revokeDevice` (Zod-validated, session-derived `userId`, resource authorization) in development/src/server/api/routers/mobile.router.ts and register it in development/src/server/api/root.ts (depends on T031)
- [X] T033 [US5] Integrate push delivery (FCM HTTP v1 / APNs) into the existing notifications service in development/src/server/services/, without blocking message persistence (depends on T031)
- [X] T034 [US5] Implement client push registration and permission handling in development/src/lib/native/push.ts and wire it into the native shell provider
- [X] T035 [P] [US5] Implement the offline / "service unreachable" banner in development/src/components/native/network-status-banner.tsx (distinguish no-connection from endpoint-unreachable per FR-016/FR-017)
- [X] T036 [P] [US5] Unit and integration tests for the mobile router and token lifecycle in development/tests/unit/native/mobile-router.test.ts and development/tests/integration/native/device-push-token.test.ts
- [X] T037 [US5] Wire push configuration (Android `google-services.json`, iOS APNs capability) into development/android and development/ios and into CI secrets handling

**Checkpoint**: Todas las user stories son independientemente funcionales.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias.

- [X] T038 [P] Update docs/03-arquitectura-y-tech-stack.md to reflect the Capacitor-over-Next.js strategy (replacing the React Native + Expo proposal)
- [X] T039 [P] Update development/README.md and README.md with mobile build, endpoint configuration and artifact instructions
- [X] T040 Security review: confirm production builds reject cleartext and disable runtime endpoint override, and that artifacts contain no `.env`, secrets or private keys
- [X] T041 Run specs/014-app-movil-multiplataforma/quickstart.md end-to-end and record results — validado lint + 264 tests unitarios + `next build`; los pasos de dispositivo requieren hardware (ver T014)
- [X] T042 [P] Accessibility checks (axe-core) on mobile viewports for the critical flows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Can proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - no dependencies on other stories (builds the shell from Setup/Foundational)
- **User Story 3 (P2)**: Can start after Foundational - may integrate with US1 but is independently testable
- **User Story 4 (P2)**: Can start after Foundational - depends on T026 before T027
- **User Story 5 (P3)**: Can start after Foundational - depends on T031 before T032/T033

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services; services before endpoints
- Core implementation before integration
- Story complete before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003)
- All Foundational tasks marked [P] can run in parallel (T006, T007, T008, T010)
- Once Foundational completes, US1–US5 can start in parallel if staffed
- Within each story, [P] tasks touch different files

---

## Parallel Example: User Story 1

```bash
Task: "Exclude /admin from mobile destinations in development/src/lib/native/platform.ts"
Task: "E2E parity test in development/tests/e2e/mobile/parity.spec.ts"
```

## Parallel Example: Foundational

```bash
Task: "Endpoint resolution in development/src/lib/native/endpoint-config.ts"
Task: "Android network_security_config.xml + AndroidManifest.xml"
Task: "iOS Info.plist ATS NSAllowsLocalNetworking"
Task: "Unit tests in development/tests/unit/native/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test US1 independently on real devices
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → shell listo
2. US1 → paridad web/Android/iOS (MVP)
3. US2 → pipeline de builds nativas
4. US3 → experiencia móvil
5. US4 → enlaces profundos y sesión
6. US5 → notificaciones y offline
7. Polish → documentación, seguridad y validación

### Parallel Team Strategy

1. El equipo completa Setup + Foundational
2. Una vez listo: Dev A → US1, Dev B → US2, Dev C → US3; US4 y US5 después (dependen de trabajo de datos/router)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- Endpoint configurability (FR-016/FR-017) lives in Foundational (T006–T008) because all stories need it
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
