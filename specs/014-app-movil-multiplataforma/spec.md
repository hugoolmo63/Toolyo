# Feature Specification: Aplicación Móvil Multiplataforma (Web + Android + iPhone)

**Feature Branch**: `014-app-movil-multiplataforma`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "Necesito generar la aplicación frontal para Android y iPhone. La idea es que la aplicación que estoy creando sirva para las plataformas web, Android y iPhone a la vez. En el proceso de generación del proyecto en GitHub tendré acciones que me permitan generar las nativas para móviles."

## Clarifications

### Session 2026-10-05

- Q: ¿Qué estrategia de codebase usamos para entregar web + Android + iPhone desde un único código? → A: Capacitor sobre la app Next.js existente, con shells nativos Android/iOS y máximo reuso de UI y lógica.
- Q: ¿Qué alcance funcional debe tener la app móvil en esta primera entrega? → A: Paridad total con los módulos de usuario final ya existentes.
- Q: ¿Cómo distribuimos y firmamos las builds nativas desde GitHub Actions? → A: Artefactos internos (APK para Android y archivo/IPA para iOS) descargables desde las releases, sin publicación automática en tiendas.
- Q: ¿Cómo debe configurarse el endpoint de servicios y qué redes debe soportar? → A: El endpoint se configura en un único punto (variable de entorno y entrada del pipeline) con posibilidad de override en tiempo de ejecución en builds internas; debe soportar disponibilidad exclusiva desde direcciones de red local (intranet), permitiendo HTTP en claro solo en builds internas y exigiendo HTTPS en producción.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La misma aplicación en web, Android e iPhone (Priority: P1)

Como usuario de Toolyo, quiero acceder a la plataforma desde el navegador, desde una app instalable en Android y desde una app instalable en iPhone, y encontrar la misma funcionalidad y mis mismos datos en las tres, para alquilar o publicar herramientas desde el dispositivo que prefiera.

**Why this priority**: Es el objetivo central de la feature: una sola experiencia de producto disponible en las tres plataformas objetivo. Sin esto, no hay entrega móvil.

**Independent Test**: Instalar la app en un dispositivo Android y en un iPhone, iniciar sesión con la misma cuenta usada en web y comprobar que búsqueda, detalle de listing, reservas, mensajería, reviews y perfil muestran la misma información y permiten las mismas acciones que en el navegador.

**Acceptance Scenarios**:

1. **Given** un usuario con cuenta existente, **When** instala y abre la app en Android o iPhone e inicia sesión, **Then** ve su sesión, sus listings, reservas y mensajes igual que en la versión web.
2. **Given** un usuario navegando en web, **When** realiza una acción de negocio (por ejemplo, enviar una reserva o un mensaje), **Then** esa acción se refleja de forma consistente al abrir la app móvil, y viceversa.
3. **Given** un visitante sin sesión, **When** abre la app móvil, **Then** puede navegar por la búsqueda pública y el detalle de listings igual que en web, y se le solicita iniciar sesión solo al ejecutar acciones que lo requieren.

---

### User Story 2 - Generación de builds nativas desde GitHub (Priority: P1)

Como responsable del proyecto, quiero que el repositorio genere automáticamente los artefactos instalables para Android e iPhone desde GitHub Actions, para distribuir versiones de prueba sin depender de una máquina local ni de pasos manuales.

**Why this priority**: Es el mecanismo explícito que el usuario pidió para "generar las nativas para móviles". Sin pipeline, no hay entrega reproducible ni trazable.

**Independent Test**: Lanzar el flujo de generación de builds desde GitHub sobre una versión concreta y comprobar que produce el artefacto de Android y el de iOS, que quedan adjuntos a la release/ejecución y que un tester puede descargarlos e instalarlos.

**Acceptance Scenarios**:

1. **Given** una versión del código en la rama principal, **When** se ejecuta la acción de generación de builds móviles, **Then** se producen un artefacto instalable de Android y uno de iOS asociados a esa versión.
2. **Given** una build completada, **When** el responsable accede a los artefactos, **Then** puede descargarlos con su identificador de versión, fecha y plataforma, sin pasos manuales adicionales.
3. **Given** un fallo durante la generación (compilación, firma o empaquetado), **When** el proceso termina, **Then** la ejecución se marca como fallida, se indica la plataforma afectada y no se publica un artefacto incompleto o engañoso.

