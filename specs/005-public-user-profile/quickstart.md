# Quickstart: Módulo de Perfil de Usuario

## Prerrequisitos

- Node.js 20+ y npm.
- PostgreSQL accesible mediante `DATABASE_URL` para integración.
- Ejecutar comandos desde `/Users/hugoolmo63/Documents/projects/Toolyo/development`.

## Preparar y ejecutar

```bash
cd /Users/hugoolmo63/Documents/projects/Toolyo/development
npm ci
npm run db:generate
npm run db:migrate
npm run dev
```

## Validación unitaria

```bash
npm test -- --run tests/unit/user-profile
```

Verificar schemas, mapeo público, badges, límites y servicio de actualización.

## Validación de integración

```bash
npm run test:integration -- --run tests/integration/user-profile
```

Escenarios mínimos:

1. Lectura pública de un usuario activo con listings activos.
2. Exclusión de listings eliminados/no publicados y de campos privados.
3. Actualización válida del usuario autenticado, incluida `preferredLocation`.
4. Rechazo 401 sin sesión y 403 al intentar modificar otro usuario.
5. Entrada inválida sin cambios parciales.

Los campos y relaciones se detallan en [data-model.md](data-model.md); los límites de interfaz están en [contracts/profile-ui.md](contracts/profile-ui.md).