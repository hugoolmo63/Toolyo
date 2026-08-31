# Constitución Backend — Toolyo

> **Versión:** 1.0  
> **Alcance:** API Gateway, Application Layer, Data Layer y External Services.  
> **Base:** Arquitectura definida en `docs/03-arquitectura-y-tech-stack.md`.

---

## 1. Principios Rectores

1. **Seguridad por diseño.** Cada endpoint debe estar protegido por autenticación y autorización por defecto (denegar todo, permitir explícitamente).
2. **Type-safety end-to-end.** Zod es la única fuente de verdad de validación; tRPC propaga los tipos al frontend sin generación intermedia.
3. **Lógica de negocio aislada.** Los routers tRPC son delgados. La lógica vive en servicios puros que no conocen HTTP ni tRPC.
4. **Transaccionalidad explícita.** Las operaciones que modifican múltiples registros deben ejecutarse dentro de transacciones de base de datos.
5. **Observabilidad completa.** Todo error, toda mutación crítica y toda integración externa debe dejar traza estructurada.
6. **La base de datos no es pública.** Ningún navegador, Client Component ni código cliente accede directamente a Prisma o a PostgreSQL; todo acceso a datos pasa por server components, route handlers, tRPC, servicios o repositorios del servidor.

---

## 2. Organización del Código

### 2.1 Estructura de carpetas

```
src/
  server/
    api/
      routers/              # Routers tRPC (agrupados por dominio)
        listing.router.ts
        booking.router.ts
      root.ts               # App router tRPC (merge de routers)
      trpc.ts               # Context, middlewares y procedimientos base
    auth/                   # Configuración de Auth.js / NextAuth
    db/                     # Cliente Prisma y utilidades de query
    services/               # Lógica de negocio pura
      listing.service.ts
      payment.service.ts
    repositories/           # Abstracción de acceso a datos (opcional, para complejidad alta)
    jobs/                   # Tareas en background o colas (ej. Inngest / Bull)
    lib/
      validations/          # Schemas Zod compartidos
      errors/               # Clases de error de dominio
      logger.ts             # Instancia de logger estructurado
    types/                  # Tipos globales de dominio
  env.mjs                   # Validación de variables de entorno (Zod)
```

### 2.2 Reglas de ubicación

- **Un router por dominio.** No mezclar endpoints de pagos con endpoints de mensajes en el mismo archivo.
- **Los servicios no importan de `api/`.** Pueden importar de `db/`, `lib/` y otros `services/`.
- **No exponer Prisma Client directamente** en routers ni en servicios que no sean repositories. Usar funciones tipadas que encapsulen los queries.
- **Nunca importar Prisma en código cliente.** El cliente web consume datos vía Server Components, tRPC o route handlers; las lecturas/escrituras de base de datos viven exclusivamente en el servidor.

---

## 3. Estilo de Código

### 3.1 TypeScript

- `strict: true` sin excepciones.
- **No `any`.** Si es necesario interactuar con una librería no tipada, crear un `*.d.ts` o un wrapper tipado.
- **Tipos de retorno explícitos en servicios públicos.** Facilita detectar cambios de contrato en el code review.

### 3.2 Naming

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Routers tRPC | camelCase con sufijo `Router` | `listingRouter` |
| Procedimientos | camelCase | `getBySlug`, `create` |
| Servicios | camelCase con sufijo `Service` (objeto) o verbo (función) | `listingService` / `createBooking` |
| Zod schemas | PascalCase con sufijo `Schema` | `CreateBookingSchema` |
| Clases de error | PascalCase con sufijo `Error` | `PaymentFailedError` |

### 3.3 Async / Await

- Usar `async/await` universalmente. No mezclar con `.then().catch()` salvo en utilidades de infraestructura.
- Siempre envolver errores de librerías externas en errores de dominio antes de propagarlos.

---

## 4. API Layer (tRPC)

### 4.1 Procedimientos base

Definir en `trpc.ts`:
- `publicProcedure`: sin autenticación (solo para health checks, webhooks públicos, etc.).
- `authedProcedure`: requiere sesión válida.
- `verifiedProcedure`: requiere sesión + usuario verificado (KYC).
- `adminProcedure`: requiere rol `admin`.

