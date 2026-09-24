# Research: Módulo Administrativo (Backoffice)

**Feature**: [spec.md](./spec.md)  
**Fecha**: 2026-09-24

## Decision 1: TOTP RFC 6238 con `otplib`

- **Decision**: Usar `otplib` como adaptador de servidor para generar secretos, validar códigos TOTP RFC 6238 y construir la URI `otpauth://`, con periodo de 30 segundos, seis dígitos y ventana mínima documentada.
- **Rationale**: Encaja en Node/TypeScript y mantiene la lógica criptográfica fuera del dominio. El servidor conserva la autoridad de validación y no depende de Google Authenticator o Authy como proveedor.
- **Alternatives considered**: Implementar HMAC/TOTP internamente (riesgo criptográfico y mantenimiento); proveedor MFA externo (dependencia y coste fuera del MVP).
- **Constraint**: El secreto nunca se devuelve después de activar, ni aparece en sesión/JWT/logs; se cifra antes de persistir y el reset exige reautenticación.

## Decision 2: QR con `qrcode`

- **Decision**: Usar `qrcode` en servidor para producir un QR desde la URI `otpauth://`; el QR/challenge es temporal y se invalida al completar, cancelar o expirar.
- **Rationale**: Funciona con las aplicaciones compatibles indicadas y evita enviar secretos a un servicio remoto.
- **Alternatives considered**: QR en navegador (mayor superficie y ciclo de vida más complejo); servicio remoto (no enviar secretos MFA fuera del sistema).

## Decision 3: Middleware de auditoría tRPC

- **Decision**: Crear middleware/helper de procedimiento administrativo que reciba una acción canónica, ejecute el resolver y persista `AdminAuditLog` con `success`, `denied`, `validation_error` o `failure`.
- **Rationale**: Cubre uniformemente los procedimientos y evita olvidos; el servicio mantiene autorización por recurso y consistencia de dominio.
- **Alternatives considered**: Logging manual (omisiones); middleware global tRPC (mezcla superficies); trigger DB como única solución (desconoce actor/request/procedimiento).

## Decision 4: Reutilizar entidades KYC y reviews

- **Decision**: Gestionar KYC sobre `IdentityVerification` y reviews sobre `Review`/`ReviewReport`, añadiendo solo campos administrativos necesarios.
- **Rationale**: Ya existen estados, proveedor KYC, reportes y moderación; se evita una segunda fuente de verdad.
- **Alternatives considered**: Crear `KycRequest` y `AdminReviewCase` duplicados; descartado por sincronización y migraciones innecesarias.

## Decision 5: Roles `ADMIN` y `MODERATOR`

- **Decision**: Evolucionar el enum actual `UserRole` (`user`, `admin`) con los roles administrativos confirmados y mapear el valor legacy `admin` durante la migración.
- **Rationale**: Sesión, middleware y tRPC necesitan una única fuente de autorización.
- **Alternatives considered**: Tabla paralela de permisos o JSON dinámico; descartados por duplicación, falta de constraints y auditoría más difícil.

## Decision 6: Secretos y datos restringidos

- **Decision**: Cifrar secreto TOTP y documentos KYC mediante el mecanismo de secretos del entorno; usar selects explícitos y excluirlos de DTOs, auditoría y logs.
- **Rationale**: Cumple mínimo privilegio y la clasificación `Restringido` de la constitución.
- **Alternatives considered**: Clave hardcodeada/variable plana (incumple seguridad); hash del TOTP (impide validarlo).

## Decision 7: Límites y pruebas

- **Decision**: Rate limiting específico para setup/verificación TOTP y operaciones administrativas; Vitest para lógica, PostgreSQL/Testcontainers para routers y Playwright para journeys críticos.
- **Rationale**: Reduce abuso de MFA y sigue la pirámide de testing del proyecto.
- **Alternatives considered**: Solo E2E o rate limiting únicamente en UI; ambos dejan huecos en API y feedback lento.