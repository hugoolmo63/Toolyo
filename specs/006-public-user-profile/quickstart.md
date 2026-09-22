# Quickstart: Vista Pública del Perfil de Usuario

## Prerrequisitos

- Node.js 20+ y npm.
- PostgreSQL/PostGIS accesible mediante `DATABASE_URL` para integración.
- Ejecutar desde `/Users/hugoolmo63/Documents/projects/Toolyo/development`.

## Preparar el proyecto

```bash
cd /Users/hugoolmo63/Documents/projects/Toolyo/development
npm ci
npm run db:generate
npm run dev
```

Si se necesita poblar datos locales y la base está disponible:

```bash
npm run db:seed
```

## Validación manual pública

1. Obtener un `User.id` activo con listings publicados.
2. Abrir `http://localhost:3000/users/<id>` sin sesión.
3. Confirmar cabecera, fecha de registro, rating, transacciones y badges.
4. Confirmar que Contactar no muestra email/teléfono y conserva el flujo de login/contacto.
5. Confirmar que el mapa, si hay ubicación, muestra un círculo aproximado de 750 m y no coordenadas textuales.
6. Confirmar que las cards enlazan a `/listings/<slug>` y que no aparecen listings draft/paused/deleted.
7. Confirmar el estado vacío cuando no existan reseñas.

## Tests unitarios

```bash
npm test -- --run tests/unit/user-profile
```

Debe cubrir DTO público, insignias, filtros de listing, privacidad geográfica y estados vacíos/reseñas.

## Tests de integración

```bash
npm run test:integration -- --run tests/integration/user-profile
```

Debe verificar perfil activo/404, exclusión de campos privados, listings publicados, fotos principales y comportamiento cuando Review no existe o no tiene datos públicos.

## Typecheck y accesibilidad

```bash
npx tsc --noEmit
```

Cuando Playwright esté configurado:

```bash
npx playwright test tests/e2e/user-profile
```

Escenarios E2E mínimos: navegación con teclado, CTA Contactar, carga sin mapa, carga sin listings/reseñas y fallback de tiles/imágenes.

## Referencias

- Modelo y filtros: [data-model.md](data-model.md)
- Contrato público: [contracts/profile-public.md](contracts/profile-public.md)
- Requisitos: [spec.md](spec.md)