# Quickstart de validación: Módulo Administrativo

## Prerrequisitos

- Node.js/npm, PostgreSQL local o Docker/Testcontainers.
- Variables de `development/.env`, incluyendo `DATABASE_URL` y clave de cifrado de secretos.
- Dependencias instaladas en `/Users/hugoolmo63/Documents/projects/Toolyo/development`.

## Instalación y base de datos

```bash
cd /Users/hugoolmo63/Documents/projects/Toolyo/development
npm install
npm run db:generate
npx prisma migrate dev --name admin_backoffice
```

Revisar el SQL antes de aplicar: no debe borrar usuarios, verificaciones, reviews ni reportes existentes.

## Validación estática y tests

```bash
npm run lint
npm test
npm run test:integration
npm run build
npx playwright test tests/e2e/admin
```

## Escenarios mínimos

1. **Setup TOTP**: un `ADMIN` entra en `/admin`, genera QR, confirma seis dígitos y vuelve a entrar; el secreto no aparece en respuestas, logs ni auditoría.
2. **RBAC**: un `MODERATOR` entra y modera reviews, pero no resuelve KYC ni consulta auditoría; un usuario normal recibe `FORBIDDEN`.
3. **KYC**: un `ADMIN` lista solicitudes, consulta una proyección sin documentos, resuelve con motivo y verifica estado, notificación y `AdminAuditLog`.
4. **Moderación**: un `MODERATOR` resuelve un reporte de Módulo 006; una segunda resolución devuelve `CONFLICT` sin duplicar auditoría.
5. **Auditoría**: éxitos, denegaciones, validaciones fallidas y errores dejan actor/procedimiento/resultado; no existen mutaciones para editar/borrar logs.
6. **Concurrencia**: dos decisiones simultáneas producen como máximo una transición válida.
7. **Privacidad**: DTOs, trazas y exportaciones no contienen secreto TOTP, password hash, documentos KYC ni contenido no autorizado.

## Referencias

- Modelo: [data-model.md](./data-model.md)
- Contrato tRPC: [contracts/admin-router.md](./contracts/admin-router.md)
- Investigación: [research.md](./research.md)
- Requisitos: [spec.md](./spec.md)