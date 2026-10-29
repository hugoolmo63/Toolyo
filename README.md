<a id="top"></a>

# Toolyo — Plataforma de Alquiler P2P de Herramientas y Equipamiento

> 🌐 **Español** | [English](#english)

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

- [`specs/009-modulo-mensajeria/`](specs/009-modulo-mensajeria/): especificación funcional, contratos tRPC Serverless, modelo de datos, investigación y guía de validación de mensajería.
- [`specs/010-modulo-reservas/`](specs/010-modulo-reservas/): ciclo de vida de reservas, contratos `bookingRouter`, modelo `Booking`, auditoría inmutable, tareas de implementación y mapa UX/UI [`ux-ui-flow.md`](specs/010-modulo-reservas/ux-ui-flow.md).
- [`docs/04-especificaciones-funcionales.md`](docs/04-especificaciones-funcionales.md): requisitos funcionales globales del producto.
- [`constitution/`](constitution/): principios obligatorios de backend, base de datos, seguridad, frontend, diseño y testing.

---

## 📱 App Móvil (Android + iPhone)

La misma aplicación se entrega en web, Android e iPhone desde un único código mediante
**Capacitor** sobre la app Next.js (ver [`specs/014-app-movil-multiplataforma/`](specs/014-app-movil-multiplataforma/)):

- El shell nativo carga el despliegue web configurado en `MOBILE_SERVER_URL` (un único punto de
  configuración; admite direcciones de red local en builds internas).
- Capacidades nativas: cámara/galería, geolocalización, notificaciones push, enlaces profundos y
  estado de red.
- GitHub Actions genera los artefactos internos (APK Android y archivo/iOS) mediante el workflow
  **Mobile Builds**; no se publican automáticamente en tiendas.

```bash
cd development
# Requiere Node.js >= 22 para los comandos de Capacitor
npm run cap:sync          # sincroniza el shell
npm run build:android     # APK debug
npm run build:ios         # .app de simulador (requiere macOS)
```

El backoffice administrativo (`/admin`) permanece como herramienta web.

---

## 🔐 Seguridad y Datos

- Todas las mutaciones tRPC requieren autenticación y autorización por recurso.
- El renter se deriva de la sesión; el owner se obtiene desde el listing o la reserva.
- Los mensajes y adjuntos se persisten antes de enviar notificaciones.
- Los bytes de imágenes no se almacenan en PostgreSQL; se guardan metadatos y claves de almacenamiento.
- `BookingStatusHistory` se protege con un trigger PostgreSQL que impide modificar o eliminar transiciones históricas.
- Las credenciales y claves de proveedores deben configurarse mediante variables de entorno; no deben incluirse en el repositorio.

---

<a id="english"></a>

# Toolyo — P2P Tool & Equipment Rental Platform

> 🌐 [Español](#top) | **English**

Toolyo is a P2P (Peer-to-Peer) platform for securely renting tools and equipment between individuals and professionals. This repository contains the backend and frontend architecture built with Next.js App Router, tRPC, Prisma and PostgreSQL with `pgvector`.

## 🚀 Tech Stack

- **Frontend & Framework:** Next.js 14+ (App Router), React, Tailwind CSS, Zod.
- **API & Type-Safety:** tRPC v11 (release candidate) + React Query for end-to-end typed communication.
- **Database & Search:** PostgreSQL 15 + Prisma ORM + `pgvector` (vector/semantic search) + PostGIS.
- **Storage:** S3 / Cloudflare R2 with presigned URLs for uploading attachments and images.
- **Notifications:** Asynchronous email with Resend / `EmailProvider`, without blocking message persistence.
- **Testing & Quality:** Vitest (unit + integration with Testcontainers), Playwright (E2E), Strict TypeScript.
- **Audit & Security:** Immutable PostgreSQL triggers (`BookingStatusHistory`) and attribute-based access control (ABAC).

---

## 📁 Project Structure and Core Modules

The application code lives in `development/src/` following a clean layered architecture (`domain`, `shared`, `infrastructure`, `application`, `presentation`):

- `src/features/bookings/`: atomic booking logic, financial breakdowns with `Decimal`, resource-level authorization and auditable state transitions.
- `src/features/messaging/`: serverless chat system over tRPC, persistent history, S3/R2 attachments and read indicators.
- `src/features/search/`: hybrid semantic search (text + vector embeddings with `pgvector`) and geographic filters.
- `src/features/listing-management/`: product listing management, photos and availability.
- `src/features/listing-detail/`: public product detail, gallery, calendar, pricing and booking/contact actions.
- `src/features/notifications/`: asynchronous email notification service for new messages.

Messaging does not maintain global WebSocket connections. `messaging.sendMessage`, `messaging.listMessages`, `messaging.markRead` and `messaging.getUnreadCount` are consumed via tRPC; the UI can use optimistic updates and limited polling while the chat is active.

---

## 🛠️ Quick Start

### 1. Prerequisites

- Node.js 18+ (Node.js 20 recommended).
- Docker and Docker Compose for PostgreSQL + `pgvector` + PostGIS.

### 2. Installation and Setup

```bash
cd development
npm install
cp .env.example .env
```

### 3. Database and Seeds

```bash
# Start PostgreSQL with pgvector and PostGIS
docker compose up -d db

# Validate/generate the Prisma client
npx prisma generate
npx prisma validate

# Run migrations, including audit triggers
npx prisma migrate dev

# Seed deterministic test data
npx prisma db seed
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Test Suite and Validation

All commands run from `development/`:

```bash
cd development

# Unit tests for domain logic and services
npm test

# Integration tests against real PostgreSQL in Testcontainers
npm run test:integration

# Global TypeScript type check
npx tsc --noEmit

# Prisma schema validation and migration status
npx prisma validate
npx prisma migrate status
```

Integration tests require Docker and use the test PostgreSQL image with `pgvector` and PostGIS. In CI, the workflow builds the `toolyo-postgres:15-pgvector-postgis` image before running Testcontainers.

---

## 📑 Specifications and Documentation

Executable specifications organized by module live in `specs/`:

- [`specs/009-modulo-mensajeria/`](specs/009-modulo-mensajeria/): functional specification, serverless tRPC contracts, data model, research and messaging validation guide.
- [`specs/010-modulo-reservas/`](specs/010-modulo-reservas/): booking lifecycle, `bookingRouter` contracts, `Booking` model, immutable audit, implementation tasks and UX/UI map [`ux-ui-flow.md`](specs/010-modulo-reservas/ux-ui-flow.md).
- [`docs/04-especificaciones-funcionales.md`](docs/04-especificaciones-funcionales.md): global product functional requirements.
- [`constitution/`](constitution/): mandatory backend, database, security, frontend, design and testing principles.

---

## 📱 Mobile App (Android + iPhone)

The same application ships to web, Android and iPhone from a single codebase via
**Capacitor** on top of the Next.js app (see [`specs/014-app-movil-multiplataforma/`](specs/014-app-movil-multiplataforma/)):

- The native shell loads the web deployment configured in `MOBILE_SERVER_URL` (a single
  configuration point; local network addresses are supported in internal builds).
- Native capabilities: camera/gallery, geolocation, push notifications, deep links and
  network status.
- GitHub Actions produces the internal artifacts (Android APK and iOS archive) through the
  **Mobile Builds** workflow; they are not automatically published to stores.

```bash
cd development
# Requires Node.js >= 22 for Capacitor commands
npm run cap:sync          # syncs the shell
npm run build:android     # debug APK
npm run build:ios         # simulator .app (requires macOS)
```

The administrative backoffice (`/admin`) remains a web tool.

---

## 🔐 Security and Data

- All tRPC mutations require authentication and resource-level authorization.
- The renter is derived from the session; the owner is resolved from the listing or booking.
- Messages and attachments are persisted before notifications are sent.
- Image bytes are not stored in PostgreSQL; only metadata and storage keys are kept.
- `BookingStatusHistory` is protected by a PostgreSQL trigger that prevents modifying or deleting historical transitions.
- Credentials and provider keys must be configured via environment variables; they must not be committed to the repository.
