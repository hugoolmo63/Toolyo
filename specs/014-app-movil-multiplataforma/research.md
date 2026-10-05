# Research: Aplicación Móvil Multiplataforma (Web + Android + iPhone)

**Feature**: [spec.md](./spec.md)  
**Fecha**: 2026-10-05

## Decision 1: Shell Capacitor con carga remota del despliegue web

- **Decision**: Usar Capacitor sobre la app Next.js existente y configurar los shells Android/iOS para cargar el despliegue web del entorno correspondiente (`server.url` apuntando al despliegue de desarrollo/pruebas/producción según build). El frontend, los Server Components, tRPC y Prisma permanecen en un único código; el WebView nativo consume la misma aplicación.
- **Rationale**: La app es server-first: usa React Server Components, route handlers tRPC, Prisma en servidor y cookies de sesión `HttpOnly`. No puede exportarse como sitio estático sin reescribir la capa de datos y de autenticación. Cargar el despliegue existente preserva la paridad total (FR-001, FR-002) y las garantías de seguridad (FR-013) con el mínimo cambio.
- **Alternatives considered**:
  - **Export estático (`output: 'export'`) + cliente puro**: rechazado; exigiría reescribir tRPC/Server Components, romper el modelo de sesión por cookie y duplicar la capa de datos.
  - **React Native + Expo** (lo propuesto en `docs/03`): rechazado para esta entrega; implicaría reescribir todas las vistas y mantener dos frontends, contradiciendo "un único código" y el alcance de paridad total.
  - **PWA + TWA/WKWebView manual**: rechazado; sin publicación real en App Store y con capacidades nativas limitadas.
- **Riesgo documentado**: cargar una URL remota en el shell nativo puede ser cuestionado por las políticas de revisión de Apple (mínima funcionalidad) y Google si algún día se publica en tiendas. Al distribuirse como **artefactos internos** (decisión del spec), no aplica hoy; queda registrado como riesgo para una futura publicación en tiendas.

## Decision 2: Versión y conjunto de plugins de Capacitor

- **Decision**: Adoptar la línea estable de Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`) y los plugins `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/push-notifications`, `@capacitor/app`, `@capacitor/network` y `@capacitor/status-bar`. Fijar versiones exactas en `package.json` y verificar que cada paquete lleva publicado al menos 7 días.
- **Rationale**: Son los plugins oficiales mantenidos por el equipo de Capacitor, cubren exactamente las capacidades nativas del MVP (FR-008, FR-009, FR-011, FR-012) y siguen el principio de menor superficie.
- **Alternatives considered**: plugins de la comunidad (mantenimiento incierto); implementar puentes nativos propios (coste y riesgo de seguridad innecesarios); `@capacitor/share` (útil pero no requerido por el spec; se puede añadir sin cambiar el diseño).

## Decision 3: Sesión y cookies dentro del WebView

- **Decision**: Mantener el modelo de sesión actual (cookie `HttpOnly`, `Secure`, `SameSite=Lax`). El shell carga el mismo origen remoto, por lo que las cookies viajan y persisten entre aperturas. Configurar `server.allowNavigation` para el dominio de la app y los dominios legítimos de autenticación/pago, sin permitir navegación arbitraria.
- **Rationale**: Evita reimplementar autenticación en nativo y conserva las garantías de `SECURITY.md`. FR-010 (conservar sesión) y FR-013 (mismas garantías) quedan cubiertos por el mecanismo existente.
- **Alternatives considered**: almacenar tokens en `localStorage` o en almacenamiento nativo (peor postura de seguridad y duplicaría el modelo); cookies propias en el shell (divergen de web).

## Decision 4: Enlaces profundos con App Links / Universal Links

- **Decision**: Usar App Links (Android) y Universal Links (iOS) servidos desde el dominio web mediante `/.well-known/assetlinks.json` y `/.well-known/apple-app-site-association`, gestionados por route handlers. El plugin `@capacitor/app` escucha `appUrlOpen` y enruta a la ruta interna; si la ruta es protegida, se conserva el destino y se redirige tras el login. Para pruebas internas sin asociación verificada, se admite un esquema propio (`toolyo://`) como respaldo.
- **Rationale**: Es el estándar para abrir contenido compartido directamente en la app (FR-009) y permite compartir los mismos enlaces que en web.
- **Alternatives considered**: solo esquema propio (mala experiencia: no intercepta enlaces https); solo carga web (no abre la app). Los archivos de asociación dependen del certificado/Team ID, que para builds internas sin firma puede no verificarse; de ahí el respaldo por esquema.