---

### User Story 3 - Experiencia adaptada al dispositivo móvil (Priority: P2)

Como usuario de la app móvil, quiero que la interfaz respete las particularidades del teléfono (área segura de la pantalla, gestos, navegación táctil, teclado y acceso a cámara/archivos), para usar Toolyo con la misma comodidad que una app nativa.

**Why this priority**: La paridad funcional no basta si la experiencia táctil, el layout o el acceso a recursos del dispositivo resultan incómodos o rompen el flujo.

**Independent Test**: Recorrer en un dispositivo con notch/barra de gestos los flujos de búsqueda, detalle, reserva y mensajería, y comprobar que no hay contenido cortado, que la navegación atrás del sistema funciona y que se pueden subir fotos de listing usando cámara o galería.

**Acceptance Scenarios**:

1. **Given** un dispositivo con área segura (notch, barra de gestos), **When** el usuario navega por la app, **Then** ningún contenido interactivo queda oculto o inaccesible.
2. **Given** un usuario creando o editando un listing, **When** pulsa "Añadir foto", **Then** puede tomar una foto con la cámara o elegirla de la galería y se sube correctamente.
3. **Given** un usuario que navega en profundidad, **When** usa el gesto o botón "atrás" del sistema, **Then** vuelve a la pantalla anterior esperada y no sale de la app de forma inesperada.

---

### User Story 4 - Continuidad de sesión y acceso a contenido compartido (Priority: P2)

Como usuario, quiero que al abrir la app desde un enlace compartido o al reabrirla después de un tiempo conserve mi sesión y me lleve directamente al contenido que me interesa, para no perder contexto.

**Why this priority**: El enlace compartido y la persistencia de sesión son claves para el uso real en móvil y para la conversión desde fuera de la app.

**Independent Test**: Compartir un enlace a un listing, abrirlo desde la app con y sin sesión, y comprobar que lleva al listing correcto, que pide login solo si es necesario y que, tras cerrar y reabrir la app, la sesión sigue activa.

**Acceptance Scenarios**:

1. **Given** un enlace a un listing compartido, **When** el usuario lo abre y tiene la app instalada, **Then** la app se abre en ese listing en lugar de quedarse en la pantalla de inicio.
2. **Given** un usuario que cerró la app sin cerrar sesión, **When** la vuelve a abrir, **Then** mantiene su sesión activa dentro de la vigencia definida por el sistema de autenticación.
3. **Given** un usuario sin sesión que abre un enlace a una ruta protegida, **When** se le solicita iniciar sesión, **Then** tras autenticarse continúa hacia el contenido solicitado en lugar de volver al inicio.

---

### User Story 5 - Notificaciones y estado sin conexión (Priority: P3)

Como usuario móvil, quiero recibir avisos de mensajes y eventos relevantes, y ver un estado claro cuando no tengo conexión, para no perder información importante ni quedar bloqueado.

**Why this priority**: Mejora la retención y la fiabilidad percibida, pero el producto sigue siendo usable sin ello, por lo que va después de la paridad y el pipeline.

**Independent Test**: Activar notificaciones, recibir un mensaje nuevo con la app en segundo plano y comprobar el aviso; después desactivar la red y comprobar que la app informa la falta de conexión y reintenta al recuperarla.

**Acceptance Scenarios**:

1. **Given** un usuario con notificaciones permitidas, **When** recibe un mensaje nuevo con la app en segundo plano, **Then** recibe un aviso que, al pulsarlo, abre la conversación correspondiente.
2. **Given** un dispositivo sin conexión, **When** el usuario intenta una acción que requiere red, **Then** la app muestra un estado de "sin conexión" comprensible y no pierde los datos introducidos.
3. **Given** un usuario que deniega el permiso de notificaciones, **When** usa la app, **Then** puede seguir operando con normalidad y puede volver a habilitarlo desde los ajustes.

---

### Edge Cases

