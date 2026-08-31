# Toolyo Cheat Sheet

Guía rápida de comandos para arrancar, parar, compilar, depurar y diagnosticar el proyecto `development`.

## 1. Arranque rápido

```bash
cd /Users/rolmov/Documents/github/Toolyo/development
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

- App web: http://localhost:3000
- Registro: http://localhost:3000/register
- Verificación: http://localhost:3000/verify
- KYC: http://localhost:3000/kyc

## 2. NPM útil

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run test:integration
npm run test:watch
```

### Comandos útiles de instalación y estado

```bash
npm ci
npm install
npm ls
npm ls @prisma/client prisma
```

Notas:
- Este proyecto usa `npm`, no `pnpm`.
- `@prisma/client` y `prisma` deben ir en la misma versión exacta.

## 3. Prisma

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Si necesitas ver la base o resetear el esquema

```bash
cd /Users/rolmov/Documents/github/Toolyo/development
npx prisma studio
npx prisma validate
npx prisma format
```

### Consultas rápidas contra la BD local

```bash
docker exec -i toolyo_postgres psql -U toolyo -d toolyo
```

Dentro de `psql`:

```sql
select * from "User" order by "createdAt" desc;
select * from "VerificationState" where "userId" = '...';
select * from "OtpChallenge" order by "createdAt" desc;
```

## 4. Docker y base de datos

`development/docker-compose.yml` levanta PostgreSQL como `toolyo_postgres`.

### Arrancar / parar

```bash
cd /Users/rolmov/Documents/github/Toolyo
docker compose -f development/docker-compose.yml up -d
docker compose -f development/docker-compose.yml down
```

### Reiniciar limpio el contenedor de Postgres

```bash
docker rm -f toolyo_postgres
docker compose -f development/docker-compose.yml up -d
```

### Diagnóstico de Docker

```bash
docker ps
docker ps -a
docker logs toolyo_postgres
docker logs -f toolyo_postgres
docker inspect toolyo_postgres
```

### Comprobar que PostgreSQL responde

```bash
docker exec -i toolyo_postgres psql -U toolyo -d toolyo -c "select now();"
```

## 5. Compilar y validar

```bash
npx tsc --noEmit
npm run build
npm run lint
npm test
npm run test:integration
```

Orden recomendado cuando cambias backend o Prisma:
1. `npm run db:generate`
2. `npm run db:migrate`
3. `npx tsc --noEmit`
4. `npm test`
5. `npm run test:integration`

## 6. Depuración práctica

### Ver si el servidor Node sigue vivo

```bash
lsof -iTCP:3000 -sTCP:LISTEN -n -P
ps -p <PID> -o pid,command
```

### Reiniciar el servidor Next

```bash
kill <PID>
cd /Users/rolmov/Documents/github/Toolyo/development
npm run dev
```

## 6.1 Depuración en IDE (VS Code)

Sí, se puede depurar tanto el backend como el frontend desde VS Code.

### Backend / servidor Next.js

La forma más práctica es arrancar el servidor con inspector Node activo y poner breakpoints en:
- `src/server/**`
- `src/server/api/**`
- `src/components/**` si el componente es cliente

Ejemplo de arranque manual:

```bash
cd /Users/rolmov/Documents/github/Toolyo/development
NODE_OPTIONS=--inspect npm run dev
```

Luego en VS Code puedes usar una configuración de tipo Node/Attach al puerto `9229`.

### Frontend / navegador

Para depurar React en el navegador:
- usa una configuración de VS Code tipo `pwa-chrome` o `pwa-msedge`
- abre `http://localhost:3000`
- coloca breakpoints en componentes cliente y en handlers de formulario

Si necesitas seguir el flujo visualmente, usa también las DevTools del navegador:
- pestaña `Sources` para breakpoints
- pestaña `Network` para peticiones a tRPC
- pestaña `Console` para errores de render o fetch

### Qué mirar en cada caso

- Backend: errores de Prisma, tRPC, validación Zod, acceso a variables de entorno, mutaciones y servicios.
- Frontend: estado del formulario, navegación, errores de React, mensajes de validación y llamadas al cliente tRPC.

### Ver logs del servidor

Si lo iniciaste en terminal, mira esa salida directamente. Si necesitas repetirlo:

```bash
cd /Users/rolmov/Documents/github/Toolyo/development
npm run dev
```

### Diagnóstico de errores habituales

- `409` al registrar: el correo ya existe en `User`.
- `relation ... does not exist`: faltan migraciones o la base está vacía.
- `Unique constraint` en Prisma: hay datos duplicados en tablas con `@unique`.
- Contenedor `toolyo_postgres` en conflicto: usa `docker rm -f toolyo_postgres` y relanza Compose.
- Warning de Tailwind sobre `content`: revisa `tailwind.config.ts` si el CSS no compila como esperas.

## 7. Variables de entorno

Archivo principal: `.env`

Variables importantes:

```bash
DATABASE_URL
EMAIL_PROVIDER
RESEND_API_KEY
RESEND_FROM
SMS_PROVIDER
SMS_OTP_ENABLED
KYC_PROVIDER
OTP_SECRET
```

### Correo OTP real

```bash
EMAIL_PROVIDER="resend"
RESEND_API_KEY="..."
RESEND_FROM="Toolyo <noreply@toolyo.com>"
```

## 8. Flujo recomendado para trabajar

### Empezar una sesión

```bash
cd /Users/rolmov/Documents/github/Toolyo
docker compose -f development/docker-compose.yml up -d
cd development
npm run dev
```

### Cuando cambias Prisma

```bash
cd /Users/rolmov/Documents/github/Toolyo/development
npm run db:generate
npm run db:migrate
```

### Cuando cambias UI o lógica de auth

```bash
cd /Users/rolmov/Documents/github/Toolyo/development
npm run lint
npx tsc --noEmit
```

## 9. Atajos de diagnóstico de datos

```bash
docker exec -i toolyo_postgres psql -U toolyo -d toolyo -c "select count(*) from \"User\";"
docker exec -i toolyo_postgres psql -U toolyo -d toolyo -c "select id, \"emailNormalized\" from \"User\" order by \"createdAt\" desc;"
docker exec -i toolyo_postgres psql -U toolyo -d toolyo -c "select * from \"VerificationState\" order by \"createdAt\" desc;"
```

## 10. Qué revisar si algo falla

1. `docker ps` para ver si PostgreSQL está arriba.
2. `lsof -iTCP:3000 -sTCP:LISTEN -n -P` para ver si Next está escuchando.
3. `npm run db:migrate` si faltan tablas o la base quedó desalineada.
4. `npx tsc --noEmit` para errores de tipos.
5. `npm run lint` para errores de estilo o hooks.

## 11. Resumen de depuración IDE

- Backend: arranca con `NODE_OPTIONS=--inspect npm run dev` y adjunta VS Code al puerto `9229`.
- Frontend: usa launch en navegador desde VS Code o Chrome/Edge DevTools.
- Si no ves breakpoints, confirma que estás usando el workspace `development` y no la raíz del repo.