### 4.2 Routers

- Cada router debe seguir el patrón:
  ```ts
  export const listingRouter = createTRPCRouter({
    getBySlug: publicProcedure
      .input(GetBySlugSchema)
      .query(async ({ ctx, input }) => { … }),
    create: authedProcedure
      .input(CreateListingSchema)
      .mutation(async ({ ctx, input }) => { … }),
  });
  ```
- **Máximo 2 niveles de anidamiento** en routers.

### 4.3 Inputs y Outputs

- Todo `input` debe validarse con Zod.
- Preferir no definir `output` explícito en tRPC a menos que sea una API pública consumida por terceros; la inferencia de Prisma + servicios es suficiente.
- **Nunca devolver objetos Prisma crudos** que contengan campos sensibles (password hashes, tokens internos). Usar mappers o select explícitos.

---

## 5. Validación

- **Zod es la única fuente de verdad.** Un schema definido en `lib/validations/` debe usarse tanto en tRPC input como en formularios del frontend.
- **Validar en los bordes:** tRPC inputs, route handlers, y consumidores de webhooks.
- **Coerción cuidadosa:** usar `z.coerce.date()` o `z.coerce.number()` cuando los datos provengan de query params o formularios HTML.

---

## 6. Autenticación y Autorización

### 6.1 Auth

- Usar Auth.js (NextAuth v5) con JWT estratégico: sesiones cortas (15-60 min), refresh tokens seguros en cookies `HttpOnly`, `Secure`, `SameSite=Lax`.
- **No almacenar secretos en el token JWT visible desde el cliente.** El payload debe ser mínimo: `sub`, `email`, `role`.

### 6.2 Autorización (RBAC)

- Niveles de confianza definidos en arquitectura: `admin`, `user`, `verified_user`, `super_owner`.
- Implementar autorización a dos niveles:
  1. **Middleware de procedimiento** (quién puede llamar).
  2. **Autorización de recurso** (quién puede ver/modificar este registro concreto). Siempre verificar ownership en queries.

---

## 7. Base de Datos (Prisma + PostgreSQL)

### 7.1 Modelado

- **Convención de nombres:** `PascalCase` para modelos, `camelCase` para campos. Tablas en plural implícito por Prisma.
- **IDs:** preferir `String` con `uuid()` o `cuid()` para facilitar sharding futuro; no usar autoincrementales en entidades de negocio principales.
- **Campos de auditoría:** `createdAt`, `updatedAt` en todo modelo. Opcional `createdBy`, `updatedBy` si aplica trazabilidad.
- **Soft deletes:** usar un campo `deletedAt` (DateTime?) en lugar de borrar físicamente, salvo exigencia legal de eliminación (GDPR).

### 7.2 Queries

- **N+1:** usar `include` consciente o DataLoader si la complejidad de relaciones lo requiere.
- **Índices:** definir en el schema de Prisma (`@@index`, `@@unique`). Revisar planes de ejecución (`EXPLAIN ANALYZE`) en queries críticas.
- **Campos sensibles:** marcar con comentario `// sensitive` y nunca incluirlos en selects por defecto.

### 7.3 Migraciones

- Un cambio de schema = una migración. No editar migraciones ya aplicadas en producción.
- Revisar migraciones generadas en PR para detectar renombrados destructivos o pérdida de datos.
- Backup antes de migrar en producción.

### 7.4 Transacciones

- Usar `$transaction` de Prisma para operaciones que modifiquen más de una tabla relacionada (ej. reserva + pago + disponibilidad).
- Si la transacción supera 3 operaciones o incluye lógica condicional, extraerla a un servicio con nombre explícito.

---

## 8. Servicios y Lógica de Negocio

- **Un servicio por dominio o agregado.** Ej: `BookingService`, `PaymentService`.
- **Funciones puras cuando sea posible.** Separar cálculos (precio, comisiones, fechas) de side effects (DB, API externa).
- **No mezclar lógica de integraciones externas** con lógica de dominio. Las integraciones deben vivir en adaptadores con interfaz clara (patrón puerto/adaptador).

---

## 9. Manejo de Errores