## Decision 5: Notificaciones push con FCM y APNs

- **Decision**: Usar `@capacitor/push-notifications`. Android se integra con Firebase Cloud Messaging (FCM HTTP v1) y iOS con APNs. Se persiste un token de dispositivo por usuario y plataforma y el envío se integra en el servicio de `notifications` existente (que ya gestiona el email asíncrono), sin bloquear la persistencia del mensaje. El permiso se solicita en contexto y la app funciona sin él.
- **Rationale**: FR-012 pide al menos avisos de mensajes nuevos; reutilizar `notifications` evita un segundo canal de eventos y respeta el patrón "persistir antes de notificar".
- **Alternatives considered**: solo email (no cumple el aviso móvil); proveedor push de terceros distinto de FCM/APNs (dependencia extra innecesaria); websockets (fuera del modelo serverless del proyecto).
- **Nota**: `google-services.json` (Android) y las capacidades/entitlements de APNs (iOS) son configuración, no secretos de código; en CI se inyectan desde secretos cuando estén disponibles y las builds sin ellos se marcan como no notificables, sin fallar el resto.

## Decision 6: Áreas seguras, layout y accesibilidad móvil

- **Decision**: Activar `viewport-fit=cover` y consumir `env(safe-area-inset-*)` mediante variables CSS/utilidades alineadas con `DESIGN.md`; respetar la navegación táctil y el gesto/botón "atrás" del sistema vía `@capacitor/app`; mantener a11y (foco, etiquetas, tamaños táctiles) según `DESIGN.md` §7.
- **Rationale**: FR-007 y SC-005 exigen que ningún contenido quede oculto por notch/barra de gestos y que la navegación sea la esperada.
- **Alternatives considered**: layout fijo sin áreas seguras (contenido cortado); asumir que el WebView ya lo resuelve (no es cierto en iOS/Android con notch).

## Decision 7: Capacidades nativas con mejora progresiva

- **Decision**: Detectar la plataforma (shell nativo frente a navegador) en `src/lib/native` y usar los plugins cuando existan, con las APIs web como respaldo. Cámara/galería para fotos de listing, geolocalización para búsqueda por cercanía y `@capacitor/network` para el estado de conexión, con degradación controlada y solicitud de permisos en contexto.
- **Rationale**: Mantiene una sola UI que funciona en web y nativo (FR-001, FR-008) y cumple FR-011 sin duplicar componentes.
- **Alternatives considered**: ramas de UI separadas por plataforma (duplicación y deriva); asumir permisos concedidos (rompe en el primer uso real).

## Decision 8: Artefactos nativos y estrategia de firma

- **Decision**: Generar en CI un **APK Android** (build `debug`/`release`; si existe keystore en secretos, firmar release; si no, producir artefacto de desarrollo marcado como tal) y un **archivo/iOS sin firmar o de simulador** (más firma ad-hoc si hay certificado y provisioning en secretos). Los artefactos se suben con `actions/upload-artifact` y se adjuntan a la release en tags `v*.*.*`. La build de iOS corre en runner `macos`; la de Android en `ubuntu` con JDK y Android SDK.
- **Rationale**: La decisión del spec es distribuir artefactos internos sin publicar en tiendas. La firma condicional permite operar sin secretos y endurecer cuando existan, sin incumplir `SECURITY.md` (los secretos nunca entran en el repositorio).
- **Alternatives considered**: exigir firma siempre (bloquearía el pipeline hasta tener cuentas de desarrollador); no generar iOS (incumple el objetivo Android+iPhone); publicar automáticamente en tiendas (fuera de alcance).

## Decision 9: Versión, actualización y build reproducible