- El contenido desplegado en web evoluciona y la app nativa instalada queda desactualizada: el sistema debe indicar la versión en uso y ofrecer la actualización sin romper flujos existentes.
- Un enlace profundo apunta a un listing eliminado, no publicado o a una ruta inexistente: debe mostrarse el estado de error correspondiente sin revelar información interna.
- El usuario deniega permisos de cámara, fotos, ubicación o notificaciones: la funcionalidad afectada debe degradarse de forma controlada y explicar cómo habilitarla.
- La instalación de iOS no está firmada o el dispositivo no está autorizado: el artefacto generado debe documentar su método de instalación y su limitación, sin prometer una instalación que no es posible.
- Cambios bruscos de red (pérdida y recuperación) durante una reserva o el envío de un mensaje no deben crear acciones duplicadas ni dejar el estado a medias.
- La sesión caduca mientras la app está en segundo plano: al volver, debe solicitarse autenticación sin perder el contexto ni mostrar datos de otro usuario.
- El sistema operativo o la versión del dispositivo es anterior al mínimo soportado: la app debe comunicar con claridad que no es compatible.
- El endpoint configurado solo es alcanzable desde la red local (intranet) y el dispositivo está fuera de ella: la app debe mostrar un estado de "servicio no accesible" comprensible, distinguirlo de "sin conexión" y permitir corregir la dirección sin reinstalar.
- La dirección local cambia (por ejemplo, por DHCP o cambio de red) o el usuario cambia de red Wi-Fi a datos móviles: la configuración del endpoint debe poder actualizarse sin recompilar y sin perder la sesión cuando el nuevo endpoint sea válido.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer los módulos de usuario final existentes (búsqueda pública, detalle de listing, reservas, mensajería, reviews y perfil) en web, Android e iPhone desde una única base de código de frontend.
- **FR-002**: El sistema MUST mantener paridad funcional y de datos entre las tres plataformas: una acción ejecutada en una plataforma debe ser visible y consistente en las demás.
- **FR-003**: El sistema MUST permitir instalar la aplicación como app nativa en Android y en iPhone a partir de artefactos generados por el repositorio.
- **FR-004**: El sistema MUST generar automáticamente los artefactos nativos de Android e iOS mediante el pipeline de integración continua del repositorio, a partir de una versión identificable del código.
- **FR-005**: El sistema MUST asociar cada artefacto generado a su versión, plataforma y fecha, y permitir su descarga sin pasos manuales adicionales.
- **FR-006**: El sistema MUST fallar de forma explícita y visible cuando una build nativa no pueda completarse, sin publicar artefactos incompletos.
- **FR-007**: El sistema MUST adaptar la interfaz a las particularidades del dispositivo móvil: áreas seguras, orientación, teclado, navegación táctil y botón/gesto "atrás" del sistema.
- **FR-008**: El sistema MUST permitir el acceso a recursos del dispositivo necesarios para el producto (cámara/galería para fotos de listings, ubicación para búsqueda por cercanía y notificaciones), solicitando permiso en el momento de uso y degradando la funcionalidad de forma controlada si se deniega.
- **FR-009**: El sistema MUST soportar enlaces profundos que abran la app directamente en el contenido compartido (por ejemplo, un listing o una conversación) y que redirijan correctamente tras el login.
- **FR-010**: El sistema MUST conservar la sesión del usuario entre aperturas de la app, conforme a la vigencia y controles del sistema de autenticación existente.
- **FR-011**: El sistema MUST comunicar un estado comprensible de "sin conexión" y evitar pérdida de datos introducidos cuando la red no está disponible.
- **FR-012**: El sistema MUST notificar eventos relevantes (al menos mensajes nuevos) mediante notificaciones del sistema operativo, respetando la decisión del usuario sobre dicho permiso.
- **FR-013**: El sistema MUST mantener las mismas garantías de seguridad y autorización que la versión web: la autenticación, la autorización por recurso y la protección de datos sensibles no dependen de la plataforma.
- **FR-014**: El sistema MUST excluir de la app móvil el backoffice administrativo interno, que permanece como herramienta web, sin que ello afecte a los módulos de usuario final.
- **FR-015**: El sistema MUST identificar la versión de la app en uso y ofrecer una vía de actualización cuando el contenido o la app hayan quedado desactualizados.
- **FR-016**: El sistema MUST permitir configurar la dirección del servicio (endpoint) al que se conecta el shell móvil en un único punto, sin recompilar la lógica de negocio, y aplicar esa configuración a todas las peticiones de la app; en builds internas MUST poder ajustarse también en tiempo de ejecución para pruebas.
- **FR-017**: El sistema MUST soportar que el endpoint resuelva exclusivamente a direcciones dentro de la red local (intranet), permitiendo tráfico HTTP en claro únicamente en builds internas o de desarrollo y exigiendo HTTPS en producción.

