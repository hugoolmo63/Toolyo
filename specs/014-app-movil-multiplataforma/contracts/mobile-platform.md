# Contratos: Aplicación Móvil Multiplataforma (Web + Android + iPhone)

**Feature**: [spec.md](../spec.md)  
**Ámbito**: interfaces externas de la feature — configuración del shell, enlaces profundos, archivos de asociación, registro de notificaciones y artefactos de build.

---

## 1. Contrato de configuración del shell (Capacitor)

`development/capacitor.config.ts` es el contrato entre el frontend Next.js y los proyectos nativos.

```ts
export interface MobileShellConfig {
  appId: string;        // identificador de bundle, estable entre versiones
  appName: string;      // nombre visible en el dispositivo
  webDir: string;       // directorio de respaldo local del shell
  server?: {
    url: string;             // despliegue web del entorno que carga el shell
    cleartext?: boolean;     // solo true en builds locales de desarrollo
    allowNavigation: string[]; // dominios legítimos de navegación en el WebView
  };
  android: { allowMixedContent: boolean };
  ios: { contentInset: "always" | "automatic" | "never" };
}
```

**Reglas**:

- `appId` y `appName` son estables; cambiarlos invalida la instalación previa y los enlaces profundos.
- `server.url` se alimenta de **un único punto de configuración**: la variable `MOBILE_SERVER_URL` (con `.env` local y entrada del pipeline en CI). No se hardcodea ninguna dirección en el código.
- `server.url` depende del entorno: `http` con `cleartext: true` solo en builds internas/de desarrollo; `https` en pruebas y producción.
- `allowNavigation` incluye únicamente el dominio de la app y los dominios de autenticación/pago legítimos; nunca `*`.
- En producción `cleartext` es `false` y solo se admite HTTPS (alineado con `SECURITY.md` §4.2).

### 1.1 Endpoint configurable y disponibilidad en red local

| Aspecto | Contrato |
|---|---|
| Configuración base | `MOBILE_SERVER_URL` (una sola variable) define el endpoint con el que se genera el shell. |
| Override en runtime | Solo en builds internas: un archivo de configuración editable o pantalla de ajustes permite fijar/cambiar la dirección sin recompilar. En producción el override está deshabilitado. |
| Direcciones soportadas | URLs `https://` públicas y direcciones de red local (`http://192.168.x.x:3000`, `http://<host>.local:3000`, `http://10.x.x.x:3000`) en builds internas. |
| Android | `android/app/src/main/res/xml/network_security_config.xml` con `cleartextTrafficPermitted` acotado a los destinos locales; no se habilita cleartext global. |
| iOS | `NSAppTransportSecurity` con `NSAllowsLocalNetworking = true`; no se usa `NSAllowsArbitraryLoads`. |
| Producción | HTTPS obligatorio, sin excepciones de ATS/cleartext y sin override en runtime. |
| Estado de error | Si el endpoint solo es alcanzable desde la red local y el dispositivo está fuera de ella, la app muestra "servicio no accesible" (distinto de "sin conexión") y permite corregir la dirección. |

```ts
export interface MobileEndpointConfig {
  baseUrl: string;                 // valor por defecto generado desde MOBILE_SERVER_URL
  allowRuntimeOverride: boolean;   // true solo en builds internas
  allowCleartext: boolean;         // true solo en builds internas/de desarrollo
}
```

---

## 2. Contrato de enlaces profundos

### 2.1 Formato de URL

| Forma | Ejemplo | Uso |
|---|---|---|
| HTTPS (App Link / Universal Link) | `https://<dominio>/listings/<slug>?start=…&end=…` | Enlaces compartidos y navegación normal. |
| Esquema propio (respaldo) | `toolyo://listings/<slug>` | Pruebas internas cuando la asociación no está verificada. |

**Rutas internas reconocidas** (mismas que la app web):

- `/listings/<slug>` — detalle de listing.
- `/users/<id>` — perfil público.
- `/messages` y `/messages/<conversationId>` — conversaciones.
- `/search` — búsqueda con filtros en query string.

**Reglas**:

- Una ruta protegida sin sesión conserva el destino y se resuelve tras el login (FR-009).
- Una ruta inexistente o no publicada muestra el estado de error de la app, sin revelar información interna.
- El parseo del enlace es una función pura testeable (`src/lib/native/deep-link.ts`) que devuelve una ruta interna o `null`.

