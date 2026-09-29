# Feature Specification: Batería de tests de navegación

**Feature Branch**: `010-navigation-test-suite`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Quisiera añadir una batería de test de navegación con puppeteer para ver que todo funciona" + refinamientos: "antes se usaba playwright, si prefieres sigue con el mismo, mi requisito es que sean pruebas completas de navegación" y "añade que quiero las evidencias en video"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verificar que todas las páginas cargan (Priority: P1)

Como desarrollador o miembro de QA, quiero ejecutar una batería de tests de navegación con un navegador real contra una instancia de la aplicación para confirmar de un vistazo que todas las páginas principales cargan correctamente y no hay errores de renderizado, rutas rotas ni respuestas de error.

**Why this priority**: Es el núcleo de la petición — "ver que todo funciona". Una comprobación automática de navegación da confianza inmediata tras un cambio, un despliegue o una actualización de dependencias, sin tener que recorrer la aplicación a mano.

**Independent Test**: Con la aplicación levantada (servidor de desarrollo o entorno de prueba), se ejecuta un único comando y la batería recorre todas las rutas públicas configuradas, informando por consola del resultado de cada una y devolviendo éxito o fallo global.

**Acceptance Scenarios**:

1. **Given** la aplicación corriendo y accesible, **When** se ejecuta la batería de navegación, **Then** cada ruta pública configurada es visitada y se verifica que responde correctamente y renderiza el contenido esperado.
2. **Given** la aplicación corriendo, **When** una ruta devuelve un error (página no encontrada, error de servidor o contenido que no se renderiza), **Then** la batería lo reporta indicando la ruta concreta que falla y termina con resultado de fallo.
3. **Given** la aplicación corriendo, **When** todas las rutas responden correctamente, **Then** la batería muestra un resumen final de éxito y termina con resultado de éxito.

---

### User Story 2 - Verificar la navegación entre páginas (Priority: P2)

Como desarrollador, quiero que la batería compruebe que los elementos de navegación principales (cabecera, logo, enlaces de pie de página) llevan a donde deben, para detectar enlaces rotos o redirecciones incorrectas que una visita directa a cada ruta no detectaría.

**Why this priority**: No basta con que cada página cargue aisladamente; la aplicación funciona como un conjunto de páginas enlazadas. Un enlace roto en la cabecera afecta a todas las páginas a la vez.

**Independent Test**: La batería carga la página de inicio, interactúa con los elementos de navegación principales y comprueba que cada uno conduce a la destino esperado.

**Acceptance Scenarios**:

1. **Given** un visitante en cualquier página, **When** se activa el logo o enlace de inicio, **Then** se navega a la página principal.
2. **Given** un visitante en la página de inicio, **When** se activan los enlaces de navegación principales (buscar, acceder, registrarse, enlaces del pie de página), **Then** cada uno lleva a la página esperada sin errores.
3. **Given** un visitante anónimo, **When** intenta acceder directamente a una ruta que requiere sesión (p. ej. panel de usuario), **Then** es redirigido a la pantalla de identificación en lugar de ver contenido protegido o un error.

---

### User Story 3 - Ejecutar la batería contra distintos entornos (Priority: P3)

Como desarrollador, quiero poder apuntar la batería a la URL que elija (desarrollo local, entorno Docker de pruebas, entorno desplegado) para reutilizar la misma comprobación en cada etapa sin duplicar configuración.

**Why this priority**: El proyecto ya dispone de un despliegue de pruebas aislado; la batería gana valor si sirve tanto para desarrollo local como para verificar un entorno recién desplegado.

**Independent Test**: Se ejecuta la batería indicando una URL base distinta de la por defecto y las comprobaciones se realizan contra ese destino.

**Acceptance Scenarios**:

1. **Given** la batería configurada por defecto, **When** se ejecuta sin parámetros adicionales, **Then** apunta a la instancia local por defecto.
2. **Given** una URL base alternativa válida, **When** se ejecuta la batería indicándola, **Then** todas las comprobaciones se realizan contra esa URL.
3. **Given** una URL base inalcanzable, **When** se ejecuta la batería, **Then** falla rápidamente con un mensaje claro que indica que el destino no responde, sin dejar procesos ni recursos abiertos.

---

