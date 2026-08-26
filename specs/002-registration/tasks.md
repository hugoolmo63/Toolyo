---

description: "Task list for Toolyo user registration and verification"
---

# Tasks: Registro y Verificación de Usuario

**Input**: Design documents from `specs/002-registration/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/auth-registration.md](contracts/auth-registration.md), [quickstart.md](quickstart.md)

**Organization**: Las tareas siguen las capas del plan y están etiquetadas por historia de usuario cuando implementan una entrega funcional.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar el proyecto `/development` y sus dependencias sin configurar proveedores reales ni secretos.

- [X] T001 Confirmar en `development/package.json` las versiones compatibles de Next.js, TypeScript, tRPC, Zod, Prisma, React Hook Form y Vitest para la feature de autenticación.
- [X] T002 [P] Añadir en `development/.env.example` las variables documentadas para Auth.js, base de datos, email, SMS, rate limiting y KYC sin valores secretos.
- [X] T003 [P] Configurar en `development/src/env.mjs` la validación de variables obligatorias y opcionales por entorno, rechazando arranque si falta una variable crítica.
- [X] T004 [P] Documentar en `development/README.md` el setup local, proveedores deshabilitados por defecto y límites de seguridad de la feature.

---

## Phase 2: Foundational - Modelo de datos y migraciones

**Purpose**: Crear la fuente de verdad PostgreSQL para cuenta, verificaciones, consentimientos y auditoría.

**Critical**: Completar antes de implementar servicios o UI.

- [X] T005 Diseñar en `development/prisma/schema.prisma` los modelos `User`, `PasswordCredential` y `OAuthAccount` con IDs no enumerables, timestamps con zona, soft delete y constraints de unicidad.
- [X] T006 [P] Definir en `development/prisma/schema.prisma` los modelos `VerificationState` y `OtpChallenge` con canales, propósitos, hashes, expiración, intentos, reenvíos y estados consumido/bloqueado.
- [X] T007 [P] Definir en `development/prisma/schema.prisma` los modelos `IdentityVerification`, `LegalDocument`, `LegalAcceptance` y `SecurityEvent` con PII minimizada y campos auditables.
- [X] T008 Revisar en `development/prisma/schema.prisma` relaciones, `onDelete`, índices por email/canal/propósito/expiración y constraint de una fila por usuario/canal.
- [X] T009 Generar la migración `development/prisma/migrations/<timestamp>_registration/migration.sql` y revisar el SQL para confirmar que no modifica ni elimina el modelo `Category` existente.
- [X] T010 [P] Crear en `development/prisma/seed.ts` documentos legales de prueba y fixtures de usuario sin datos personales reales, manteniendo el seed idempotente.
- [ ] T011 [P] Crear en `development/tests/integration/auth/database.integration.test.ts` pruebas de unicidad de email, OAuth, estados por canal, aceptaciones históricas y constraints de OTP.
- [ ] T012 Ejecutar `development/npm run db:generate`, las migraciones y `development/npm run test:integration -- --run development/tests/integration/auth/database.integration.test.ts` desde `/development` y corregir el esquema hasta que pase.

**Checkpoint**: PostgreSQL contiene el modelo de registro sin secretos, con migración revisada y pruebas de constraints funcionando.

---

## Phase 3: User Story 1 - Crear una cuenta (Priority: P1)

**Goal**: Permitir registro por email/contraseña y SSO configurable sin enumerar cuentas ni crear sesiones inseguras.

**Independent Test**: Un visitante puede completar registro con documentos vigentes, recibe estado pendiente de verificaciones y el camino SSO válido crea o recupera una sesión sin exponer secretos.

### Tests for User Story 1

- [X] T013 [P] [US1] Crear en `development/tests/unit/auth/registration.validation.test.ts` pruebas de email normalizado, contraseña mínima, documentos obligatorios, marketing opcional y errores genéricos.
- [ ] T014 [P] [US1] Crear en `development/tests/integration/auth/registration.service.integration.test.ts` pruebas de transacción User + PasswordCredential + VerificationState + LegalAcceptance y conflicto concurrente de email.

### Implementation for User Story 1

- [X] T015 [US1] Crear `development/src/lib/validations/auth.ts` con schemas Zod compartidos para registro, SSO, documentos legales y estados de error públicos.
- [X] T016 [US1] Crear `development/src/types/auth.ts` con unions de estados de cuenta, verificación, proveedores SSO, propósitos OTP y capacidades.
- [X] T017 [US1] Crear `development/src/server/auth/auth.service.ts` para normalizar email, validar documentos vigentes, hashear contraseña con Argon2id o fallback aprobado y crear la cuenta en una transacción.
- [X] T018 [US1] Crear `development/src/server/auth/legal-acceptance.service.ts` para validar versiones vigentes y registrar aceptaciones obligatorias separadas de marketing.
- [X] T019 [US1] Crear `development/src/server/auth/session.service.ts` y `development/src/lib/auth.ts` para una única estrategia de sesión segura, cookies HttpOnly/Secure/SameSite y revocación tras eventos sensibles.
- [X] T020 [US1] Crear `development/src/server/integrations/oauth/oauth-provider.ts` como interfaz tipada para validar state, nonce, PKCE, issuer, audience, firma y expiración sin exponer tokens.
- [X] T021 [P] [US1] Crear adaptador inicial habilitable en `development/src/server/integrations/oauth/google.provider.ts` y dejar Apple/Facebook detrás de configuración explícita en `development/src/server/integrations/oauth/providers.ts`.
- [X] T022 [US1] Crear `development/src/server/api/routers/auth.router.ts` con `registerWithPassword`, `startSso`, `completeSso` y `getOnboardingStatus`, usando procedimientos y errores definidos en el contrato.
- [ ] T023 [US1] Añadir en `development/tests/integration/auth/auth.router.integration.test.ts` pruebas de registro, no enumeración, documentos faltantes, callback SSO inválido y ausencia de hashes/tokens en respuestas.

**Checkpoint**: US1 permite crear cuenta de forma segura por password y tiene el contrato SSO preparado sin vinculación automática por email.

---

## Phase 4: Foundational - Adaptadores de servicios externos

**Purpose**: Aislar email, SMS y KYC para que los servicios de dominio puedan probarse sin red ni credenciales reales.

- [X] T024 [P] Crear `development/src/server/integrations/email/email.provider.ts` con interfaz, timeout, resultado tipado y plantilla de verificación sin registrar OTP.
- [X] T025 [P] Crear `development/src/server/integrations/sms/sms.provider.ts` con interfaz para destino E.164, timeout, referencia de proveedor y control de coste/reenvíos.
- [X] T026 [P] Crear `development/src/server/integrations/kyc/kyc.provider.ts` con interfaz para crear sesión, verificar webhook y devolver estados sin custodiar DNI/selfie en Toolyo.
- [ ] T027 [P] Crear `development/src/server/integrations/email/email.provider.test.ts` y `development/src/server/integrations/sms/sms.provider.test.ts` con dobles deterministas para éxito, timeout y fallo sin incluir códigos en logs.
- [ ] T028 Crear `development/src/server/integrations/kyc/kyc.provider.test.ts` con pruebas de firma inválida, evento duplicado, transición fuera de orden y resultado minimizado.

**Checkpoint**: Los adaptadores tienen contratos aislados, errores tipados y dobles de prueba; ningún proveedor real es requisito para ejecutar unitarios.

---

## Phase 5: User Story 2 - Verificar email y teléfono (Priority: P1)

**Goal**: Emitir, enviar y consumir OTP de email/SMS con seguridad, límites e idempotencia.

**Independent Test**: Un usuario puede verificar email y teléfono con códigos válidos; códigos inválidos, expirados, usados o abusivos no cambian estados ni revelan secretos.

### Tests for User Story 2

- [X] T029 [P] [US2] Crear en `development/tests/unit/auth/otp.service.test.ts` pruebas de generación criptográfica, hash/HMAC, expiración, máximo de intentos, reenvío e invalidación del desafío anterior.
- [X] T030 [P] [US2] Crear en `development/tests/unit/auth/normalization.test.ts` pruebas de normalización de email y teléfono E.164, sin transformaciones específicas de proveedores.
- [ ] T031 [P] [US2] Crear en `development/tests/integration/auth/otp.service.integration.test.ts` pruebas de consumo atómico, OTP usado/expirado/bloqueado y concurrencia de dos verificaciones.

### Implementation for User Story 2

- [X] T032 [US2] Crear `development/src/server/auth/otp.service.ts` para generar OTP, guardar solo hash/HMAC, aplicar expiración de 10 minutos y máximo centralizado de 5 intentos.
- [X] T033 [US2] Crear `development/src/server/auth/rate-limit.service.ts` con límites por IP, usuario, destino y desafío; usar configuración centralizada y Redis solo cuando el despliegue sea multiinstancia.
- [X] T034 [US2] Implementar en `development/src/server/auth/otp.service.ts` consumo atómico que actualice `OtpChallenge` y `VerificationState` en una transacción sin devolver el código.
- [X] T035 [US2] Integrar `EmailProvider` y `SmsProvider` en `development/src/server/auth/otp-delivery.service.ts`, enviando después de confirmar persistencia y manejando timeout/reintento sin duplicación ilimitada.
- [X] T036 [US2] Añadir `requestOtp` y `verifyOtp` al router `development/src/server/api/routers/auth.router.ts` con errores públicos `challenge_invalid`, `challenge_expired`, `challenge_blocked` y `provider_unavailable`.
- [ ] T037 [US2] Añadir en `development/src/server/services/security-event.service.ts` redacción de metadatos y eventos de OTP/rate limit sin contraseña, código, token, destino completo ni documentos.
- [ ] T038 [US2] Completar en `development/tests/integration/auth/auth.router.integration.test.ts` escenarios de email OTP, SMS OTP, límites y respuestas genéricas de cuenta existente.

**Checkpoint**: US2 verifica ambos canales con consumo atómico, rate limiting, proveedores sustituibles y auditoría segura.

---

## Phase 6: User Story 3 - Solicitar verificación de identidad (Priority: P2)

**Goal**: Preparar KYC opcional y seguro, bloqueando capacidades avanzadas hasta aprobación.

**Independent Test**: Un usuario con email/teléfono verificados puede iniciar o reintentar KYC, consultar estados y nunca recibe badge/capacidad avanzada antes de `verified`.

### Tests for User Story 3

- [ ] T039 [P] [US3] Crear en `development/tests/unit/auth/capabilities.test.ts` pruebas de capacidades para estados básicos, identidad pendiente, aprobada, rechazada y cuenta suspendida.
- [ ] T040 [P] [US3] Crear en `development/tests/integration/auth/kyc.integration.test.ts` pruebas de precondiciones, webhook firmado, idempotencia y transiciones válidas de identidad.

### Implementation for User Story 3

- [X] T041 [US3] Crear `development/src/server/auth/capabilities.service.ts` para derivar permisos desde cuenta, verificaciones, rol y reglas, sin confiar en badges del cliente.
- [X] T042 [US3] Crear `development/src/server/auth/kyc.service.ts` para exigir email/teléfono verificados, aceptar términos KYC y crear una sesión externa idempotente.
- [X] T043 [US3] Crear `development/src/app/api/webhooks/kyc/route.ts` para verificar firma, persistir evento único, rechazar transiciones inválidas y actualizar identidad en transacción.
- [ ] T044 [US3] Añadir `startIdentityVerification` y `getOnboardingStatus` al router `development/src/server/api/routers/auth.router.ts`, exponiendo solo estado, referencia necesaria y capacidades resumidas.
- [ ] T045 [US3] Añadir en `development/src/server/services/security-event.service.ts` auditoría de inicio, aprobación, rechazo y reintento KYC con códigos generales y sin PII restringida.

**Checkpoint**: US3 mantiene KYC opcional, minimiza datos y bloquea de forma centralizada seguro, badge y reserva instantánea hasta aprobación.

---

## Phase 7: User Story 4 - Aceptar documentos legales (Priority: P1)

**Goal**: Integrar una experiencia de consentimiento clara, versionada y separada de marketing.

**Independent Test**: El registro se bloquea sin Términos y Privacidad, permite leer ambos sin perder progreso y conserva evidencia versionada de cada aceptación.

### Implementation for User Story 4

- [ ] T046 [US4] Crear `development/src/app/(auth)/register/page.tsx` como Server Component que cargue documentos vigentes y componga el formulario cliente.
- [X] T047 [US4] Crear `development/src/components/forms/registration-form.tsx` como Client Component con React Hook Form, Zod, labels explícitos, consentimientos obligatorios separados y marketing opcional.
- [X] T049 [US4] Aplicar en `development/src/styles/globals.css` tokens `--ps-*` del tema `profesional-seguro`, estados de foco, error/éxito, responsive y contraste WCAG AA sin colores hardcodeados en componentes.
- [X] T050 [US4] Añadir en `development/src/app/(auth)/legal/[documentType]/page.tsx` lectura de documentos versionados con navegación de retorno que conserve progreso no sensible.
- [ ] T051 [US4] Añadir en `development/tests/unit/auth/registration-form.test.tsx` pruebas de schema, consentimiento faltante, marketing no inferido y mensajes accesibles.

**Checkpoint**: US4 ofrece registro accesible y legalmente trazable, integrado visualmente con `profesional-seguro`.

---

## Phase 8: User Story 2/3 - Pantallas de verificación y KYC

**Purpose**: Completar las superficies de onboarding necesarias para que US2 y US3 sean utilizables desde la aplicación.

- [X] T052 [US2] Crear `development/src/app/(auth)/verify/page.tsx` como Server Component para cargar estado de onboarding y renderizar formularios de OTP.
- [X] T054 [US3] Crear `development/src/app/(auth)/kyc/page.tsx` como Server Component para mostrar estados KYC y explicación de finalidad, derechos, proveedor y retención.
- [ ] T056 [P] [US2] Añadir en `development/tests/unit/auth/otp-verification-form.test.tsx` pruebas de accesibilidad, estados de código y recuperación tras error.
- [ ] T057 [P] [US3] Añadir en `development/tests/unit/auth/kyc-status-card.test.tsx` pruebas de bloqueo de capacidades y mensajes no cromáticos por estado.

**Checkpoint**: Las historias de OTP y KYC tienen pantallas navegables y mantienen el estado de servidor como fuente de verdad.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validar seguridad, accesibilidad, integración y documentación antes del PR.

- [ ] T058 [P] Crear `development/tests/e2e/auth/registration.spec.ts` con Playwright para registro, consentimientos obligatorios, estados de OTP y flujo SSO simulado.
- [ ] T059 [P] Crear `development/tests/e2e/auth/kyc.spec.ts` con Playwright para KYC pendiente/rechazado/aprobado y capacidades bloqueadas.
- [ ] T060 [P] Configurar en `development/tests/e2e/auth/accessibility.spec.ts` axe-core para registro, verificación y KYC, incluyendo foco, labels, live regions y contraste estructural.
- [ ] T061 Ejecutar en `/development` `npm test` y `npm run test:integration`, cubriendo `development/tests/unit/`, `development/tests/integration/` y comprobando que `development/prisma/schema.prisma` mantiene `Category` funcionando.
- [X] T062 Ejecutar `npx tsc --noEmit` y lint sobre `development/`, corrigiendo tipos, imports y reglas de Server/Client Components.
- [ ] T063 Revisar `development/src/server` y tests buscando OTP, contraseñas, tokens, documentos KYC o PII completa en logs, fixtures y respuestas.
- [X] T064 Actualizar `development/README.md` y `specs/002-registration/quickstart.md` con variables, proveedores habilitados, comandos, límites y criterios de rollback.
- [ ] T065 Verificar manualmente el flujo en móvil y desktop y registrar en `specs/002-registration/quickstart.md` resultados, riesgos legales pendientes y dependencias externas.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Sin dependencias; prepara configuración.
- **Phase 2 Modelo/migraciones**: Depende de Setup y bloquea servicios.
- **Phase 3 US1 API de cuenta**: Depende del modelo; crea registro y sesión.
- **Phase 4 Adaptadores**: Puede avanzar tras Setup, pero debe completarse antes de OTP/KYC.
- **Phase 5 US2 OTP**: Depende del modelo, adaptadores email/SMS y tipos Zod.
- **Phase 6 US3 KYC**: Depende del modelo, adaptador KYC y capacidades.
- **Phase 7 US4 UI de registro/legal**: Depende de contrato API y documentos legales.
- **Phase 8 UI OTP/KYC**: Depende de los servicios y routers de Phase 5/6.
- **Phase 9 Polish**: Depende de todas las historias incluidas en la entrega.

### User Story Dependencies

- **US1 (P1)**: Tras Phase 2; es el núcleo mínimo de cuenta.
- **US2 (P1)**: Tras Phase 2 y Phase 4; puede desarrollarse en paralelo con la UI de US1 si no se modifican los mismos archivos simultáneamente.
- **US3 (P2)**: Tras Phase 2 y Phase 4; depende de estados básicos verificados, pero conserva valor independiente como flujo opcional.
- **US4 (P1)**: Su servicio legal se construye en US1; su UI depende del contrato de registro y puede avanzar en paralelo con adaptadores.

### Parallel Opportunities

- T002, T003 y T004 pueden ejecutarse en paralelo.
- T006, T007 y T010 pueden ejecutarse en paralelo antes de T008.
- T013/T014 y T015/T016 pueden prepararse en paralelo antes de integrar T017.
- T024-T027 pueden ejecutarse en paralelo porque son adaptadores y dobles separados.
- T029-T031 y T032/T033 pueden avanzar en paralelo antes de T034.
- T039/T040 y T041/T042 pueden avanzar en paralelo por tratarse de unitarios y dominio KYC.
- T051, T056 y T057 pueden ejecutarse en paralelo en archivos de test distintos.
- T058-T060 pueden ejecutarse en paralelo tras estabilizar las pantallas.

## Parallel Example: Foundation

```text
Task: "Definir VerificationState y OtpChallenge en development/prisma/schema.prisma"
Task: "Definir IdentityVerification, LegalDocument, LegalAcceptance y SecurityEvent en development/prisma/schema.prisma"
Task: "Crear seed legal y fixtures seguros en development/prisma/seed.ts"
```

## Parallel Example: User Story 2

```text
Task: "Crear pruebas unitarias OTP en development/tests/unit/auth/otp.service.test.ts"
Task: "Crear pruebas unitarias de normalización en development/tests/unit/auth/normalization.test.ts"
Task: "Crear adaptador email en development/src/server/integrations/email/email.provider.ts"
Task: "Crear adaptador SMS en development/src/server/integrations/sms/sms.provider.ts"
```

## Implementation Strategy

### MVP First

1. Completar Phase 1 y Phase 2.
2. Completar US1: cuenta, sesión y consentimientos básicos.
3. Completar US2: verificación email y teléfono, porque es requisito P1 y base de confianza.
4. Validar con unitarios, integración y E2E antes de habilitar proveedores reales.
5. Mantener KYC real y Apple/Facebook deshabilitados hasta completar revisión legal y configuración.

### Incremental Delivery

1. Entregar registro email/contraseña + documentos legales.
2. Añadir email OTP y SMS OTP con adaptadores sustituibles.
3. Habilitar Google SSO en entorno controlado y después evaluar Apple/Facebook.
4. Añadir contrato/UI KYC y proveedor aprobado sin guardar documentos propios.
5. Completar E2E, axe, auditoría de logs y documentación de operación.

## Notes

- Todas las tareas incluyen checkbox, ID, etiquetas de historia cuando aplican y rutas concretas.
- Las tareas de test se incluyen porque el encargo exige pruebas unitarias e integración; deben escribirse antes de la implementación de su unidad cuando sea viable.
- No se incluyen pagos, reservas, seguros ni listings: son dependencias de producto posteriores.
- No instalar Redis, proveedores de KYC ni SDK SSO reales hasta que la configuración y revisión legal estén aprobadas.
