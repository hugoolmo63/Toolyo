---

description: "Implementation tasks for the public user profile"
---

# Tasks: Vista Pública del Perfil de Usuario

**Input**: Design documents from `/specs/006-public-user-profile/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/profile-public.md`, `quickstart.md`

**Tests**: Included because the specification requires unit, integration, E2E and accessibility validation.

**Organization**: Tasks are grouped by the three independently testable P1 user stories.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the feature folders and shared public-profile contracts without changing existing behavior.

- [X] T001 Create the public-profile source folders `development/src/components/profile/`, `development/src/features/users/domain/`, `development/src/features/users/shared/`, and `development/tests/unit/user-profile/`.
- [X] T002 [P] Add the serializable public profile DTO and child types in `development/src/features/users/domain/public-user-profile.ts` following `specs/006-public-user-profile/data-model.md`.
- [X] T003 [P] Add public-profile input/output schemas and coordinate validation in `development/src/features/users/shared/public-user-profile.schema.ts`.
- [X] T004 [P] Add the public-profile test fixtures and factories in `development/tests/unit/user-profile/fixtures.ts` without using real personal data.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the secure server-side projection and shared route error/loading boundaries required by all user stories.

**⚠️ CRITICAL**: Complete this phase before implementing story UI components.

- [X] T005 Implement the explicit Prisma public-profile select, active-user filter, published-listing filter, primary-photo selection, and private-field exclusion in `development/src/features/users/infrastructure/public-user-profile.repository.ts`.
- [X] T006 Implement the application service that maps Prisma records to `PublicUserProfileDTO`, derives Registered/Verified/SuperLessor badges, parses approximate coordinates, and throws a public not-found error in `development/src/features/users/application/public-user-profile.service.ts`.
- [X] T007 [P] Add the public profile tRPC query or server-caller contract in `development/src/server/api/routers/user-profile.router.ts`, exposing only the DTO defined in `development/src/features/users/domain/public-user-profile.ts`.
- [X] T008 [P] Add route-level loading, error, and not-found states in `development/src/app/users/[id]/loading.tsx`, `development/src/app/users/[id]/error.tsx`, and `development/src/app/users/[id]/not-found.tsx`.
- [X] T009 Add unit tests for the public projection, badge derivation, active-listing filtering, coordinate sanitization, and private-field absence in `development/tests/unit/user-profile/public-user-profile.service.test.ts`.
- [ ] T010 Add Prisma integration tests for active/inactive users, published/draft/deleted listings, primary photos, and absence of private fields in `development/tests/integration/user-profile/public-user-profile.repository.integration.test.ts`.

**Checkpoint**: A secure public DTO is available and validated independently of the React UI.

---

## Phase 3: User Story 1 - Conocer la reputación de un usuario (Priority: P1) 🎯 MVP

**Goal**: Render a public profile header with identity, registration date, reputation, trust badges, and a safe Contact action.

**Independent Test**: Open `/users/[id]` for an active fixture and verify the header displays public identity/reputation data, badges are server-derived, and Contactar does not expose direct contact details.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add component tests for header fallbacks, localized registration date, rating, transaction count, and Contactar link behavior in `development/tests/unit/user-profile/UserProfileHeader.test.tsx`.
- [ ] T012 [P] [US1] Add component tests for Registered, Verified, and SuperLessor badge visibility in `development/tests/unit/user-profile/UserProfileBadges.test.tsx`.
- [ ] T013 [US1] Add an integration test for the public profile route and 404 behavior in `development/tests/integration/user-profile/public-profile-route.integration.test.ts`.

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement `UserProfileBadges` with server-derived badge props and accessible labels in `development/src/components/profile/UserProfileBadges.tsx`.
- [X] T015 [US1] Implement `UserProfileHeader` with avatar fallback, display name, localized `createdAt`, rating, transaction count, badges, and safe Contactar CTA in `development/src/components/profile/UserProfileHeader.tsx`.
- [X] T016 [US1] Implement the Server Component route that loads the public DTO with Prisma/service, calls `notFound()` for unavailable users, and composes the header in `development/src/app/users/[id]/page.tsx`.
- [X] T017 [US1] Add profile-header and badge styles using existing `--ps-*` design tokens in `development/src/styles/globals.css`.

**Checkpoint**: US1 is a usable MVP profile page with reputation and safe contact entry point.

---