### User Story 4 - Journeys completos de usuario (Priority: P2)

Como desarrollador o miembro de QA, quiero que la batería recorra los flujos reales que un usuario puede hacer en la aplicación —identificarse, publicar un producto, buscar, contactar, reservar y revisar sus reservas/mensajes— ejecutados de punta a punta con un navegador real, para verificar que las piezas encajan entre sí y no solo que las páginas cargan.

**Why this priority**: Las cargas de ruta (US1) detectan páginas rotas, pero no rompen si el botón Reservar no hace nada o el login no completa. Los journeys son lo que el usuario vive: son la respuesta directa a "ver que todo funciona" entendido como lo que los usuarios pueden hacer.

**Independent Test**: Con la app levantada y el seed aplicado, ejecutar solo el grupo `flujos de usuario` produce una pasada donde cada journey termina en su estado final esperado (mensaje enviado, solicitud de reserva creada, producto publicado y retirado, sesión cerrada).

**Acceptance Scenarios**:

1. **Given** un visitante anónimo en `/`, **When** abre el diálogo de acceso e introduce credenciales válidas del seed, **Then** la sesión queda iniciada en la misma página, puede ir a su panel y cerrar sesión volviendo al estado anónimo.
2. **Given** un usuario identificado, **When** publica un nuevo producto desde su panel (título, descripción, categoría, precio, ciudad, foto), **Then** el producto aparece en "Mis productos" y su ficha privada es accesible; al retirarlo, desaparece del panel.
3. **Given** un usuario identificado en un anuncio ajeno, **When** pulsa "Contactar" y escribe un mensaje, **Then** se crea/abre la conversación con el arrendador y el mensaje enviado aparece en el hilo.
4. **Given** un usuario identificado en un anuncio ajeno con un rango de fechas seleccionado, **When** pulsa "Reservar" y confirma la solicitud en el diálogo, **Then** la solicitud se crea y la app navega al chat contextual de esa reserva.
5. **Given** el usuario del seed que es arrendador con una solicitud pendiente, **When** entra a "Mis alquileres/reservas" y abre la conversación asociada, **Then** ve la solicitud pendiente con su contexto (banner de reserva) en el chat.

---

### Edge Cases

- ¿Qué ocurre si una página responde correctamente pero muestra un mensaje de error genérico o una pantalla de "no encontrado"? La comprobación debe detectarlo, no solo fijarse en que la petición responde.
- ¿Qué ocurre si la aplicación no está levantada o tarda demasiado en responder? La batería debe fallar con un mensaje claro y un tiempo de espera acotado, no quedarse colgada.
- ¿Qué ocurre si una navegación es lenta pero correcta? Los tiempos de espera deben ser razonables para no producir fallos falsos.
- ¿Qué ocurre con páginas que dependen de datos (p. ej. detalle de un anuncio)? La comprobación debe usar un elemento existente del entorno de datos de prueba o degradarse con elegancia si no hay datos disponibles.
- ¿Qué ocurre al ejecutar la batería varias veces seguidas? Debe ser repetible: no modifica datos ni deja estado residual entre ejecuciones.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La batería MUST visitar todas las rutas públicas principales de la aplicación (inicio/búsqueda, detalle de anuncio, páginas de acceso y registro, perfil público de usuario) y verificar que cada una responde correctamente.
- **FR-002**: La batería MUST comprobar en cada página que el contenido esperado se renderiza realmente, no solo que la petición responde (p. ej. detectar pantallas de error o de "no encontrado").
- **FR-003**: La batería MUST verificar los elementos de navegación principales: logo/enlace de inicio, enlaces de la cabecera y enlaces del pie de página, comprobando que conducen a su destino esperado.
- **FR-004**: La batería MUST verificar que las rutas que requieren sesión redirigen a los visitantes anónimos a la pantalla de identificación.
- **FR-005**: La batería MUST ejecutarse con un único comando y producir un resultado global de éxito o fallo, indicando qué comprobación concreta ha fallado en su caso.
- **FR-006**: La batería MUST permitir configurar la URL base del destino para poder apuntar a la instancia local o a un entorno desplegado.
- **FR-007**: La batería MUST aplicar tiempos de espera acotados a cada navegación y fallar de forma controlada cuando el destino no responde.
- **FR-008**: Las comprobaciones de rutas y navegación MUST ser de solo lectura. Los journeys de usuario (US4) PUEDEN crear datos de prueba en el entorno desechable (producto, mensaje, solicitud de reserva), identificados con un prefijo reconocible (`E2E`), y MUST limpiar lo que crean cuando la propia aplicación lo permite (p. ej. retirar el producto publicado).
- **FR-009**: La batería MUST ejecutarse con el framework E2E ya establecido en el proyecto (Playwright), integrándose en la suite existente sin interferir con los specs actuales.
- **FR-010**: La batería MUST grabar un vídeo de la ejecución de cada comprobación como evidencia, conservándolo en un directorio accesible tras la ejecución independientemente del resultado (éxito o fallo).
- **FR-011**: La batería MUST incluir los journeys autenticados de US4: login contextual → panel → logout; publicar producto → verificarlo en el panel → retirarlo; contactar al arrendador → enviar mensaje; seleccionar fechas → solicitar reserva → aterrizar en el chat contextual; consultar reserva pendiente como arrendador.

