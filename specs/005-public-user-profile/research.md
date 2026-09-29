# Research: Módulo de Perfil de Usuario

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-16

## Modelo y persistencia

**Decisión**: Reutilizar los campos de `User` ya presentes (`avatarUrl`, `displayName`, `bio`, `ratingAverage`, `transactionCount`, `responseTimeHours`) y añadir únicamente `preferredLocation String? @db.VarChar(160)` mediante migración Prisma nullable.

**Rationale**: Evita duplicar datos existentes y permite desplegar la migración sin romper usuarios creados previamente. La ubicación es el único dato solicitado que no aparece en el schema actual.

**Alternativas consideradas**:

- Crear una entidad `UserProfile` separada: descartado porque el perfil es 1:1 y los campos públicos ya viven en `User`.
- Guardar la ubicación en JSON: descartado por falta de contrato, validación y evolución tipada.

## API y autorización

**Decisión**: Exponer una lectura pública separada de una acción/router protegido para actualización. La autorización debe obtener el sujeto desde la sesión en el contexto del servidor y aplicar la misma comprobación en middleware y capa de aplicación.

**Rationale**: Mantiene el perfil público mínimo y evita confiar en un `userId` enviado por el cliente. Es coherente con Next.js App Router, tRPC y el middleware existente para `/profile`.

**Alternativas consideradas**:

- Permitir `userId` en la mutación como autoridad: descartado por riesgo de IDOR.
- Proteger solo con middleware: descartado porque las acciones/API también deben ser seguras si se invocan fuera de la navegación web.

## Badges y datos derivados

**Decisión**: Calcular los badges desde estados/capacidades del servidor: verificación vigente para **Verificado** y `responseTimeHours` junto al umbral de negocio para **Respuesta rápida**.

**Rationale**: Los badges representan confianza y no pueden ser concedidos por un payload del cliente ni quedar desincronizados de la verificación real.

**Alternativas consideradas**:

- Persistir `isVerified`/`isFastResponder` en `User`: descartado porque duplica fuentes de verdad y facilita estados obsoletos.

## Testing

**Decisión**: Vitest para lógica y servicios, integración con PostgreSQL/Testcontainers para Prisma y autorización, y Playwright/axe cuando el flujo UI esté disponible.

**Rationale**: Coincide con las herramientas y la pirámide definida por el repositorio; la autorización y exclusión de campos privados requieren una prueba de integración real.

**Alternativas consideradas**: Mockear Prisma en toda la suite de integración, descartado porque no valida constraints ni persistencia real.