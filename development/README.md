# Backoffice Administrativo

La primera entrega administrativa está disponible bajo `/admin` para usuarios con rol `ADMIN` o `MODERATOR`.

- `ADMIN`: gestión de usuarios/KYC, moderación y consulta de auditoría.
- `MODERATOR`: moderación de reviews y acceso limitado a datos de usuario.
- El acceso administrativo requiere TOTP RFC 6238 después del login inicial.
- Los cambios administrativos críticos se registran en `AdminAuditLog` de forma append-only.
- Las respuestas administrativas excluyen secretos TOTP, password hashes y documentos KYC.

Validación funcional: consultar `specs/009-modulo-backoffice/quickstart.md`.
# Toolyo Development

Scaffold de la aplicación web de Toolyo.

## Registro y onboarding

La feature `002-registration` añade:

- Registro email/contraseña con validación Zod.
- Estados de verificación de email, teléfono e identidad.
- OTP temporal almacenado como HMAC/hash.
- Consentimientos legales versionados.
- Adaptadores seguros de email, SMS y KYC sin proveedores reales por defecto.
- Páginas `/register` (redirige a `/auth?tab=register`), `/verify` y `/kyc` con tema `profesional-seguro`.

## Inicio de sesión y sesión

La feature `003-login` añade:

- Login por email/contraseña con sesión opaca respaldada por DB (tabla `Session`).
- Cookie `HttpOnly`, `Secure` (producción), `SameSite=Lax` con token opaco de 32 bytes.
- Revocación inmediata de sesión (logout marca `revokedAt`).
- Rate limiting dual: 5 intentos/min por IP y por email.
- Pantalla unificada `/auth` con tabs para alternar entre "Iniciar sesión" y "Crear cuenta".
- Middleware de Next.js que protege rutas autenticadas (`/dashboard`, `/profile`) redirigiendo a `/auth?tab=login&callback=<destino>`.
- Dashboard de onboarding con estado de email, teléfono, identidad y capacidades.
- Eventos de seguridad: `login_success`, `login_failure`, `login_blocked`, `logout`.
- Variables de entorno: `SESSION_COOKIE_NAME`, `SESSION_TTL_SECONDS` (3600), `SESSION_REMEMBER_TTL_SECONDS` (2592000).

## Búsqueda pública y página de inicio

La feature `004-public-search` añade:

- Página raíz `/` como landing de búsqueda pública, accesible sin sesión ni identificación.
- Resultados aleatorios de listings publicados desde la carga inicial (sin que el visitante busque nada).
- Barra de búsqueda con autocompletado de ubicaciones (Nominatim/OpenStreetMap) y categorías.
- Detección automática de ubicación (GPS) o selección manual.
- Filtros combinables (categoría, rango de fechas, precio máximo, distancia máxima, rating mínimo, solo verificados) y ordenación (Relevancia, Más cercano, Precio, Mejor valorado, Más popular).
- Vista de mapa interactivo (Leaflet) con pins y preview, y vista de grid/lista.
- Paginación adaptativa: infinite scroll en móvil, paginación numerada en desktop.
- Estado de búsqueda codificado en la URL (compartible y restaurable) vía `nuqs`.
- Modelo `Listing` mínimo con PostGIS para búsquedas por proximidad; la feature de listings (§2) lo extenderá después.
- Degradación elegante del mapa si el proveedor no carga.
- Variables de entorno: `MAP_TILES_URL`, `GEOCODING_PROVIDER`, `GEOCODING_BASE_URL`, `SEARCH_RATE_LIMIT_PER_MIN` (100), `SUGGEST_RATE_LIMIT_PER_MIN` (60).
- Requiere imagen Docker `postgis/postgis` en lugar de `postgres` estándar.

Consulta [specs/004-public-search/quickstart.md](../specs/004-public-search/quickstart.md) para la guía de validación.

## Página de detalle del producto

La feature `005-listing-detail` añade:

