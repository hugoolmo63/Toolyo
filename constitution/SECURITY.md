# Constitución de Seguridad — Toolyo

> **Versión:** 1.0  
> **Alcance:** Seguridad transversal — frontend, backend, infraestructura, operaciones y cultura de equipo.  
> **Base:** Arquitectura definida en `docs/03-arquitectura-y-tech-stack.md`.

---

## 1. Principios Rectores

1. **Defense in depth.** Ninguna capa sola es suficiente. Validar en el cliente, en la red, en la API, en la base de datos.
2. **Fail secure.** Si algo falla, el sistema debe negar acceso, no concederlo.
3. **Menor privilegio.** Usuarios, servicios y procesos deben tener exactamente los permisos que necesitan, ni uno más.
4. **Seguridad por diseño, no por capa.** No se añade al final; se define en cada decisión técnica.
5. **Transparencia controlada.** Documentar brechas conocidas y mitigaciones. No ocultar incidentes internamente.

---

## 2. Autenticación

### 2.1 Sesiones y tokens

- Usar sesiones cortas (15–60 min) con refresh tokens rotativos almacenados en cookies `HttpOnly`, `Secure`, `SameSite=Lax`.
- El JWT accesible desde el cliente debe contener solo claims mínimos: `sub`, `email`, `role`. Nunca secretos, ni siquiera parcialmente.
- Invalidar refresh tokens en logout y en detección de uso sospechoso (reutilización de token ya consumido).

### 2.2 OAuth y proveedores sociales

- Verificar el `state` parameter en flujos OAuth para prevenir CSRF.
- Validar el `id_token` (signature, issuer, audience, expiración) antes de confiar en sus claims.
- No usar el email del proveedor social como único factor de identidad sin verificación adicional para acciones sensibles.

### 2.3 Contraseñas

- Si se soporta login por contraseña (no solo OAuth), exigir mínimo 12 caracteres.
- Hashear con Argon2id o bcrypt. Nunca SHA-256, nunca MD5, nunca en texto plano.
- No implementar "política de complejidad" excesiva que incentive contraseñas escritas en post-its.

---

## 3. Autorización

### 3.1 Modelo RBAC

- Roles definidos: `admin`, `user`, `verified_user`, `super_owner`.
- Los roles determinan qué endpoints puede llamar un usuario; no qué recursos puede ver.

### 3.2 Autorización de recursos (ABAC)

- Independientemente del rol, verificar ownership o permiso explícito sobre el recurso solicitado.
- Ejemplo: un usuario autenticado no puede ver el `booking` de otro usuario solo porque tiene rol `user`.
- Implementar esta verificación en el servicio, no solo en el middleware de ruta.

### 3.3 Escalación de privilegios

- Las acciones administrativas deben requerir re-autenticación o MFA si se implementa.
- Separar cuentas de administración de cuentas de uso normal si el equipo es grande.

---

## 4. Protección de Datos

### 4.1 Clasificación

| Nivel | Ejemplos | Tratamiento |
|-------|----------|-------------|
| **Público** | Nombre de la app, branding | Sin restricción |
| **Interno** | Métricas de uso agregadas | Acceso autenticado |
| **Confidencial** | Emails, nombres, direcciones | Encriptación en reposo, acceso logueado |
| **Restringido** | Documentos KYC, datos de pago, conversaciones privadas | Encriptación de campo, acceso mínimo, audit log |

### 4.2 Encriptación

- **En tránsito:** TLS 1.3 en todas las comunicaciones (cliente → servidor, servidor → DB, servidor → APIs externas).
- **En reposo:** activar encriptación de volumen en PostgreSQL, S3, Redis.
- **A nivel de campo:** encriptar datos restringidos antes de persistir. Las claves deben gestionarse en un servicio de secretos (AWS KMS, HashiCorp Vault, etc.), nunca en el código ni en variables de entorno planas.

### 4.3 Tokenización

- Los datos de tarjetas de pago nunca tocan la base de datos de la aplicación. Delegar a Stripe (tokenización) u otro PCI-compliant provider.

### 4.4 GDPR y privacidad

- Implementar derecho al olvido: endpoint/documentado para eliminar cuenta y datos asociados.
- Portabilidad de datos: endpoint para exportar datos personales en formato legible (JSON).
- Retención: definir políticas de retención y purga automática para datos no esenciales.

---

## 5. Seguridad de APIs

### 5.1 Validación de inputs