## Phase 4: User Story 2 - Consultar la zona habitual sin conocer la dirección exacta (Priority: P1)

**Goal**: Show an approximate public location without exposing exact coordinates or address data.

**Independent Test**: Open a fixture with valid coordinates and verify the map centers on the zone, renders a transparent 750 m radius circle, and displays no exact location text; repeat with missing/invalid coordinates.

### Tests for User Story 2

- [ ] T018 [P] [US2] Add unit tests for coordinate parsing, invalid-range rejection, and public approximate-location mapping in `development/tests/unit/user-profile/preferred-location.test.ts`.
- [ ] T019 [P] [US2] Add component tests for map loading, map failure fallback, missing location state, and privacy copy in `development/tests/unit/user-profile/UserProfileLocationMap.test.tsx`.
- [ ] T020 [US2] Add an accessibility/E2E scenario for keyboard navigation around the map fallback and profile content in `development/tests/e2e/user-profile/location.spec.ts`.

### Implementation for User Story 2

- [X] T021 [US2] Implement the client-only Leaflet map with OpenStreetMap tiles and a 750 m circle, without rendering exact coordinates, in `development/src/components/profile/UserProfileLocationMap.tsx`.
- [X] T022 [US2] Reuse or extract the existing dynamic Leaflet loading and CSS/icon fallback patterns from `development/src/features/users/presentation/preferred-location-map.tsx` into the public map component.
- [X] T023 [US2] Compose `UserProfileLocationMap` into `development/src/app/users/[id]/page.tsx` with an accessible no-location state and non-blocking map loading behavior.
- [X] T024 [US2] Add responsive map, privacy text, loading, and failure-fallback styles in `development/src/styles/globals.css`.

**Checkpoint**: US2 protects location privacy while still providing useful geographic context.

---

## Phase 5: User Story 3 - Explorar anuncios y reseñas (Priority: P1)

**Goal**: Show active listings in a reusable card grid and public reviews or a clear empty state.

**Independent Test**: Open a fixture with published listings and public reviews, verify cards link to listing detail, reviews are newest-first, and empty states work when either collection is empty.

### Tests for User Story 3

- [ ] T025 [P] [US3] Add component tests for listing-card content, image fallback, public fields, and detail links in `development/tests/unit/user-profile/ListingCard.test.tsx`.
- [ ] T026 [P] [US3] Add component tests for listing-grid loading/empty states and review-list ordering/empty state in `development/tests/unit/user-profile/UserProfileListingsReviews.test.tsx`.
- [ ] T027 [US3] Add integration tests for published-listing ownership, primary photos, moderated review projection, newest-first ordering, and private review-field exclusion in `development/tests/integration/user-profile/listings-reviews.integration.test.ts`.

### Implementation for User Story 3

- [X] T028 [P] [US3] Implement the reusable public `ListingCard` DTO adapter and detail link in `development/src/components/profile/ListingCard.tsx`.
- [X] T029 [P] [US3] Implement the responsive listing grid, loading state, empty state, and card composition in `development/src/components/profile/UserProfileListings.tsx`.
- [X] T030 [P] [US3] Implement the public review list, rating display, newest-first rendering, moderated-content fallback, and empty state in `development/src/components/profile/UserProfileReviews.tsx`.
- [ ] T031 [US3] Extend the public-profile repository/service projection for optional `PublicReview[]` data without requiring the missing Review model to render the rest of the profile in `development/src/features/users/infrastructure/public-user-profile.repository.ts` and `development/src/features/users/application/public-user-profile.service.ts`.
- [X] T032 [US3] Compose `UserProfileListings` and `UserProfileReviews` into `development/src/app/users/[id]/page.tsx` and preserve the existing public route structure.
- [X] T033 [US3] Add responsive grid, card, review, rating, image-placeholder, and empty-state styles in `development/src/styles/globals.css`.

**Checkpoint**: US3 completes the public profile discovery experience with listings and reviews.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete public profile against security, accessibility, performance, and the documented quickstart.

