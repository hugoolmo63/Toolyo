# Tasks: Configuración de IP del servidor en aplicaciones móviles

**Input**: Design documents from `/specs/015-configuracion-ip-servidor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mobile-endpoint-settings.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each increment.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing mobile build uses bundled interface assets and identify the API endpoint boundary.

- [X] T001 Confirm the mobile build pipeline produces the bundled web assets in `development/capacitor/www` before native synchronization
- [X] T002 [P] Document the distinction between the bundled mobile interface and the configurable API endpoint in `development/.env.example`
- [X] T003 [P] Update the mobile build workflow in `.github/workflows/mobile.yml` so `MOBILE_SERVER_URL` is passed as the API endpoint without configuring a remote interface origin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the local-first native shell and shared endpoint state required by all user stories.

**Checkpoint**: The native application must be able to render its configuration UI when the API server is unavailable.

- [X] T004 Change `development/capacitor.config.ts` to load the bundled interface from `webDir` without assigning the configurable API endpoint to `server.url`
- [X] T005 Extend `development/src/lib/native/endpoint-config.ts` with URL normalization and validation for absolute URLs, allowed schemes, valid ports, forbidden credentials, and local cleartext rules
- [X] T006 [P] Add runtime preference helpers in `development/src/lib/native/endpoint-config.ts` to read, persist, and clear `toolyo.mobile.endpointOverride` with safe fallback when storage is unavailable
- [X] T007 Update `development/src/components/native/native-shell-provider.tsx` to expose the effective API endpoint and a refresh action after save/reset without requiring an application restart
- [X] T008 Update `development/src/components/native/network-status-banner.tsx` to consume the current endpoint from the native shell state and re-evaluate connectivity after endpoint changes
- [X] T009 [P] Extend `development/tests/unit/native/endpoint-config.test.ts` with failing-first coverage for URL validation, persistence, reset, fallback, and production security rules

---

## Phase 3: User Story 1 - Configurar el servidor en una aplicación móvil (Priority: P1) 🎯 MVP

**Goal**: Let Android and iPhone users configure and apply an API server address from a locally bundled interface.

**Independent Test**: With the API server unavailable at startup, open the bundled application, edit the endpoint, save a reachable address, and verify that the new endpoint is used without reinstalling or restarting.

### Tests for User Story 1

- [X] T010 [P] [US1] Add component tests in `development/tests/unit/native/mobile-endpoint-settings.test.tsx` for Android/iPhone visibility, current value display, save success, and persistence across remounts
- [X] T011 [P] [US1] Add an integration-oriented native shell test in `development/tests/unit/native/native-shell-provider.test.tsx` for updating the effective endpoint after a successful save

### Implementation for User Story 1

- [X] T012 [US1] Create `development/src/components/native/mobile-endpoint-settings.tsx` with the editable endpoint field, save action, current effective endpoint, loading state, and accessible status messages
- [X] T013 [US1] Integrate `development/src/components/native/mobile-endpoint-settings.tsx` into `development/src/components/native/native-shell-provider.tsx` so it renders from the bundled native shell and is available while the API is unreachable
- [X] T014 [US1] Implement save handling across `development/src/components/native/mobile-endpoint-settings.tsx` and `development/src/lib/native/endpoint-config.ts` to validate, probe reachability, persist the endpoint, and refresh shell state only after success
- [X] T015 [US1] Ensure API-consuming mobile code uses the effective endpoint from `development/src/components/native/native-shell-provider.tsx` rather than the remote interface origin

**Checkpoint**: The application can boot locally, display the configuration screen, save a reachable API endpoint, and use it without a restart.

---

## Phase 4: User Story 2 - Corregir una configuración inválida (Priority: P2)

**Goal**: Prevent invalid or unreachable addresses from replacing the last working endpoint and provide actionable feedback.

**Independent Test**: Enter empty, malformed, unsafe, wrong-port, and unreachable addresses; verify that each error is explained and the previously working endpoint remains active.

### Tests for User Story 2

- [X] T016 [P] [US2] Add validation error tests in `development/tests/unit/native/mobile-endpoint-settings.test.tsx` for empty values, malformed URLs, unsupported schemes, invalid ports, and embedded credentials
- [X] T017 [P] [US2] Add unreachable-server and fallback tests in `development/tests/unit/native/mobile-endpoint-settings.test.tsx` verifying that failed probes do not replace the last functional endpoint

### Implementation for User Story 2

- [X] T018 [US2] Add explicit validation and user-facing error messages in `development/src/components/native/mobile-endpoint-settings.tsx` for every rejected input category
- [X] T019 [US2] Add a bounded reachability probe in `development/src/lib/native/endpoint-config.ts` or a colocated native utility, ensuring timeout and network errors preserve the previous effective endpoint
- [X] T020 [US2] Implement the confirmed reset action in `development/src/components/native/mobile-endpoint-settings.tsx` and `development/src/lib/native/endpoint-config.ts` to clear the override and restore the bundled default API endpoint
- [X] T021 [US2] Add reset and fallback assertions to `development/tests/unit/native/endpoint-config.test.ts` and update `development/tests/unit/native/network-status-banner.test.tsx` if the existing test suite covers the banner

**Checkpoint**: Invalid and unreachable addresses are recoverable without reinstalling the app or losing the last functional endpoint.

---

## Phase 5: User Story 3 - Mantener sin cambios otras distribuciones (Priority: P3)

**Goal**: Keep the endpoint configuration exclusively within Android/iPhone native distributions and preserve web behavior.

**Independent Test**: Run the web distribution and a mobile build with runtime override disabled; verify that neither exposes an editable endpoint control while existing connection behavior remains unchanged.

### Tests for User Story 3

- [X] T022 [P] [US3] Add platform-visibility tests in `development/tests/unit/native/mobile-endpoint-settings.test.tsx` for web, Android, and iPhone platform states
- [X] T023 [P] [US3] Add production-safety tests in `development/tests/unit/native/endpoint-config.test.ts` confirming runtime override is disabled and public HTTP endpoints are rejected for production

### Implementation for User Story 3

- [X] T024 [US3] Gate `development/src/components/native/mobile-endpoint-settings.tsx` on `getAppPlatform()` and `allowRuntimeOverride`, rendering no editable controls for web or production mobile builds
- [X] T025 [US3] Preserve platform-specific navigation and API behavior in `development/src/components/native/native-shell-provider.tsx` while removing any dependency on a remote `server.url`
- [X] T026 [US3] Update `development/capacitor.config.ts` and `.github/workflows/mobile.yml` to keep allowed navigation domains explicit and prevent wildcard or unintended remote-origin loading

**Checkpoint**: Web and production mobile distributions retain their existing behavior and do not expose the runtime endpoint editor.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete local-first flow and keep documentation and security behavior aligned.

- [X] T027 [P] Add accessibility assertions for labels, focus order, status announcements, and error association in `development/tests/unit/native/mobile-endpoint-settings.test.tsx`
- [X] T028 [P] Update `development/.env.example` and relevant mobile documentation to explain that `MOBILE_SERVER_URL` is the API endpoint and that the interface is bundled locally
- [X] T029 Run the automated checks from `specs/015-configuracion-ip-servidor/quickstart.md` in `development` and record any environment-specific limitations
- [ ] T030 Run `npm run build` and the Android/iPhone synchronization/build validation from `development/package.json`, confirming the bundled interface starts without the API server (native platform projects are not present in this checkout)
- [X] T031 Review the final implementation against `specs/015-configuracion-ip-servidor/contracts/mobile-endpoint-settings.md` and the security requirements before marking the feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; clarifies the existing packaging boundary.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories because the local-first shell is required for the configuration screen to work offline from the API.
- **User Story 1 (Phase 3)**: Depends on Phase 2 and delivers the MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 3 because it extends the save flow with fallback, reset, and error handling.
- **User Story 3 (Phase 5)**: Depends on Phase 2; its platform isolation checks can run in parallel with US2, but final integration follows US1.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: Foundational only; MVP target.
- **US2 (P2)**: Builds on the US1 save flow.
- **US3 (P3)**: Can begin after Foundational, but final verification depends on the native shell integration from US1.

### Parallel Opportunities

- T002 and T003 can run in parallel after confirming the packaging boundary.
- T006 and T009 can run in parallel with T005 if they coordinate on the endpoint helper API.
- T010 and T011 can run in parallel before US1 implementation.
- T016 and T017 can run in parallel before US2 implementation.
- T022 and T023 can run in parallel before US3 implementation.
- T027 and T028 can run in parallel during Polish.

## Parallel Example: User Story 1

```text
Task: T010 — Component tests for the mobile endpoint settings UI
Task: T011 — Native shell endpoint refresh test

After the tests are in place:
Task: T012 — Implement the settings component
Task: T014 — Implement save, probe, persistence, and refresh behavior
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 to clarify that the interface is bundled locally.
2. Complete Phase 2 to remove the remote-origin startup dependency and establish endpoint state.
3. Complete Phase 3 to expose the local settings screen and save a reachable API endpoint.
4. Validate startup with the API unavailable, then validate the new endpoint after saving.

### Incremental Delivery

1. Deliver the local-first native shell and basic endpoint configuration as the MVP.
2. Add robust validation, fallback, unreachable-server messaging, and reset behavior from US2.
3. Add platform isolation and production safety verification from US3.
4. Run the complete quickstart and native build checks.
