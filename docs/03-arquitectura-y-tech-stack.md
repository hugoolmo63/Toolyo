# Arquitectura y Stack Tecnológico

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTES                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Web App   │  │  iOS App    │  │ Android App │  │  Admin Dashboard│ │
│  │  (Next.js)  │  │(React Native)│  │(React Native)│  │   (Next.js)    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                │                  │          │
│         └────────────────┴────────────────┘                  │          │
│                          │                                   │          │
│                    ┌─────┴─────┐                    ┌────────┴────────┐ │
│                    │   CDN     │                    │   CDN (Admin)   │ │
│                    │  (Vercel) │                    │   (Vercel)      │ │
│                    └─────┬─────┘                    └─────────────────┘ │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────────┐
│                          ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API GATEWAY                              │   │
│  │                    (Next.js API Routes / tRPC)                   │   │
│  │  • Rate Limiting  • Auth Middleware  • Request Validation       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│  ┌───────────────────────────────┼───────────────────────────────────┐ │
│  │                               ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │                    APPLICATION LAYER                         │ │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │ │ │
│  │  │  │  Auth    │ │ Listings │ │ Bookings │ │    Payments    │ │ │ │
│  │  │  │  Service │ │  Service │ │  Service │ │    Service     │ │ │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │ │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │ │ │
│  │  │  │  Search  │ │ Messaging│ │  Reviews │ │   Insurance    │ │ │ │
│  │  │  │  Service │ │  Service │ │  Service │ │    Service     │ │ │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │                               │                                   │ │
│  │  ┌────────────────────────────┼────────────────────────────────┐  │ │
│  │  │                            ▼                                │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐   │  │ │
│  │  │  │                  DATA LAYER                          │   │  │ │
│  │  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │   │  │ │
│  │  │  │  │PostgreSQL│  │  Redis  │  │Elastic- │  │  S3    │ │   │  │ │
│  │  │  │  │(Prisma) │  │ (Cache) │  │ search  │  │(Images)│ │   │  │ │
│  │  │  │  └─────────┘  └─────────┘  └─────────┘  └────────┘ │   │  │ │
│  │  │  └─────────────────────────────────────────────────────┘   │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     EXTERNAL SERVICES                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │   │
│  │  │  Stripe  │ │  Mapbox  │ │  Imgix   │ │  Insurance Partner │ │   │
│  │  │  /Adyen  │ │ /GMaps   │ │ /Cloudin.│ │  (API Integration) │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológico Recomendado

### 2.1 Frontend
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Web Framework** | Next.js 14+ (App Router) | SSR/SSG para SEO, API routes, React Server Components. Hygglo usa Next.js. |
| **UI Framework** | Tailwind CSS + shadcn/ui | Desarrollo rápido, diseño consistente, accesibilidad. |
| **Mobile** | React Native + Expo | Code sharing con web, despliegue rápido en iOS/Android. Hygglo usa React Native Web. |
| **State Management** | Zustand + React Query (TanStack Query) | Cacheo de servidor, sincronización de estado, offline support. |
| **Maps** | Mapbox GL JS / React Map GL | Mejor pricing que Google Maps, estilos personalizables. |
| **Forms** | React Hook Form + Zod | Validación tipada, performance en formularios complejos. |

### 2.2 Backend
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Runtime** | Node.js 20+ LTS | Ecosistema maduro, same language en full stack. |
| **Framework** | Next.js API Routes + tRPC | End-to-end type safety, excellent DX. |
| **ORM** | Prisma | Type-safe queries, migrations, excellent PostgreSQL support. |
| **Auth** | NextAuth.js / Auth.js + OAuth2 | Gestión de sesiones, providers sociales, JWT. |
| **Validation** | Zod | Validación en runtime compartida entre frontend y backend. |

### 2.3 Base de Datos y Storage
| Servicio | Tecnología | Uso |
|----------|-----------|-----|
| **Base de datos principal** | PostgreSQL 15+ | Datos transaccionales (usuarios, productos, reservas). |
| **Cache + Sesiones** | Redis (Upstash / Redis Cloud) | Cache de queries, rate limiting, pub/sub para chat. |
| **Búsqueda full-text** | Elasticsearch / Meilisearch | Búsqueda geolocalizada, filtros, autocompletado. |
| **Object Storage** | AWS S3 / Cloudflare R2 | Imágenes de productos, documentos KYC. |
| **CDN de imágenes** | Imgix / Cloudinary | Optimización on-the-fly, thumbnails, formatos modernos (WebP/AVIF). |

### 2.4 Infraestructura y DevOps
| Capa | Tecnología |
|------|-----------|
| **Hosting** | Vercel (frontend + API) |
| **Base de datos** | Supabase / AWS RDS / Railway |
| **CI/CD** | GitHub Actions |
| **Monitoreo** | Vercel Analytics, Sentry (errores), Logtail (logs) |
| **Tests** | Vitest (unit), Playwright (e2e) |

