# Data Model: Aplicación Móvil Multiplataforma (Web + Android + iPhone)

**Fuente actual**: `development/prisma/schema.prisma`  
**Nota**: Define el diseño de la migración; no modifica el schema por sí mismo.

## 1. Alcance de datos

La feature reutiliza el modelo existente (usuarios, sesiones, listings, reservas, mensajería, reviews, notificaciones) sin cambios. La única persistencia nueva necesaria es el **registro de tokens de dispositivo** para enviar notificaciones push (FR-012). El resto de entidades del spec son conceptos de plataforma y de CI, no tablas.

## 2. Nueva entidad: `DevicePushToken`

```prisma
enum MobilePlatform {
  android
  ios
}

model DevicePushToken {
  id                   String         @id @default(cuid())
  userId               String
  platform             MobilePlatform
  token                String         @unique @db.VarChar(512)
  deviceId             String?        @db.VarChar(191)
  appVersion           String?        @db.VarChar(40)
  osVersion            String?        @db.VarChar(40)
  locale               String?        @db.VarChar(20)
  notificationsEnabled Boolean        @default(true)
  lastSeenAt           DateTime?      @db.Timestamptz(6)
  revokedAt            DateTime?      @db.Timestamptz(6)
  createdAt            DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt            DateTime       @updatedAt @db.Timestamptz(6)
  user                 User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceId, platform])
  @@index([userId, revokedAt])
  @@index([platform, notificationsEnabled])
  @@index([lastSeenAt])
}
```

Relación en `User`:

```prisma
model User {
  // campos existentes...
  devicePushTokens DevicePushToken[]
}
```

### Reglas del token

- El `token` es un identificador opaco emitido por FCM/APNs; nunca se registra en logs ni se expone a otros usuarios.
- Un mismo usuario puede tener varios dispositivos/plataformas; la unicidad lógica es `(userId, deviceId, platform)`.
- El registro y la revocación solo pueden afectar a tokens del propio usuario autenticado (autorización por recurso, `SECURITY.md` §3.2).
- Un token inválido o rechazado por el proveedor se marca `revokedAt` y se deja de usar; no se borra para conservar trazabilidad.

### Transiciones de estado

| Estado | Evento | Resultado |
|---|---|---|
| (inexistente) | El usuario habilita notificaciones en la app | Se crea el token activo (`revokedAt = null`). |
| activo | El usuario abre la app | Se actualiza `lastSeenAt` y, si cambió, `appVersion`/`osVersion`. |
| activo | El proveedor responde token inválido | `revokedAt` establecido; se deja de enviar. |
| activo | El usuario deniega notificaciones | `notificationsEnabled = false` (o `revokedAt` si el sistema invalida el token). |
| revocado | El usuario vuelve a habilitar notificaciones | Se reactiva (`revokedAt = null`, `notificationsEnabled = true`). |
| activo/revocado | El usuario elimina su cuenta | Cascade delete (igual que `Session`). |

## 3. Entidades conceptuales (sin tabla)

Estas entidades aparecen en el spec pero no se persisten en PostgreSQL; se documentan para trazabilidad del diseño:

- **Artefacto de build nativo**: entregable generado por `.github/workflows/mobile.yml` (APK o archivo/iOS). Metadatos: plataforma, versión, fecha, resultado. Vive en la ejecución de GitHub Actions y en la release, no en la base de datos.
- **Perfil de plataforma**: particularidades de web/Android/iOS (áreas seguras, permisos, capacidades). Es configuración del código (`capacitor.config.ts`, manifests, `Info.plist`), no un registro.
- **Enlace profundo**: URL que resuelve a una ruta interna. Su contrato se define en `contracts/mobile-platform.md`; no requiere persistencia.
- **Notificación**: aviso del sistema operativo derivado de un evento de negocio (por ejemplo, mensaje nuevo). Se apoya en el servicio de `notifications` existente y en `DevicePushToken`; no crea una tabla nueva.

## 4. Relaciones

| Entidad | Relación | Regla |
|---|---|---|
| `User` | `1—N DevicePushToken` | Solo el propio usuario gestiona sus tokens; cascade al eliminar cuenta. |
| `DevicePushToken` | `N—1` proveedor (FCM/APNs) | El `token` es único; el proveedor se deduce de `platform`. |
| `Message` | evento → notificación | La persistencia del mensaje precede al envío push (patrón existente). |

## 5. Constraints y validación

- Inputs tRPC de registro/revocación validan con Zod: `platform` en `MobilePlatform`, `token` con longitud máxima 512, `deviceId`/`appVersion`/`osVersion`/`locale` con longitudes acotadas.
- El `userId` se deriva de la sesión, nunca del cliente.
- El envío push se ejecuta tras persistir el evento y nunca bloquea la operación de negocio; si el proveedor falla, se registra sin afectar al mensaje.
- No se guardan datos personales adicionales del dispositivo más allá de los campos listados.
- Migración incremental y revisable: solo crea el enum `MobilePlatform`, la tabla `DevicePushToken` y la relación en `User`; no altera datos existentes.
