# Constitución de Base de Datos — Toolyo

> **Versión:** 1.0  
> **Alcance:** Modelado de datos, operaciones, migraciones y optimización de PostgreSQL con Prisma ORM.  
> **Base:** Arquitectura definida en `docs/03-arquitectura-y-tech-stack.md`.

---

## 1. Principios Rectores

1. **La base de datos es la fuente de verdad.** Todo estado duradero debe poder reconstruirse desde ella sin dependencias ocultas.
2. **Integridad referencial en el motor.** Las foreign keys, constraints y checks deben residir en PostgreSQL, no solo en la aplicación.
3. **Evolution, no revolution.** Los cambios de schema deben ser incrementales, reversibles y no destructivos de datos salvo excepción justificada.
4. **Performance por diseño.** Los índices se definen junto al modelo, no como parches posteriores.
5. **Auditoría sin excepciones.** Todo cambio relevante debe poder rastrearse.

---

## 2. Organización del Modelado

### 2.1 Separación conceptual

- **Entidades core:** usuarios, productos, reservas — viven en el schema principal (`public`).
- **Entidades de soporte:** logs, eventos, cache — pueden vivir en schemas separados (`analytics`, `cache`) si el volumen lo justifica.
- **Datos sensibles:** campos PII (personally identifiable information) deben estar identificados y, cuando sea posible, aislados o encriptados.

### 2.2 Convenciones de nombres (Prisma)

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Modelo | PascalCase, singular | `User`, `Booking` |
| Campo | camelCase | `firstName`, `createdAt` |
| Tabla subyacente | plural implícita por Prisma | `users`, `bookings` |
| Índice / Constraint | descriptivo en `@@index` / `@unique` | `@@index([email])` → `idx_user_email` |
| Enum | PascalCase | `BookingStatus` |
| Relación | verbo + entidad, si es ambigua | `owner`, `renter`, `reviewer` |

- **Nunca usar palabras reservadas de SQL** como nombres de campo (`order`, `group`, `primary`).
- **Nunca usar camelCase en nombres de tabla raw SQL**; Prisma lo maneja, pero las queries manuales deben usar `snake_case`.

---

## 3. Tipos de Datos

### 3.1 Identificadores

- Preferir `String` con `uuid()` o `cuid()` para entidades de negocio. Facilita sharding, merging de datasets y evita enumerabilidad.
- Solo usar `Int @id @default(autoincrement())` para tablas internas o de logging donde no haya riesgo de enumeración.

### 3.2 Temporales

- Usar `DateTime` con `@db.Timestamptz(6)` (timestamp with time zone) para todo campo de tiempo real. Nunca `DateTime` sin zona horaria.
- Fechas puras (sin hora) usar `@db.Date`.

### 3.3 Monetarios

- Usar `Decimal` con precisión explícita (`@db.Decimal(19, 4)`) para importes. Nunca `Float` ni `Real` por riesgo de precisión.
- Almacenar siempre en la moneda base del sistema (EUR); si se requiere multimoneda, guardar `amount` + `currencyCode`.

### 3.4 Texto

- `String` para campos cortos y controlados (emails, nombres, slugs).
- `String @db.Text` para contenido libre largo (descripciones, mensajes).
- Slugs: `@unique`, `kebab-case`, derivados del título, inmutables tras la creación.

### 3.5 JSON

- Usar `Json` solo para datos semiestructurados que no requieren querying frecuente (metadatos, configuraciones).
- Si se necesita filtrar por claves dentro del JSON, modelar esos campos explícitamente en columnas tipadas.

### 3.6 Booleanos

- Nombrar siempre de forma afirmativa: `isActive`, `isVerified`, `hasInsurance`. Evitar `disabled`, `notSent`.

---

## 4. Relaciones y Constraints

### 4.1 Cardinalidad

- Definir relaciones en ambos lados del modelo para mantener la integridad del schema de Prisma.
- Preferir relaciones 1:N explícitas con foreign key visible en el lado "muchos".

### 4.2 OnDelete / OnUpdate

- `ON DELETE RESTRICT` por defecto. Solo usar `CASCADE` cuando la eliminación del padre implique lógicamente la desaparición del hijo (ej. un item de un carrito).
- Documentar con comentario (`///`) cada relación que use `CASCADE`.

### 4.3 Constraints de negocio

- Usar `@@unique` para constraints de negocio compuestos (ej. un usuario no puede tener dos favoritos del mismo listing: `@@unique([userId, listingId])`).
- Usar `@map` si el nombre de campo de negocio difiere del estándar de base de datos.

### 4.4 Checks

- Para constraints que Prisma no soporta nativamente, usar migraciones SQL personalizadas (`CHECK` constraints) cuando sea posible, o validar en aplicación si PostgreSQL < 12.

---

## 5. Índices y Performance

### 5.1 Reglas generales