### Key Entities

- **Artefacto de build nativo**: entregable instalable generado por el pipeline, con plataforma (Android/iOS), versión, fecha y estado (completo/fallido).
- **Perfil de plataforma**: conjunto de particularidades de cada destino (web, Android, iPhone) que condicionan la experiencia, los permisos y las capacidades disponibles.
- **Sesión de usuario**: identidad autenticada compartida entre plataformas, con su vigencia y controles de seguridad.
- **Enlace profundo**: referencia a un contenido interno (listing, conversación, perfil) que debe resolverse dentro de la app.
- **Notificación**: aviso del sistema operativo asociado a un evento del producto, con su permiso y su destino.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los módulos de usuario final listados en FR-001 es accesible y funcional en web, Android e iPhone en la entrega de paridad.
- **SC-002**: Una misma acción de negocio (reserva o mensaje) realizada en cualquier plataforma es visible en las otras dos en menos de 1 minuto en condiciones normales de red.
- **SC-003**: El 100% de las ejecuciones del pipeline sobre una versión válida produce artefactos de Android e iOS descargables; el 100% de las ejecuciones fallidas se marca como fallida sin publicar artefactos.
- **SC-004**: Un tester puede instalar una build interna en Android y en iPhone siguiendo la documentación de la release sin asistencia en el 90% de los intentos.
- **SC-005**: El 90% de las tareas móviles críticas (buscar, ver detalle, reservar, enviar mensaje) se completa sin incidencias de layout en dispositivos con área segura en una prueba con al menos 10 dispositivos representativos.
- **SC-006**: El 100% de los enlaces profundos compartidos abre el contenido correcto dentro de la app cuando está instalada, y redirige tras el login cuando la ruta está protegida.
- **SC-007**: Ninguna funcionalidad de la app móvil permite acceder a datos o acciones sin las mismas comprobaciones de autenticación y autorización que la versión web en una revisión de seguridad de los flujos principales.
- **SC-008**: Cambiar la dirección del servicio en una build interna no requiere recompilar el shell y se aplica en menos de 1 minuto; el 100% de las builds de producción rechaza HTTP en claro y no permite override del endpoint.

## Assumptions

- La estrategia elegida es **Capacitor sobre la app Next.js existente**: la base de código de frontend es única y los proyectos nativos Android/iOS actúan como contenedores. La decisión se documentará en el plan técnico.
- El alcance es de **paridad total** con los módulos de usuario final ya implementados; el backoffice administrativo queda fuera de la app móvil (FR-014).
- La distribución es de **artefactos internos**: APK para Android y archivo/IPA para iOS, adjuntos a las ejecuciones o releases de GitHub, sin publicación automática en Google Play ni App Store.
- La instalación de la build de iOS en dispositivos no autorizados está limitada por las reglas de firma de Apple; el pipeline documenta el método de instalación admitido (por ejemplo, distribución interna/ad-hoc) y sus requisitos.
- Se reutilizan la autenticación, la autorización por recurso, los contratos de API y la lógica de negocio existentes; la feature no redefine reglas de negocio ni el modelo de datos salvo lo imprescindible para las capacidades nativas.
- La versión mínima de sistema operativo soportada y los permisos requeridos se fijan en el plan técnico, alineados con las versiones aún soportadas por Android e iOS.
- Las capacidades nativas del MVP móvil son: cámara/galería, geolocalización, notificaciones y enlaces profundos. Otras capacidades (por ejemplo, biometría o pagos nativos) quedan fuera de esta entrega.
- El entorno de integración continua ya existe en el repositorio y se extiende con los trabajos de generación nativa; los secretos de firma, si se requieren, se gestionan fuera del código.
- El endpoint de servicios es configurable en un único punto (variable de entorno y entrada del pipeline) y, en builds internas, ajustable en tiempo de ejecución; la disponibilidad exclusiva desde la red local (intranet) es un escenario soportado, con HTTP en claro permitido solo en builds internas/de desarrollo.
- La configuración de endpoint y los permisos de red en claro no debilitan la seguridad de producción: allí se exige HTTPS y no se admite tráfico en claro.
- Se mantiene el cumplimiento de `constitution/FRONTEND.md`, `constitution/SECURITY.md`, `constitution/DESIGN.md` y `constitution/TESTING.md` en las tres plataformas.