### 9.1 Jerarquía de errores

- `AppError` (base): message, code, statusCode.
- `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ConflictError`, `ExternalServiceError`.
- Los servicios lanzan errores de dominio; los routers los mapean a HTTP responses vía `throw` o middleware de tRPC.

### 9.2 No exponer información interna

- En producción, los errores inesperados devuelven un `internal_server_error` genérico. El detalle completo va al logger.
- Nunca enviar stack traces al cliente.

### 9.3 Logging

- Usar logger estructurado (JSON) con niveles: `info` para operaciones de negocio, `warn` para recuperables, `error` para fallos.
- Incluir `requestId`, `userId`, `trace` en cada log para correlación.

---

## 10. Seguridad

### 10.1 Transporte y Headers

- TLS 1.3 obligatorio.
- Headers de seguridad en Next.js (`headers()` en `next.config.js`): `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, CSP estricto.

### 10.2 Rate Limiting

- Aplicar rate limiting por IP y por usuario autenticado en routers sensibles (auth, pagos, subida de imágenes).
- Usar Redis como store de rate limiting (Upstash).

### 10.3 Inputs

- Sanitizar todo input antes de procesarlo. Zod elimina tipos inesperados, pero no sustituye a sanitización de HTML si se renderiza contenido enriquecido (usar DOMPurify).
- **SQL Injection:** imposible con Prisma parametrizado, pero nunca usar `$queryRaw` con strings interpoladas.

### 10.4 Secretos

- Validar variables de entorno al inicio (`env.mjs`). Si falta una variable crítica, la aplicación no arranca.
- Rotación de secretos soportada: leer en runtime, no cachear en módulos de forma que requieran rebuild.

---

## 11. Integraciones Externas

### 11.1 Patrón

- Cada integración externa (Stripe, Mapbox, Email, SMS) debe tener:
  - Un **cliente tipado** inicializado en `lib/`.
  - Un **adapter** que traduzca entre el modelo externo y el modelo de dominio.
  - Un **circuit breaker** o al menos reintentos con backoff exponencial en operaciones críticas.

### 11.2 Webhooks

- Verificar firma del webhook (Stripe, etc.) antes de procesar.
- Responder con `200` tan pronto como se valide la firma; procesar la lógica de negocio de forma asíncrona si es posible, para evitar timeouts y reintentos del emisor.
- Guardar payload crudo en log o tabla de auditoría antes de procesar.

### 11.3 Idempotencia

- Las operaciones de pago y escrituras críticas deben ser idempotentes (clave de idempotencia en header o body).

---

## 12. Caching

- **Redis** para cache de queries pesadas, sesiones y rate limiting.
- Las claves de cache deben incluir versión de invalidación (`v1:listing:slug:xyz`) para permitir invalidaciones masivas sin scan.
- **Cache aside** por defecto; no usar write-through salvo que la consistencia eventual no sea aceptable.
- Invalidar cache en las mutaciones, no con TTL agresivo como única estrategia.

---

## 13. Tests

(Ver también `constitution/TESTING.md`)

- **Unitarios:** Vitest para servicios y utilidades puras. Mockear Prisma y servicios externos.
- **Integración:** tests de routers tRPC contra una base de datos real (testcontainers o instancia efímera). No mockear Prisma aquí.
- **Contratos:** verificar que los schemas Zod no rompan compatibilidad con el frontend (puede automatizarse en CI).

---

## 14. Checklist de Revisión de Código Backend

Antes de abrir un PR:

- [ ] Todo input de tRPC valida con Zod.
- [ ] Los servicios no dependen de objetos tRPC/HTTP.
- [ ] No hay exposición de campos sensibles en respuestas.
- [ ] Las operaciones multi-tabla usan transacciones.
- [ ] La autorización de recurso se verifica (ownership).
- [ ] Los errores se mapean correctamente; no hay leaks de stack trace.
- [ ] Se añadió logging en flujos críticos o de error.
- [ ] Los tests pasan y la cobertura de servicios no baja del umbral.

---

*Documento mantenido por el equipo de Backend de Toolyo.  
Para propuestas de cambio, abrir un PR modificando este archivo y asignar a `@backend-lead`.*
