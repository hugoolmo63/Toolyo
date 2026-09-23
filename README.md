# Toolyo — Plataforma de Alquiler P2P de Herramientas y Equipamiento

Toolyo es una plataforma P2P (Peer-to-Peer) para el alquiler seguro de herramientas y equipamiento entre particulares y profesionales. Este repositorio contiene la arquitectura backend y frontend construida con Next.js App Router, tRPC, Prisma y PostgreSQL con `pgvector`.

## 🚀 Stack Tecnológico

- **Frontend & Framework:** Next.js 14+ (App Router), React, Tailwind CSS, Zod.
- **API & Type-Safety:** tRPC v11 (release candidate) + React Query para comunicación end-to-end tipada.
- **Base de Datos & Búsqueda:** PostgreSQL 15 + Prisma ORM + `pgvector` (búsqueda vectorial/semántica) + PostGIS.
- **Almacenamiento:** S3 / Cloudflare R2 con URLs prefirmadas para subida de adjuntos e imágenes.
- **Notificaciones:** Email asíncrono con Resend / `EmailProvider`, sin bloquear la persistencia de mensajes.
- **Testing & Calidad:** Vitest (unitarios + integración con Testcontainers), Playwright (E2E), TypeScript Strict.
- **Auditoría & Seguridad:** Triggers inmutables en PostgreSQL (`BookingStatusHistory`) y control de acceso basado en atributos (ABAC).

---

## 📁 Estructura del Proyecto y Módulos Core

El código de la aplicación vive en `development/src/` siguiendo una arquitectura limpia por capas (`domain`, `shared`, `infrastructure`, `application`, `presentation`):

- `src/features/bookings/`: lógica de reservas atómicas, desgloses financieros con `Decimal`, autorización por recurso y transiciones de estado auditables.
- `src/features/messaging/`: sistema de chat Serverless sobre tRPC, historial persistente, adjuntos S3/R2 e indicadores de lectura.
- `src/features/search/`: búsqueda semántica híbrida (texto + embeddings vectoriales con `pgvector`) y filtros geográficos.
- `src/features/listing-management/`: gestión de publicaciones de productos, fotografías y disponibilidad.
- `src/features/listing-detail/`: detalle público de producto, galería, calendario, precios y acciones de reserva/contacto.
- `src/features/notifications/`: servicio de notificaciones email asíncronas para nuevos mensajes.

La mensajería no mantiene conexiones WebSocket globales. `messaging.sendMessage`, `messaging.listMessages`, `messaging.markRead` y `messaging.getUnreadCount` se consumen mediante tRPC; la interfaz puede usar actualización optimista y polling limitado mientras el chat está activo.

---

## 🛠️ Arranque Rápido

### 1. Requisitos Previos

- Node.js 18+ (Node.js 20 recomendado).
- Docker y Docker Compose para PostgreSQL + `pgvector` + PostGIS.

### 2. Instalación y Configuración

```bash
cd development
npm install
cp .env.example .env
```

### 3. Base de Datos y Semillas

```bash
# Levantar PostgreSQL con pgvector y PostGIS
docker compose up -d db

# Validar/generar el cliente Prisma
npx prisma generate
npx prisma validate

# Ejecutar migraciones, incluidos los triggers de auditoría
npx prisma migrate dev

# Poblar datos deterministas de prueba
npx prisma db seed
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🧪 Suite de Pruebas y Validación

Todos los comandos se ejecutan desde `development/`:

```bash
cd development

# Tests unitarios de lógica de dominio y servicios
npm test

# Tests de integración con PostgreSQL real en Testcontainers
npm run test:integration

# Verificación global de tipos TypeScript
npx tsc --noEmit

# Validación del schema Prisma y estado de migraciones
npx prisma validate
npx prisma migrate status
```

Los tests de integración requieren Docker y utilizan la imagen PostgreSQL de pruebas con `pgvector` y PostGIS. En CI, el workflow construye la imagen `toolyo-postgres:15-pgvector-postgis` antes de ejecutar Testcontainers.

---

## 📑 Especificaciones y Documentación

Las especificaciones ejecutables organizadas por módulos se encuentran en `specs/`:

- [`specs/007-modulo-mensajeria/`](specs/007-modulo-mensajeria/): especificación funcional, contratos tRPC Serverless, modelo de datos, investigación y guía de validación de mensajería.
- [`specs/008-modulo-reservas/`](specs/008-modulo-reservas/): ciclo de vida de reservas, contratos `bookingRouter`, modelo `Booking`, auditoría inmutable, tareas de implementación y mapa UX/UI [`ux-ui-flow.md`](specs/008-modulo-reservas/ux-ui-flow.md).
- [`docs/04-especificaciones-funcionales.md`](docs/04-especificaciones-funcionales.md): requisitos funcionales globales del producto.
- [`constitution/`](constitution/): principios obligatorios de backend, base de datos, seguridad, frontend, diseño y testing.

---

## 🔐 Seguridad y Datos

- Todas las mutaciones tRPC requieren autenticación y autorización por recurso.
- El renter se deriva de la sesión; el owner se obtiene desde el listing o la reserva.
- Los mensajes y adjuntos se persisten antes de enviar notificaciones.
- Los bytes de imágenes no se almacenan en PostgreSQL; se guardan metadatos y claves de almacenamiento.
- `BookingStatusHistory` se protege con un trigger PostgreSQL que impide modificar o eliminar transiciones históricas.
- Las credenciales y claves de proveedores deben configurarse mediante variables de entorno; no deben incluirse en el repositorio.
