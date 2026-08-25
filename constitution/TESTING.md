# Constitución de Testing — Toolyo

> **Versión:** 1.0  
> **Alcance:** Frontend, Backend y flujos integrales.  
> **Base:** Stack definido en `docs/03-arquitectura-y-tech-stack.md` (Vitest, Playwright, tRPC, Prisma, PostgreSQL).

---

## 1. Principios Rectores

1. **Confianza, no cobertura.** Un test que no falla cuando el código está roto es peor que no tener test.
2. **Pirámide respetada.** Muchos tests unitarios (rápidos, aislados), varios de integración (DB + API) y pocos E2E (flujos críticos).
3. **Determinismo.** Un test debe producir el mismo resultado en cada ejecución. No depende del orden ni de la hora actual.
4. **Coste explícito.** Cada test tiene un coste de mantenimiento. Si un test es más complejo que el código que prueba, reconsiderar su existencia.

---

## 2. Pirámide de Testing

```
       /\
      /  \   E2E (Playwright) — Flujos críticos de usuario
     /----\
    /      \  Integración — Routers tRPC + DB real
   /--------\
  /          \ Unitarios — Servicios, utils, validaciones Zod
 /------------\
```

| Nivel | Herramienta | Qué testear | Tiempo objetivo |
|-------|-------------|-------------|-----------------|
| **Unitario** | Vitest | Funciones puras, helpers, lógica de negocio, mappers, Zod schemas | < 100 ms por test |
| **Integración** | Vitest + @testcontainers/postgres | Routers tRPC con DB real, servicios con Prisma, validación de contratos | < 2 s por suite |
| **E2E** | Playwright | Flujos críticos: registro → publicación → reserva → pago | < 60 s por spec |

---

## 3. Tests Unitarios

### 3.1 Qué testear

- Funciones de utilidad pura (`formatCurrency`, `calculateTotalPrice`, `dateRangesOverlap`).
- Lógica de dominio en servicios desacoplados.
- Validaciones Zod: casos válidos, inválidos y edge cases (vacíos, null, overflows).

### 3.2 Qué NO testear

- Frameworks (no testear que React renderiza o que Prisma hace un `findMany`).
- Tipos de TypeScript (eso es trabajo del compilador).
- Trivialidades (`a + b`).

### 3.3 Mocks

- Mock solo en el límite del sistema: APIs externas, reloj (`Date.now`), random (`Math.random`), y librerías de infraestructura.
- No mockear la base de datos en tests de integración; sí en unitarios puros.

### 3.4 Estructura recomendada

```ts
import { describe, it, expect } from 'vitest';

describe('calculateTotalPrice', () => {
  it('applies daily rate and platform fee', () => {
    const result = calculateTotalPrice({ dailyRate: 100, days: 3, platformFeePercent: 10 });
    expect(result).toEqual({ total: 300, platformFee: 30, ownerPayout: 270 });
  });

  it('throws if days is zero or negative', () => {
    expect(() => calculateTotalPrice({ dailyRate: 100, days: 0, platformFeePercent: 10 }))
      .toThrow(ValidationError);
  });
});
```

---

## 4. Tests de Integración

### 4.1 Setup de base de datos

- Usar Testcontainers (PostgreSQL) o una base de datos efímera por CI job.
- Aplicar migraciones de Prisma antes de cada suite o una vez por job.
- Usar transacciones por test + rollback para aislamiento, o truncar tablas en `afterEach`.

### 4.2 Qué testear

- Routers tRPC: input validado, autorización aplicada, respuesta correcta, side effects en DB.
- Servicios que tocan Prisma: crear un registro y leerlo, verificar constraints.
- Webhooks: verificar firma + efecto en estado de la aplicación.

### 4.3 Factory pattern

- Crear factories para entidades (ej. `createUser()`, `createListing()`) que inserten datos mínimos válidos y permitan overrides.
- No compartir estado mutable entre tests.

### 4.4 Ejemplo

```ts
const caller = appRouter.createCaller({ session: mockSession, prisma: testPrisma });

it('creates a booking when listing is available', async () => {
  const listing = await createListing({ ownerId: 'user-1' });
  const result = await caller.booking.create({ listingId: listing.id, startDate: '2025-06-01', endDate: '2025-06-05' });
  expect(result.status).toBe('pending');
});
```

---

## 5. Tests E2E (Playwright)

### 5.1 Alcance

- Cubrir solo los **flujos críticos de negocio** que, si se rompen, impiden operar:
  - Búsqueda con filtros → detalle de listing.
  - Registro / login.
  - Creación de listing con imágenes.
  - Flujo de reserva y pago (modo test de Stripe).
  - Mensajería entre arrendador e inquilino.

### 5.2 Datos de test

- Usar un entorno aislado (`staging` o preview de Vercel).
- Seed de datos de test antes de la suite; no depender de datos de producción.
- Limpiar datos creados en `afterAll` o usar usuarios/entidades desechables.

### 5.3 Selectores

- Priorizar `data-testid` para elementos estables. Evitar selectores CSS frágiles o texto visible que puede cambiar por i18n.

### 5.4 Paralelización

- Ejecutar specs en paralelo en CI. Cada spec debe ser autónoma (no depende de estado de otro spec).

---

## 6. Fixtures y Seed

- Mantener un script de seed (`prisma/seed.ts`) para entorno local y de tests.
- Separar fixtures por dominio: `users.fixtures.ts`, `listings.fixtures.ts`.
- Nunca usar datos personales reales en fixtures.

---

## 7. Cobertura

- Objetivo mínimo: **80 % de cobertura en lógica de negocio** (servicios, validaciones, utilidades).
- No perseguir cobertura por cobertura. Un test mal escrito que sube el porcentaje no es deseable.
- En CI, fallar el build si la cobertura de negocio baja del umbral.

---

## 8. CI / CD

- Los tests unitarios e integración corren en cada PR.
- Los tests E2E corren en merge a `main` o en deploy preview, no bloqueando necesariamente el merge salvo que sean críticos.
- Playwright debe generar reporte HTML + traces en fallo para debugging asíncrono.

---

## 9. Checklist de Calidad de Tests

Antes de mergear un nuevo test:

- [ ] Es determinista (no depende de tiempo, red ni orden de ejecución).
- [ ] Falla si el comportamiento esperado cambia (no es un test fantasmas).
- [ ] Tiene un nombre que describe el comportamiento, no la implementación.
- [ ] No usa `setTimeout` arbitrarios; usa esperas explícitas (Playwright) o mocking del reloj (Vitest).
- [ ] Limpia datos o usa transacciones rollback en integración.
- [ ] No prueba detalles de implementación internos de librerías.

---

*Documento mantenido por el equipo de QA + Ingeniería de Toolyo.  
Para propuestas de cambio, abrir un PR modificando este archivo y asignar a `@qa-lead`.*