### 2.2 Esquema de asociación Android (`/.well-known/assetlinks.json`)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "<appId>",
      "sha256_cert_fingerprints": ["<huella-SHA256-del-certificado-de-firma>"]
    }
  }
]
```

### 2.3 Asociación iOS (`/.well-known/apple-app-site-association`)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["<TEAM_ID>.<appId>"],
        "components": [{ "/": "/listings/*", "comment": "Detalle de listing" }]
      }
    ]
  }
}
```

**Reglas**:

- Ambos archivos se sirven desde el dominio web mediante route handlers en `src/app/.well-known/`.
- La huella SHA-256 y el `TEAM_ID` se inyectan desde configuración/secretos de build; nunca se hardcodean valores de producción en el repositorio.
- Si la asociación no puede verificarse (builds internas sin firma), la app sigue funcionando con el esquema propio de respaldo.

---

## 3. Contrato de notificaciones push (tRPC)

Router `mobile` integrado en `server/api/root.ts`, protegido por autenticación. El `userId` se deriva de la sesión.

### 3.1 `mobile.registerDevice`

```ts
type RegisterDeviceInput = {
  platform: "android" | "ios";
  token: string;        // máx. 512
  deviceId?: string;    // máx. 191
  appVersion?: string;  // máx. 40
  osVersion?: string;   // máx. 40
  locale?: string;      // máx. 20
};

type RegisterDeviceOutput = {
  id: string;
  platform: "android" | "ios";
  notificationsEnabled: boolean;
};
```

- Idempotente por `(userId, deviceId, platform)`: si ya existe, actualiza `token`, `lastSeenAt` y metadatos y reactiva (`revokedAt = null`).
- No devuelve el token ni datos de otros dispositivos.

### 3.2 `mobile.revokeDevice`

```ts
type RevokeDeviceInput = { deviceId: string };
type RevokeDeviceOutput = { id: string; revokedAt: string };
```

- Solo puede revocar tokens del propio usuario; un `deviceId` ajeno devuelve `FORBIDDEN` sin filtrar existencia.

### 3.3 Envío (servidor)

- El servicio de `notifications` existente, tras persistir el mensaje, resuelve los tokens activos del destinatario y envía por FCM HTTP v1 (Android) o APNs (iOS).
- Un fallo del proveedor no revierte el mensaje y marca el token inválido como revocado.
- Ninguna respuesta tRPC incluye tokens ni credenciales del proveedor.

---

## 4. Contrato de artefactos de build nativos (GitHub Actions)

Workflow `.github/workflows/mobile.yml`.

### 4.1 Disparadores

| Disparador | Uso |
|---|---|
| `workflow_dispatch` | Generación manual de artefactos internos de prueba. |
| `push` sobre tags `v*.*.*` | Generación y adjunción a la release de la versión. |

**Entradas (`workflow_dispatch`)**:

| Entrada | Descripción |
|---|---|
| `server_url` | Endpoint (`MOBILE_SERVER_URL`) con el que se genera el shell; admite direcciones de red local en builds internas. |
| `allow_cleartext` | Habilita HTTP en claro para builds internas; por defecto `false`. |

### 4.2 Salidas (artefactos)

| Nombre | Plataforma | Contenido |
|---|---|---|
| `toolyo-android-<version>` | Android | APK (release si hay keystore; si no, build de desarrollo marcada). |
| `toolyo-ios-<version>` | iOS | Archivo `.app`/`.ipa` (firmado si hay certificado y provisioning; si no, build de simulador marcada). |

### 4.3 Metadatos por artefacto

- Versión (derivada del tag o del `version` del paquete).
- Plataforma.
- Fecha de generación.
- Estado de firma (`signed` / `unsigned`).
- Commit SHA.

### 4.4 Reglas

- Si una compilación falla, la ejecución se marca como fallida y **no** se publica un artefacto incompleto (FR-006).
- Los secretos de firma (`ANDROID_KEYSTORE_*`, `IOS_CERTIFICATE_*`, `IOS_PROVISIONING_PROFILE_*`, credenciales FCM/APNs) se leen de GitHub Secrets y nunca se escriben en artefactos ni logs (FR-005, `SECURITY.md` §7).
- Los artefactos no contienen `.env`, dumps ni claves privadas.
