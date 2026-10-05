# Quickstart de validación: Aplicación Móvil Multiplataforma

Guía para validar de extremo a extremo que Toolyo funciona en web, Android e iPhone desde un único código y que el pipeline genera artefactos nativos.

## Prerrequisitos

- Node.js 20 y dependencias instaladas en `development/`.
- Para Android: JDK 17 y Android SDK (o Android Studio).
- Para iOS: macOS con Xcode y CocoaPods.
- Cuenta con acceso al repositorio para lanzar el workflow de GitHub Actions.
- Un despliegue web accesible (local o de pruebas) que el shell pueda cargar.

## Instalación y sincronización del shell

```bash
cd development
npm install

# Añadir los proyectos nativos (una sola vez; se versionan)
npx cap add android
npx cap add ios

# Sincronizar web + plugins tras cada cambio de configuración o dependencias
npx cap sync
```

Revisar `capacitor.config.ts` antes de compilar: `server.url` se alimenta de `MOBILE_SERVER_URL` y `cleartext` debe ser `false` salvo en builds internas/de desarrollo.

## Configurar el endpoint (incluida la red local)

```bash
cd development

# Endpoint público (HTTPS)
MOBILE_SERVER_URL="https://toolyo.example.com" npx cap sync

# Endpoint solo accesible desde la red local (intranet) — builds internas
MOBILE_SERVER_URL="http://192.168.1.50:3000" MOBILE_ALLOW_CLEARTEXT=true npx cap sync
```

Reglas:

- La dirección se define en **un único punto** (`MOBILE_SERVER_URL`); no se edita código para cambiarla.
- En builds internas puede ajustarse además en tiempo de ejecución desde los ajustes de la app, sin recompilar.
- HTTP en claro solo se admite en builds internas/de desarrollo (`network_security_config.xml` en Android, `NSAllowsLocalNetworking` en iOS); en producción se exige HTTPS.
- Si el dispositivo no está en la red local, la app muestra "servicio no accesible" (distinto de "sin conexión") y permite corregir la dirección.

## Validación estática y tests

```bash
cd development
npm run lint
npm test -- native
npx playwright test tests/e2e/mobile
npm run build
```

## Compilación nativa local (opcional)

```bash
# Android
cd development/android && ./gradlew assembleDebug

# iOS (solo macOS)
cd development/ios/App && xcodebuild -scheme App -configuration Debug -sdk iphonesimulator build
```

## Generación de artefactos en GitHub

```text
Actions → "Mobile Builds" → Run workflow
  - Seleccionar la rama/commit.
  - Indicar `server_url` (endpoint, admite dirección de red local) y `allow_cleartext` si es una build interna.
  - Ejecutar y esperar los jobs Android e iOS.
```

Para una versión concreta, crear un tag `v*.*.*`: el workflow genera los artefactos y los adjunta a la release.

Descargar desde la ejecución (o desde la release) los artefactos `toolyo-android-<version>` y `toolyo-ios-<version>`, y comprobar que incluyen versión, plataforma, fecha y estado de firma.

## Escenarios mínimos

1. **Paridad entre plataformas (US1)**: iniciar sesión en web, Android e iPhone con la misma cuenta; comprobar que búsqueda, detalle, reservas, mensajería, reviews y perfil muestran los mismos datos. Enviar un mensaje en móvil y verlo en web en menos de 1 minuto (SC-002).
2. **Generación de builds (US2)**: lanzar el workflow sobre una versión válida y comprobar que produce APK y artefacto iOS descargables; forzar un fallo y comprobar que la ejecución se marca fallida sin artefacto incompleto (SC-003).
3. **Experiencia móvil (US3)**: recorrer en un dispositivo con notch/barra de gestos los flujos de búsqueda, detalle, reserva y mensajería; verificar que no hay contenido cortado, que el gesto/botón "atrás" del sistema funciona y que se puede añadir una foto con cámara o galería (SC-005).
4. **Enlaces profundos y sesión (US4)**: compartir un enlace a un listing, abrirlo con y sin sesión, y comprobar que abre el listing correcto y redirige tras el login; cerrar y reabrir la app y verificar que la sesión persiste (SC-006).
5. **Notificaciones y offline (US5)**: habilitar notificaciones, recibir un mensaje con la app en segundo plano y abrir la conversación desde el aviso; después desactivar la red y comprobar el estado "sin conexión" sin pérdida de datos (SC-006 relacionado con FR-011/FR-012).
6. **Seguridad y alcance (FR-013, FR-014)**: verificar que una ruta protegida exige las mismas comprobaciones que en web y que el backoffice no es un destino de la app móvil (SC-007).
7. **Endpoint configurable y red local (FR-016, FR-017)**: generar una build interna apuntando a una dirección de la intranet y comprobar que la app carga los servicios; cambiar la dirección desde los ajustes (runtime) sin recompilar; sacar el dispositivo de la red local y verificar el estado "servicio no accesible"; confirmar que una build de producción rechaza HTTP en claro y no permite override.

## Validación en dispositivo real

- **Android**: instalar el APK (`adb install <archivo>.apk`) con "orígenes desconocidos" permitido.
- **iOS**: instalar el artefacto según el método de firma disponible; si la build es de simulador o sin firmar, **no** es instalable en dispositivo físico. Documentar en la release el estado de firma y el método admitido.

## Referencias

- Modelo de datos: [data-model.md](./data-model.md)
- Contratos (shell, enlaces, push, artefactos): [contracts/mobile-platform.md](./contracts/mobile-platform.md)
- Investigación y decisiones: [research.md](./research.md)
- Requisitos: [spec.md](./spec.md)
