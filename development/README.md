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
npx tsc --noEmit
```

La integración PostgreSQL requiere que la base de datos de `docker-compose.yml` esté disponible. Los documentos KYC no se almacenan en Toolyo por defecto; solo se conserva el resultado minimizado y la referencia del proveedor.

## Cheat Sheet

Consulta [CHEATSHEET.md](CHEATSHEET.md) para una referencia rápida de comandos de npm, Prisma, Docker y depuración.

## Arquitectura

Consulta [ARCHITECTURE.md](ARCHITECTURE.md) para una explicación visual y orientada a principiantes de todas las piezas del proyecto.