- Todo input debe validarse con Zod antes de procesarse. Zod elimina tipos inesperados; no sustituye a sanitización de contenido HTML.
- Longitudes máximas en strings, rangos en números, formatos en fechas y emails.

### 5.2 Rate limiting

- Aplicar por IP (anónimo) y por `userId` (autenticado).
- Umbrales sugeridos:
  - Auth: 5 intentos / minuto.
  - APIs generales: 100 req / minuto.
  - Subida de archivos: 10 req / minuto.
- Usar Redis como store compartido para rate limiting en despliegues multi-instancia.

### 5.3 Headers de seguridad

Configurar obligatoriamente:

| Header | Valor recomendado |
|--------|-------------------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Definir según assets concretos; evitar `unsafe-inline` en `script-src` |

### 5.4 CORS

- Permitir solo orígenes explícitos. No usar `*` en producción.
- No reflejar el header `Origin` del request sin validación.

### 5.5 CSRF

- Las cookies de sesión deben usar `SameSite=Lax` como mínimo; `SameSite=Strict` si no hay flujos cross-site legítimos.
- Los endpoints de mutación que acepten `application/json` no requieren token CSRF adicional si la cookie es `SameSite=Lax/Strict` y no se aceptan requests de form HTML simple.

---

## 6. Gestión de Dependencias y Supply Chain

### 6.1 Lockfiles

- Nunca instalar sin lockfile (`package-lock.json`, `pnpm-lock.yaml`). Commitear siempre el lockfile.

### 6.2 Auditoría

- Ejecutar `npm audit` / `pnpm audit` en CI. Fallar el build si hay vulnerabilidades **high** o **critical** sin justificación documentada.
- Usar herramientas de SCA (Software Composition Analysis) si el presupuesto lo permite (Snyk, Dependabot, Socket.dev).

### 6.3 Actualizaciones

- Revisar changelogs de dependencias críticas (Next.js, Prisma, Auth.js) antes de actualizar versiones mayores.
- No actualizar dependencias el mismo día de un release crítico de producción.

---

## 7. Seguridad en CI/CD

### 7.1 Secretos

- Nunca hardcodear secretos en el repositorio. Usar GitHub Secrets, Vault, o similar.
- Ejecutar secret scanning (GitHub Advanced Security, TruffleHog) en cada push.

### 7.2 Permisos

- El token de CI debe tener permisos mínimos (principio de menor privilegio).
- No usar credenciales de larga duración; preferir OIDC para autenticación cloud desde GitHub Actions.

### 7.3 Artefactos

- No incluir archivos `.env`, dumps de base de datos ni claves privadas en artefactos de build.

---

## 8. Monitoreo y Respuesta

### 8.1 Logging de seguridad

- Registrar eventos críticos de seguridad de forma estructurada:
  - Intentos de login fallidos.
  - Cambios de contraseña o email.
  - Modificaciones de roles.
  - Acceso a datos masivos (bulk export).
  - Errores de rate limiting superados.

### 8.2 Alertas

- Configurar alertas automáticas para:
  - Múltiples errores 401/403 desde una misma IP.
  - Tráfico inusual (picos de requests, patrones de scraping).
  - Errores de validación masivos (posible ataque de fuzzing).

### 8.3 Respuesta a incidentes (básica)

1. **Detección:** alerta o reporte.
2. **Contención:** rotar secretos comprometidos, revocar sesiones, bloquear IPs si es necesario.
3. **Investigación:** revisar logs con `requestId` y timestamp.
4. **Recuperación:** aplicar fix, verificar en staging, desplegar.
5. **Post-mortem:** documentar qué pasó, por qué, y qué previene la recurrencia. Sin culpas.

---

## 9. Checklist de Seguridad para PRs

Antes de mergear cualquier cambio, verificar:

- [ ] No se añaden secretos, tokens ni credenciales en el código.
- [ ] Los inputs nuevos validan con Zod (tipo, longitud, rango, formato).
- [ ] Los endpoints nuevos están protegidos por autenticación y autorización.
- [ ] No se exponen datos sensibles en respuestas ni en logs.
- [ ] Las cookies de sesión usan `HttpOnly`, `Secure`, `SameSite`.
- [ ] No se introducen dependencias sin revisar su origen y mantenimiento.
- [ ] Los headers de seguridad no se debilitan.
- [ ] Se añade logging para operaciones sensibles si aplica.

---

*Documento mantenido por el equipo de Seguridad + Backend de Toolyo.  
Para propuestas de cambio, abrir un PR modificando este archivo y asignar a `@security-lead`.*
