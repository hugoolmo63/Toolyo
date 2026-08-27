# Quickstart: Registro y Verificación

## Prerrequisitos

- Node.js 20+ y npm.
- PostgreSQL accesible mediante `DATABASE_URL` para integración.
- Variables de entorno de desarrollo para Auth.js y proveedores de email/SMS únicamente cuando estén configurados. No usar credenciales reales en local.
- Ejecutar comandos desde `/development`.

## Preparar el proyecto

```bash
cd development
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate
```

El archivo `.env.example` y las variables concretas de proveedores deben documentarse durante implementación sin commitear secretos.

## Ejecutar la aplicación

```bash
npm run dev
```

Abrir `http://localhost:3000/register` cuando la ruta exista.

## Validación unitaria

```bash
npm test -- --run tests/unit/auth
```

Debe cubrir normalización de email/teléfono, schemas Zod, contraseña, generación/verificación OTP, expiración, intentos, estados KYC, capacidades y redacción de eventos.

## Validación de integración

```bash
npm run test:integration -- --run tests/integration/auth
```

Debe ejecutarse contra PostgreSQL real o efímero y verificar unicidad de email, transacción de registro y aceptaciones, consumo atómico de OTP, límites, webhooks KYC idempotentes y ausencia de datos sensibles en respuestas.

## Validación E2E

Cuando Playwright esté configurado:

```bash
npx playwright test tests/e2e/auth
```

Escenarios mínimos:

1. Registro válido con email/contraseña y ambos documentos aceptados.
2. Bloqueo por consentimiento faltante y recuperación del formulario.
3. OTP válido, inválido, caducado, consumido y bloqueado.
4. Solicitud limitada de reenvío sin enumerar cuentas.
5. SSO habilitado en entorno de prueba con callback inválido rechazado.
6. KYC pendiente/rechazado no concede badge ni capacidades avanzadas.
7. Formulario navegable con teclado, foco visible y controles con nombre accesible.

## Smoke de seguridad

- Buscar en logs de test que no aparezcan contraseñas, OTP, tokens, documentos ni payloads KYC.
- Verificar cookies de sesión con `HttpOnly`, `Secure` y `SameSite` adecuado al entorno.
- Probar que dos registros concurrentes del mismo email solo producen una cuenta.
- Probar que un callback KYC duplicado no cambia dos veces el estado ni concede privilegios adicionales.

## Resultado esperado

Una persona puede crear una cuenta, verificar email/teléfono y consultar el estado KYC; los consentimientos quedan versionados; las capacidades se derivan del estado del servidor y no se filtran secretos.