- **Decision**: Derivar la versión de la app del `version` del paquete y del tag git; exponerla al shell y a la UI (por ejemplo vía variable pública de build) para identificar la versión en uso y ofrecer actualización cuando proceda. Al ser carga remota, el contenido web se actualiza solo; la actualización relevante es la del shell nativo, que se distribuye como nuevo artefacto.
- **Rationale**: FR-015 y el caso límite de app desactualizada requieren identificar la versión y ofrecer una vía de actualización sin romper flujos.
- **Alternatives considered**: no versionar el shell (imposible diagnosticar); forzar actualización bloqueante (peor experiencia y riesgo de bloqueo total).

## Decision 10: Testing de la capa móvil

- **Decision**: Vitest para detección de plataforma, parseo de enlaces profundos y validación de contratos de asociación; Playwright con proyectos de viewport móvil (Pixel e iPhone) para paridad, áreas seguras y flujos críticos; la compilación nativa (`cap sync` + Gradle/Xcode) en CI actúa como verificación de build. La validación en dispositivo real se documenta como paso manual en `quickstart.md`.
- **Rationale**: Sigue la pirámide de `TESTING.md`; los tests unitarios y de navegador son deterministas y baratos, y la build nativa verifica la integración.
- **Alternatives considered**: solo E2E (lento y frágil); automatizar dispositivos reales en CI (coste y complejidad no justificados para el MVP).

## Decision 11: Exclusión del backoffice y paridad de seguridad

- **Decision**: El backoffice (`/admin`) permanece accesible solo desde web; el shell móvil no lo expone como destino de la app. La autorización por recurso y la protección de datos no dependen de la plataforma, y se verifica que ningún flujo móvil omite controles existentes.
- **Rationale**: FR-014 y FR-013; el backoffice es una herramienta interna de escritorio y ampliarla a móvil aumenta superficie sin valor.
- **Alternatives considered**: incluir el backoffice en móvil (superficie y complejidad innecesarias); bloquear `/admin` por user-agent (frágil; el control real está en la autorización de servidor, que se conserva).

## Decision 12: Endpoint de servicios configurable y disponibilidad en red local

- **Decision**: Configurar la dirección del servicio en un **único punto**: una variable de entorno (`MOBILE_SERVER_URL`) que genera `capacitor.config.ts` (`server.url`) y que el pipeline recibe como entrada; en builds internas, añadir además un **override en tiempo de ejecución** (archivo de configuración editable o pantalla de ajustes) para apuntar a cualquier dirección de la intranet sin recompilar. Soportar HTTP en claro **solo** en builds internas/de desarrollo: `server.cleartext: true`, `network_security_config.xml` en Android limitado a los dominios/rangos locales y `NSAllowsLocalNetworking` en el ATS de iOS. En producción, HTTPS obligatorio y sin excepciones de transporte.
- **Rationale**: FR-016 y FR-017; el entorno de pruebas (PRU) corre en intranet y puede no ser accesible públicamente. Un único punto de configuración evita recompilar y permite corregir la dirección ante cambios de DHCP o de red. `NSAllowsLocalNetworking` en iOS permite alcanzar direcciones locales sin desactivar ATS para internet; en Android, `network_security_config.xml` acota el tráfico en claro a los destinos locales en lugar de habilitarlo globalmente.
- **Alternatives considered**:
  - Hardcodear la URL en el código: rechazado; incumple "fácilmente configurable" y obliga a recompilar.
  - Recompilar un shell por entorno: rechazado; lento, frágil y no soporta cambios de red.
  - Desactivar ATS/cleartext de forma global: rechazado; debilita la seguridad e incumple `SECURITY.md` §4.2.
  - Exigir VPN para acceder a la intranet: no descartado como complemento, pero no siempre disponible; el diseño no debe depender de ello.
- **Nota de seguridad**: el override en tiempo de ejecución se habilita únicamente en builds internas; en producción la configuración queda fijada y se exige HTTPS. La sesión por cookie `HttpOnly`/`Secure` no se envía por HTTP en claro salvo en el escenario local de pruebas, que se documenta explícitamente.

## Decisión pendiente de documentación

Actualizar `docs/03-arquitectura-y-tech-stack.md`, que hoy propone React Native + Expo para móvil, para reflejar la estrategia real (Capacitor sobre Next.js). Se registra como tarea de documentación en la fase de implementación.