- Todo campo usado en `WHERE`, `JOIN`, `ORDER BY` frecuente debe tener índice.
- No indexar campos de baja cardinalidad (`boolean`, `status` con < 5 valores) salvo en índices compuestos.
- Los índices tienen coste de escritura. Revisar `pg_stat_user_indexes` periódicamente para detectar índices no usados.

### 5.2 Índices compuestos

- El orden de columnas importa: igualdad primero, rango después.
- Ejemplo: `@@index([ownerId, status, createdAt])` sirve para `WHERE ownerId = X AND status = Y ORDER BY createdAt`.

### 5.3 Full-text search

- Para búsquedas textuales avanzadas, usar el índice GIN de PostgreSQL (`@db.Text` + `to_tsvector`).
- Si el volumen o la complejidad de búsqueda lo justifica, delegar a Elasticsearch/Meilisearch, pero mantener PostgreSQL como fallback transaccional.

### 5.4 Geoespacial (PostGIS)

- Usar el tipo `Unsupported("geometry(Point, 4326)")` en Prisma para coordenadas.
- Crear índice GiST en campos geoespaciales para búsquedas por proximidad (`ST_DWithin`).
- Almacenar lat/lng también en columnas `Decimal` separadas si se requieren queries rápidas sin cargar PostGIS.

---

## 6. Migraciones

### 6.1 Flujo de trabajo

1. Modificar `schema.prisma`.
2. Generar migración: `prisma migrate dev --name descripcion_clara`.
3. Revisar el SQL generado antes de aplicar.
4. Aplicar en local y verificar tests.
5. Commitear la migración en el PR.

### 6.2 Migraciones en producción

- Nunca editar una migración ya aplicada.
- Las migraciones destructivas (eliminación de columna, renombrado con pérdida) requieren:
  - Backup previo.
  - Migración en dos pasos si hay downtime cero (ej. añadir nueva columna → backfill → eliminar antigua en migración posterior).
  - Comunicación al equipo.

### 6.3 Migraciones de datos

- Separar migraciones de schema de migraciones de datos.
- Si se requiere transformar datos masivos, hacerlo mediante un script de migración controlado (batch processing), no dentro de una transacción de Prisma Migrate que pueda bloquear la tabla.

---

## 7. Soft Deletes y Auditoría

### 7.1 Soft deletes

- Campo `deletedAt DateTime?` en todo modelo de negocio.
- Las queries por defecto deben filtrar `deletedAt: null`. Usar un middleware de Prisma o un helper de repositorio para no depender de la memoria del desarrollador.
- La purga física de registros soft-deleted se hace mediante proceso batch con política de retención (ej. GDPR: 30 días tras solicitud de borrado).

### 7.2 Auditoría

- Campos mínimos: `createdAt`, `updatedAt`.
- Para trazabilidad fuerte, añadir `createdById`, `updatedById` en entidades críticas.
- Considerar una tabla de `AuditLog` separada para cambios importantes (estado de reservas, modificaciones de precio) si el historial completo es necesario.

---

## 8. Seguridad de Datos

### 8.1 Acceso

- La aplicación conecta con un rol de PostgreSQL de mínimo privilegio (no superusuario).
- Separar roles de lectura/escritura si hay herramientas de BI o reporting.

### 8.2 Encriptación

- **En tránsito:** TLS obligatorio para conexiones a PostgreSQL.
- **En reposo:** activar encriptación a nivel de volumen (AWS RDS, Supabase, etc.).
- **A nivel de campo:** encriptar PII sensible (documentos de identidad, teléfonos si es estrictamente necesario) antes de guardar, usando claves gestionadas por el servicio de secretos.

### 8.3 Máscaras de datos

- En entornos no productivos, usar data masking o anonimización. Nunca replicar datos reales de usuarios a staging sin anonimizar.

---

## 9. Backup y Recuperación

- **Backup automatizado:** diario, con retención de 30 días como mínimo.
- **Point-in-time recovery (PITR):** activar si el proveedor lo soporta (Supabase, AWS RDS).
- **Restauración documentada:** tener un runbook de restauración probado al menos trimestralmente.
- **No confiar solo en el proveedor:** exportar dumps periódicos a almacenamiento redundante (S3/R2) para independencia.

---

## 10. Checklist de Cambio de Schema

Antes de mergear un PR que modifique `schema.prisma`:

- [ ] Los nombres de campos y modelos siguen las convenciones.
- [ ] Se añadieron índices donde se espera querying frecuente.
- [ ] Las relaciones tienen `onDelete` explícito y justificado.
- [ ] No hay tipos `Float` para dinero.
- [ ] Los campos temporales usan `Timestamptz`.
- [ ] La migración fue revisada SQL a SQL.
- [ ] Si es destructiva, tiene plan de backup y rollback.
- [ ] Los tests de integración pasan contra la nueva schema.

---

*Documento mantenido por el equipo de Backend + DBA de Toolyo.  
Para propuestas de cambio, abrir un PR modificando este archivo y asignar a `@backend-lead`.*