- Ruta pública `/listings/[slug]` con la ficha completa de un listing publicado, accesible sin sesión ni identificación.
- Galería de imágenes con carrusel navegable, zoom y pantalla completa (accesible por teclado).
- Título, descripción, categoría, ubicación aproximada, badges (verificado, reserva instantánea) y rating.
- Calendario de disponibilidad interactivo con selección de rango de fechas (recogida y devolución) que marca fechas bloqueadas; el rango se refleja en la URL (`?start=...&end=...`) para ser compartible y restaurable.
- Tabla de precios derivados por defecto desde `pricePerDay` (tramos 1d/3d/7d con descuentos 0%/5%/10%) y total estimado que se recalcula al cambiar el rango.
- Perfil público del arrendador (nombre, avatar, badge verificado, rating, tiempo de respuesta, número de transacciones — los campos no disponibles se muestran como "N/A" hasta la feature de perfil §1.2).
- Botones "Contactar" y "Reservar" como entry-points con gating de login no bloqueante que preservan el contexto del listing y el rango seleccionado; "Contactar" enruta a `/messages` y "Reservar" abre `BookingRequestDialog`, que solicita la reserva y navega al chat contextual.
- Sección de reviews con estado vacío "Aún no hay reviews" (las reviews reales llegan con el módulo §6).
- Productos similares de misma categoría y/o zona (hasta 6 tarjetas compactas).
- Información de seguro (informativa, condicional a la verificación del arrendador) y reglas del arrendador con defaults (Flexible + horarios genéricos) hasta que la feature de listings §2 introduzca campos configurables.
- 404 informativo para listings no publicados/inexistentes sin filtrar el motivo interno.
- Incremento del contador `viewCount` deduplicado por IP/sesión en ventana de 30 min, fire-and-forget para no añadir latencia al render.
- Sin cambios en el schema Prisma: reutiliza `Listing`, `ListingPhoto`, `ListingAvailability`, `User`, `VerificationState` y `Category` de features anteriores.

Consulta [specs/005-listing-detail/quickstart.md](../specs/005-listing-detail/quickstart.md) para la guía de validación.

## Desarrollo local

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

No introduzcas credenciales reales en `.env` ni en fixtures. `AUTH_GOOGLE_ENABLED`, `AUTH_APPLE_ENABLED`, `AUTH_FACEBOOK_ENABLED`, `SMS_OTP_ENABLED` y `KYC_PROVIDER` permanecen deshabilitados o controlados por entorno hasta configurar proveedores y revisar requisitos legales.

Para enviar el correo real de verificación, configura `EMAIL_PROVIDER="resend"` y completa `RESEND_API_KEY` y `RESEND_FROM` en `.env`.

## Validación

```bash
npm test
npm run test:integration
npm run test:e2e          # suite E2E completa (Playwright)
npm run test:e2e -- navigation   # solo la batería de navegación
npx tsc --noEmit
```

La integración PostgreSQL requiere que la base de datos de `docker-compose.yml` esté disponible. Los documentos KYC no se almacenan en Toolyo por defecto; solo se conserva el resultado minimizado y la referencia del proveedor.

### Batería de navegación (smoke E2E)

`tests/e2e/navigation.spec.ts` verifica que todas las rutas públicas cargan, que la navegación principal funciona y que las rutas protegidas redirigen a `/auth`. Además recorre journeys autenticados completos con el usuario del seed (`test@test.com`): login contextual → panel → logout, publicar producto → retirarlo, contactar al arrendador → enviar mensaje, solicitar reserva → aterrizar en el chat contextual, y consultar la reserva pendiente como arrendador. Los journeys crean datos de prueba en el entorno (mensajes, solicitudes, productos `E2E` que se retiran al final). Sin `E2E_BASE_URL`, Playwright arranca (o reutiliza) el dev server en `127.0.0.1:3000` automáticamente; para apuntar a otro entorno (p. ej. el Docker de `scripts/deploy-test.mjs`):

```bash
E2E_BASE_URL=http://localhost:3100 npm run test:e2e -- navigation
```

Cada test graba un vídeo de evidencia en `test-results/<nombre-del-test>/video.webm`, conserve o falle. En fallo también quedan screenshot y trace.

## Cheat Sheet

Consulta [CHEATSHEET.md](CHEATSHEET.md) para una referencia rápida de comandos de npm, Prisma, Docker y depuración.

## Arquitectura

Consulta [ARCHITECTURE.md](ARCHITECTURE.md) para una explicación visual y orientada a principiantes de todas las piezas del proyecto.