### Key Entities *(include if feature involves data)*

- **Comprobación de navegación**: Una visita o interacción concreta sobre una página (ruta visitada, elemento activado o redirección observada) con un resultado esperado. Atributos: objetivo, expectativa, resultado (éxito/fallo), mensaje de diagnóstico.
- **Informe de ejecución**: Resultado agregado de una pasada de la batería: lista de comprobaciones con su resultado, resumen de aciertos y fallos, y veredicto global.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La batería completa verifica el 100 % de las rutas públicas principales en menos de 3 minutos contra una instancia local.
- **SC-002**: Cuando una página deja de funcionar (ruta eliminada, error de servidor, contenido que no renderiza), la batería lo detecta y lo reporta identificando la página concreta en el 100 % de los casos.
- **SC-003**: La ejecución completa se lanza con un único comando y su resultado global (éxito/fallo) es inequívoco para quien lo ejecuta o para una tubería de integración.
- **SC-004**: La batería produce el mismo resultado en ejecuciones consecutivas contra el mismo entorno (sin fallos intermitentes atribuibles a la propia batería).
- **SC-005**: Cualquier miembro del equipo puede ejecutar la comprobación de navegación sin conocimientos del stack de tests, siguiendo una única instrucción documentada.
- **SC-006**: Tras cada ejecución, el 100 % de las comprobaciones dispone de un vídeo de evidencia reproducible que muestra la navegación realizada, localizable sin herramientas adicionales.

## Assumptions

- La aplicación ya está levantada cuando se ejecuta la batería; arrancar el servidor o el entorno Docker de pruebas es responsabilidad de quien la lanza (el proyecto ya dispone del script de despliegue de pruebas para ello).
- El entorno de destino dispone de datos de prueba (seed por defecto) para las páginas que dependen de datos, como el detalle de anuncio o el perfil público.
- La batería usa Playwright, el framework E2E establecido por `constitution/TESTING.md` y ya instalado en `development/` con specs existentes en `development/tests/e2e/`. El usuario pidió inicialmente Puppeteer pero confirmó posteriormente que prefiere continuar con la herramienta existente; su requisito es que las pruebas de navegación sean completas.
- Los journeys autenticados usan las credenciales del seed (`test@test.com`), que además es arrendador de una reserva pendiente sembrada (`seed-booking-1`). La aceptación/rechazo de reservas no tiene UI implementada (existe la mutación `booking.accept` sin botón), por lo que el journey de arrendador se limita a consultar la solicitud pendiente y su contexto — la confirmación efectiva queda fuera de alcance hasta que exista UI.
- Los journeys crean datos en el entorno de pruebas (conversaciones, solicitudes de reserva, productos marcados `E2E` que luego se retiran). Son aceptables porque el destino es un entorno desechable; la limpieza exhaustiva de mensajes/reservas no es posible vía UI y se asume que el seed regenera el estado.
- La batería se ejecuta bajo demanda de forma manual; su integración en CI queda como opción futura, no como requisito de esta entrega.
- Los vídeos se conservan en el directorio de resultados de la suite E2E y pueden ser sobrescritos por ejecuciones posteriores; no se requiere archivo permanente ni subida a almacenamiento externo en esta entrega.