### 2.5 Servicios Externos (3rd Party)
| Servicio | Proveedores sugeridos | Función |
|----------|----------------------|---------|
| **Pagos** | Stripe Connect / Adyen Marketplace | Split payments, holds, payouts a arrendadores, SCA/PSD2. |
| **KYC/Verificación** | Onfido / Veriff / SumSub | Verificación de identidad, liveness detection, cumplimiento AML. |
| **Seguros** | Integración API con aseguradora (Pelayo/AXA/Mapfre) | Contratación on-demand de seguro por alquiler. |
| **Email** | Resend / SendGrid / Mailgun | Emails transaccionales (reservas, recordatorios, marketing). |
| **SMS/Push** | Twilio / Firebase Cloud Messaging | Notificaciones móviles y SMS. |
| **Geocoding** | Mapbox Geocoding API / Google Geocoding | Conversión dirección → coordenadas y viceversa. |
| **Analytics** | Mixpanel / Amplitude | Funnels, cohortes, event tracking. |

---

## 3. Modelo de Datos (ER Diagram Conceptual)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │   Listing    │       │   Product    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)      │
│ email        │  │    │ slug (UQ)    │  │    │ name         │
│ name         │  │    │ title        │  │    │ description  │
│ phone        │  │    │ description  │  └───>│ categoryId   │
│ avatarUrl    │  │    │ status       │       │ ownerId (FK) │
│ verified     │  │    │ productId(FK)│       │ images[]     │
│ ratingAvg    │  │    │ locationGeo  │       │ prices[]     │
│ currency     │  │    │ minDays      │       │ minDays      │
│ createdAt    │  │    │ createdAt    │       │ badges       │
└──────────────┘  │    └──────────────┘       └──────────────┘
                  │           │
                  │           │ 1:N
                  │           ▼
                  │    ┌──────────────┐
                  │    │   Booking    │
                  │    ├──────────────┤
                  │    │ id (PK)      │
                  │    │ listingId(FK)│
                  │    │ renterId(FK) │───────┐
                  │    │ startDate    │       │
                  │    │ endDate      │       │
                  │    │ totalPrice   │       │
                  │    │ status       │       │
                  │    │ paymentId    │       │
                  │    │ createdAt    │       │
                  │    └──────────────┘       │
                  │                           │
                  │    ┌──────────────┐       │
                  └───>│   Review     │<──────┘
                       ├──────────────┤
                       │ id (PK)      │
                       │ bookingId(FK)│
                       │ reviewerId   │
                       │ revieweeId   │
                       │ rating       │
                       │ comment      │
                       │ createdAt    │
                       └──────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Category    │       │   Message    │       │   Payment    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ name         │       │ bookingId(FK)│       │ bookingId(FK)│
│ slug (UQ)    │       │ senderId(FK) │       │ stripeId     │
│ parentId(FK) │       │ content      │       │ amount       │
│ insuranceInfo│       │ createdAt    │       │ platformFee  │
│ showInNav    │       └──────────────┘       │ ownerPayout  │
│ reviewStats  │                              │ status       │
└──────────────┘                              │ createdAt    │
                                              └──────────────┘

┌──────────────┐       ┌──────────────┐
│   Location   │       │  Favorite    │
├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │
│ name         │       │ userId (FK)  │
│ slug (UQ)    │       │ listingId(FK)│
│ parentName   │       │ createdAt    │
│ coordinates  │       └──────────────┘
│ hierarchy    │
└──────────────┘
```

---

## 4. Consideraciones de Escalabilidad

### 4.1 Lectura vs. Escritura
- **Alto volumen de lecturas**: Búsquedas, listados, detalles de producto. Solución: caching agresivo con Redis, CDN de imágenes, y Elasticsearch para búsquedas.
- **Bajo volumen de escrituras**: Creación de listings, reservas, pagos. Solución: PostgreSQL con índices optimizados.

### 4.2 Geo-queries
- Uso de PostGIS para consultas geoespaciales (productos dentro de X km).
- Índices GiST/GIN en campos de geometría para performance.

### 4.3 Imágenes
- Upload directo a S3 con presigned URLs.
- Procesamiento asíncrono: thumbnails, compresión, formato WebP/AVIF.
- Nomenclatura versionada para cache busting.

### 4.4 Pagos
- Uso de Stripe Connect con **destination charges**: el cliente paga a la plataforma, y Stripe transfiere el pago al arrendador (menos comisión) automáticamente.
- Webhooks para manejar estados asíncronos (pago confirmado, dispute, refund).

---

## 5. Seguridad

| Capa | Medida |
|------|--------|
| **Transporte** | TLS 1.3 en todas las conexiones. |
| **Autenticación** | JWT con refresh tokens, OAuth 2.0 (Google, Apple). |
| **Autorización** | RBAC con niveles de confianza: admin, user (registrado), verified_user, super_owner. |
| **Datos sensibles** | Encriptación en reposo (AES-256), tokenización de tarjetas (Stripe). |
| **Validación** | Rate limiting en APIs, validación estricta con Zod, sanitización de inputs. |
| **Privacidad** | Cumplimiento GDPR (derecho al olvido, portabilidad de datos). |
| **KYC** | Verificación de identidad escalonada: opcional para uso básico (publicar/alquilar). Obligatoria para acceder a seguro de plataforma, reservas instantáneas y transacciones que superen umbrales AML (>1.000€/año o >10 transacciones/año). |
