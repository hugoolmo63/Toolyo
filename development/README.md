# Toolyo Development

Scaffold de la aplicación web de Toolyo.

## Registro y onboarding

La feature `002-registration` añade:

- Registro email/contraseña con validación Zod.
- Estados de verificación de email, teléfono e identidad.
- OTP temporal almacenado como HMAC/hash.
- Consentimientos legales versionados.
- Adaptadores seguros de email, SMS y KYC sin proveedores reales por defecto.
- Páginas `/register`, `/verify` y `/kyc` con tema `profesional-seguro`.

## Desarrollo local

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

No introduzcas credenciales reales en `.env` ni en fixtures. `AUTH_GOOGLE_ENABLED`, `AUTH_APPLE_ENABLED`, `AUTH_FACEBOOK_ENABLED` y `KYC_PROVIDER` permanecen deshabilitados hasta configurar proveedores y revisar requisitos legales.

## Validación

```bash
npm test
npm run test:integration
npx tsc --noEmit
```

La integración PostgreSQL requiere que la base de datos de `docker-compose.yml` esté disponible. Los documentos KYC no se almacenan en Toolyo por defecto; solo se conserva el resultado minimizado y la referencia del proveedor.