- [ ] T034 [P] Add full-page accessibility coverage for headings, landmarks, buttons, alt text, focus order, and map fallback in `development/tests/e2e/user-profile/public-profile-accessibility.spec.ts`.
- [ ] T035 [P] Add privacy regression assertions that public responses never contain email, phone, credentials, sessions, KYC, security events, exact address, or raw private metadata in `development/tests/integration/user-profile/public-profile-privacy.integration.test.ts`.
- [X] T036 Run `npx tsc --noEmit` and resolve all type errors introduced by the public profile components and DTOs from `/Users/hugoolmo63/Documents/projects/Toolyo/development`.
- [X] T037 Run `npm test -- --reporter=dot` and resolve all unit-test regressions from `/Users/hugoolmo63/Documents/projects/Toolyo/development`.
- [ ] T038 Run the scenarios in `specs/006-public-user-profile/quickstart.md`, including manual no-data/map-failure cases, and document any environment limitation in `specs/006-public-user-profile/quickstart.md`.
- [ ] T039 Review the final diff for compliance with `constitution/SECURITY.md`, `constitution/FRONTEND.md`, `constitution/DATABASE.md`, and `constitution/TESTING.md` before implementation handoff.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T002–T004 can run in parallel after the folders are created.
- **Foundational (Phase 2)**: Depends on T001; T007–T008 can run in parallel with repository/service work, while T009–T010 depend on T005–T006.
- **User Story 1 (Phase 3)**: Depends on T005–T010 because the header consumes the secure public DTO; T014 and T015 can run in parallel after the DTO contract exists, then T016 composes them.
- **User Story 2 (Phase 4)**: Depends on T006 and the existing Leaflet loading pattern; T018–T019 can run in parallel with T021–T022.
- **User Story 3 (Phase 5)**: Depends on T005–T006; T025–T026 and T028–T030 can run in parallel, then T031–T032 integrate the projection and route.
- **Polish (Phase 6)**: Depends on completion of all desired stories; T034–T035 can run in parallel, then T036–T039 run as validation/handoff tasks.

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational; it is the recommended MVP and has no dependency on US2 or US3.
- **US2 (P1)**: Depends only on Foundational plus the existing Leaflet integration; it can be delivered independently of listings/reviews.
- **US3 (P1)**: Depends only on the public profile DTO and listing/review projections from Foundational; it can be delivered independently of the map.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001.
- T007 and T008 can run in parallel with T005–T006 when their interfaces are stable.
- In US1, T011, T012, T014, and T015 are parallelizable across separate files.
- In US2, T018, T019, T020, T021, and T022 can be split between test/UI owners once the coordinate contract is fixed.
- In US3, T025, T026, T028, T029, and T030 can run in parallel across separate component/test files.
- T034 and T035 are independent final validation suites.

---

## Parallel Example: User Story 1

```bash
# After Foundational is complete, run these independently:
Task: "Implement development/src/components/profile/UserProfileBadges.tsx and its unit test"
Task: "Implement development/src/components/profile/UserProfileHeader.tsx and its unit test"
Task: "Implement development/tests/integration/user-profile/public-profile-route.integration.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Implement coordinate tests in development/tests/unit/user-profile/preferred-location.test.ts"
Task: "Implement map component in development/src/components/profile/UserProfileLocationMap.tsx"
Task: "Implement map accessibility E2E in development/tests/e2e/user-profile/location.spec.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Implement ListingCard and its tests in development/src/components/profile/ListingCard.tsx"
Task: "Implement UserProfileListings in development/src/components/profile/UserProfileListings.tsx"
Task: "Implement UserProfileReviews in development/src/components/profile/UserProfileReviews.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundational, including secure DTO and tests.
3. Complete Phase 3 US1.
4. Validate `/users/[id]` with header, badges, Contactar and 404 behavior.
5. Stop for review/demo before adding map, listings and reviews.

### Incremental Delivery

1. Add US1 for the public reputation profile.
2. Add US2 for privacy-preserving geographic context.
3. Add US3 for listing discovery and reviews.
4. Run Phase 6 validation and accessibility/security review.

### Parallel Team Strategy

1. One owner completes the secure DTO/repository foundation.
2. After the foundation checkpoint:
   - Developer A: US1 header/badges/route.
   - Developer B: US2 Leaflet map/privacy behavior.
   - Developer C: US3 cards/reviews/empty states.
3. Integrate the route only after each story passes its independent test criteria.

## Notes

- Every task uses the required checkbox, sequential ID, optional `[P]`, story label where applicable, and an exact repository-relative file path.
- No new Prisma `Review` model is introduced by this task list; the feature must remain functional with an empty review projection until the reviews module exists.
- The `ListingCard` task creates the missing public component rather than importing the search-specific `ResultCard` directly.
