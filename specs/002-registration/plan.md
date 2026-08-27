# Implementation Plan: Registro y Verificación de Usuario

**Branch**: `002-registration` | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-registration/spec.md`

## Summary

Implementar el registro y onboarding inicial de Toolyo dentro de `/development`: email/contraseña, SSO configurable, verificación de email y teléfono mediante OTP, KYC opcional con minimización de datos y aceptación versionada de documentos legales. La implementación usará servicios de dominio separados de routers tRPC, schemas Zod compartidos, Prisma/PostgreSQL para estados duraderos y una UI Client Component únicamente en las partes interactivas, aplicando tokens `profesional-seguro`.

## Technical Context

**Language/Version**: TypeScript estricto sobre Next.js 14 App Router y React 18; Node.js 20+ LTS

**Primary Dependencies**: Auth.js/NextAuth para sesiones y OAuth configurable, tRPC, Zod, Prisma, PostgreSQL, React Hook Form, Tailwind CSS y Vitest; proveedor de email/SMS/KYC mediante adaptadores tipados

**Storage**: PostgreSQL/Prisma para User, credenciales, desafíos OTP, verificaciones, documentos legales, aceptaciones y auditoría; Redis compartido para rate limiting solo cuando haya despliegue multiinstancia; documentos KYC fuera de Toolyo por defecto

**Testing**: Vitest unitario, Vitest de integración contra PostgreSQL efímero/Testcontainers y Playwright para el flujo crítico de registro; axe-core para páginas del flujo

**Target Platform**: Web responsive bajo `/development`, desplegable en el entorno Next.js existente

**Project Type**: Aplicación web full-stack con frontend Next.js, API tRPC y persistencia PostgreSQL

**Performance Goals**: Feedback local inmediato; lecturas normales con p95 inferior a 1 s en entorno objetivo; registro y verificación no deben bloquearse por trabajo de proveedor externo; OTP y estados deben ser operaciones atómicas

**Constraints**: No almacenar contraseñas ni OTP en claro; no guardar documentos KYC salvo obligación legal; no enumerar cuentas; límites por IP/cuenta/contacto; secretos fuera del repositorio; tokens visuales sin hexadecimales en componentes; accesibilidad WCAG AA y foco visible

**Scale/Scope**: Una feature de onboarding web; cuatro historias, tres canales de verificación (email, teléfono, identidad), tres proveedores SSO configurables y siete entidades nuevas o ampliadas sin implementar reservas/pagos

## Constitution Check

**Gate 1 - Seguridad**: PASS. Contraseñas hasheadas, sesiones seguras, OTP hasheado y de un solo uso, rate limiting, no enumeración y secretos fuera del código.

**Gate 2 - Datos**: PASS. PII clasificada, timestamps con zona, auditoría, soft delete donde aplique y minimización KYC.

**Gate 3 - Frontend**: PASS. Server-first, Client Components solo para interacción, Zod compartido, React Hook Form, tokens de `DESIGN.md`, foco, labels y responsive.

**Gate 4 - Testing**: PASS. Unitarios para lógica pura, integración con PostgreSQL real y E2E solo para el flujo crítico. No se exige cubrir detalles de frameworks.

La constitución no contiene una política distinta en `.specify/memory/constitution.md`; las reglas aplicables se han tomado de `constitution/`.

## Project Structure

### Documentation (this feature)

```text
specs/002-registration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
development/
├── prisma/
│   ├── schema.prisma
│   └── migrations/<timestamp>_registration/
├── src/
│   ├── app/
│   │   ├── (auth)/register/page.tsx
│   │   ├── (auth)/verify/page.tsx
│   │   └── (auth)/kyc/page.tsx
│   ├── components/
│   │   ├── forms/registration-form.tsx
│   │   ├── forms/otp-verification-form.tsx
│   │   └── forms/kyc-status-card.tsx
│   ├── server/
│   │   ├── api/routers/auth.router.ts
│   │   ├── auth/auth.service.ts
│   │   ├── auth/otp.service.ts
│   │   ├── auth/kyc.service.ts
│   │   ├── auth/legal-acceptance.service.ts
│   │   ├── services/security-event.service.ts
│   │   └── integrations/{email,sms,kyc}/
│   ├── lib/validations/auth.ts
│   ├── lib/auth.ts
│   └── types/auth.ts
└── tests/
    ├── unit/auth/
    ├── integration/auth/
    └── e2e/auth/
```

**Structure Decision**: Extender `/development` como aplicación canónica. Las páginas de lectura y layout permanecen Server Components; formularios OTP/KYC y botones SSO son Client Components finos. Los routers tRPC validan y delegan en servicios de `src/server/auth/`; las integraciones externas viven en adaptadores. Prisma mantiene el estado duradero y el scaffold `Category` no se modifica salvo para compartir infraestructura existente.

## Phase 0: Research Summary

La investigación está consolidada en [research.md](research.md). Las decisiones principales son: Auth.js para sesión/OAuth, servicio propio para contraseña/OTP/onboarding, PostgreSQL como fuente de verdad, proveedor KYC custodio por defecto, Google como primer SSO habilitable y Apple/Facebook configurables tras revisión.

## Phase 1: Design Summary

- [data-model.md](data-model.md) define entidades, estados, índices, constraints y límites de datos sensibles.
- [contracts/auth-registration.md](contracts/auth-registration.md) define procedimientos tRPC, adaptadores externos, estados y payloads sin secretos.
- [quickstart.md](quickstart.md) define setup de base de datos, pruebas unitarias/integración/E2E y revisión manual de la UI.

## Implementation Sequence

1. Validar configuración de entorno y dependencias del scaffold sin añadir proveedores reales todavía.
2. Añadir schema Prisma y migración para usuario, credencial, cuenta externa, verificaciones, OTP, KYC, documentos, aceptaciones y eventos de seguridad.
3. Crear schemas Zod, tipos de estado y servicios puros para normalización, OTP, capacidades y errores seguros.
4. Integrar registro email/contraseña, sesión segura y SSO detrás de configuración de proveedor.
5. Integrar OTP email/SMS con adaptadores, rate limiting, consumo atómico, reintentos e idempotencia.
6. Añadir consentimientos versionados y UI `profesional-seguro` con errores accesibles.
7. Añadir contrato KYC, callback/webhook firmado e idempotente y bloqueo de capacidades hasta aprobación.
8. Cubrir unitarios, integración y E2E; revisar logs para garantizar que no contienen secretos.

## Constitution Check (Post-Design)

**Resultado: PASS.** El diseño conserva la fuente de verdad en PostgreSQL, evita una segunda estrategia de sesión, centraliza autorización y redacción de logs, mantiene documentos KYC fuera del almacenamiento propio por defecto, usa tokens oficiales y asigna cada tipo de test a su nivel adecuado. Apple/Facebook, KYC real y rate limiting Redis quedan configurables o condicionados a proveedor/entorno, no como dependencias ficticias.

## Complexity Tracking

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Separar `OtpChallenge` de `VerificationState` | Permite rotación, consumo atómico y auditoría sin mezclar secreto temporal con estado de cuenta | Un booleano `isVerified` no soporta expiración, reintentos ni dos canales |
| Adaptadores para email/SMS/KYC | Aísla proveedores y permite probar servicios sin red | Llamadas directas desde routers mezclarían transporte, dominio y seguridad |
| Cuenta externa separada de User | Evita vincular SSO por email sin prueba de control | Guardar solo el email del proveedor no permite identidad externa única ni unlink seguro |
