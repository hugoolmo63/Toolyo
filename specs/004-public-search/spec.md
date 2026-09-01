# Feature Specification: Búsqueda Pública y Página de Inicio

**Feature Branch**: `04-public-search`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Crear la feature correspondiente a la sección 3.1 (Búsqueda Principal) de `docs/04-especificaciones-funcionales.md`. Cuando un visitante entre en la web irá directamente a esta página, que actúa como landing y como buscador. No se necesita estar logado ni identificado para realizar la búsqueda ni para ver los resultados. Desde el inicio deben salir resultados: inicialmente aparecerán de forma aleatoria, pero el visitante debe poder configurar la búsqueda desde la propia página de inicio. Debe cubrir SEARCH-001 a SEARCH-008: barra de búsqueda con autocompletado de ubicaciones y categorías, detección automática de ubicación (GPS) o selección manual, filtros (categoría, rango de fechas, precio máximo por día, distancia máxima, rating mínimo, solo usuarios verificados), ordenación (Relevancia, Más cercano, Precio, Mejor valorado, Más popular), vistas grid/lista, mapa interactivo con pins y paginación (infinite scroll en móvil, numerada en desktop)."

### Trazabilidad con la especificación funcional

| Requisito fuente | Cobertura en esta feature |
|---|---|
| SEARCH-001 — Barra de búsqueda global con autocompletado de ubicaciones y categorías | User Story 1; FR-001, FR-002, FR-019 |
| SEARCH-002 — Detección automática de ubicación (GPS) o selección manual | User Story 1; FR-003, FR-004 |
| SEARCH-003 — Filtros: categoría, rango de fechas, precio máximo por día, distancia máxima, rating mínimo | User Story 2; FR-005 |
| SEARCH-004 — Ordenación: Relevancia, Más cercano, Precio (asc/desc), Mejor valorado, Más popular | User Story 2; FR-006 |
| SEARCH-005 — Resultados en vista de grid (tarjetas) o lista | User Story 4; FR-010 |
| SEARCH-006 — Mapa interactivo con pins de productos, clic para ver preview | User Story 3; FR-008, FR-009 |
| SEARCH-007 — Paginación infinita en móvil, paginación numerada en desktop | User Story 4; FR-011 |
| SEARCH-008 — Filtro "Solo usuarios verificados" en resultados de búsqueda | User Story 2; FR-007 |
| `docs/04-especificaciones-funcionales.md` §3 — Módulo de Búsqueda y Descubrimiento | Toda la feature |
| `constitution/DESIGN.md` — tema `profesional-seguro`, accesibilidad WCAG 2.1 AA | User Story 1; FR-013 |
| `constitution/FRONTEND.md` — Server-first, RSC por defecto, Client Components solo para interactividad | User Story 1, 3; FR-014 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Llegar a la web y ver resultados sin estar logado (Priority: P1)

Como visitante sin cuenta (o sin sesión iniciada) quiero entrar directamente en una página de búsqueda que funcione como landing de la plataforma y ver resultados desde el primer momento (inicialmente aleatorios), para descubrir qué se puede alquilar sin tener que buscar nada previamente ni identificarme; y quiero poder configurar la búsqueda desde esa misma página de inicio (ubicación, categoría, filtros, ordenación) para refinar lo que estoy viendo.

**Why this priority**: Es la puerta de entrada a la plataforma y el primer contacto del usuario con el valor del producto. Mostrar resultados desde el inicio (aunque sean aleatorios) transmite inmediatamente "hay cosas que alquilar" y reduce la fricción de un visitante nuevo, que no tiene que adivinar qué escribir para ver algo. Si la búsqueda pública no funciona sin login, el visitante abandona antes de considerar registrarse. Cubre SEARCH-001 y SEARCH-002 y es la base sobre la que se apoyan los demás stories (filtros, mapa, vistas).

**Independent Test**: Un visitante nuevo, sin sesión y sin cuenta, abre la URL raíz del sitio y ve directamente una lista de productos publicados (aleatorios) sin haber tecleado nada ni haberse identificado; a partir de ahí puede usar la barra de búsqueda y los filtros de la propia landing para refinar lo que está viendo.

**Acceptance Scenarios**:

1. **Given** un visitante sin sesión que abre la URL raíz del sitio, **When** carga la página, **Then** aterriza directamente en la página de búsqueda (landing) con la barra de búsqueda visible y operativa y con una lista de resultados ya cargada (sin haber tecleado nada), sin redirecciones a login ni muros de autenticación.
2. **Given** la carga inicial de la landing sin ningún criterio de búsqueda introducido, **When** se renderiza la página, **Then** se muestran resultados aleatorios de listings en estado `Publicado`, en número suficiente para llenar la primera página, sin que el visitante haya tenido que introducir ubicación, categoría ni ningún filtro.
3. **Given** la landing con resultados aleatorios cargados, **When** el visitante empieza a configurar la búsqueda desde la propia página de inicio (introduce ubicación y/o categoría, aplica filtros o cambia ordenación), **Then** los resultados se sustituyen por los que cumplen los nuevos criterios, pasando de "aleatorios" a "filtrados/ordenados" sin recargar la página.
4. **Given** un visitante en la página de búsqueda, **When** empieza a escribir en la barra de búsqueda, **Then** aparecen sugerencias de autocompletado de ubicaciones y de categorías, claramente diferenciadas, y puede seleccionar una con teclado o ratón.
5. **Given** un visitante que concede permiso de geolocalización, **When** activa la detección de ubicación, **Then** el sistema detecta su posición y la usa como ubicación de búsqueda mostrando resultados cercanos.
6. **Given** un visitante que rechaza el permiso de geolocalización o navega desde un dispositivo sin GPS, **When** accede a la búsqueda, **Then** puede seleccionar su ubicación manualmente (texto autocompletado o mapa) sin que se le bloquee la búsqueda; mientras tanto sigue viendo los resultados aleatorios iniciales.
7. **Given** un visitante que ejecuta una búsqueda (o aplica filtros) sin resultados disponibles para los criterios introducidos, **When** se renderiza la página de resultados, **Then** ve un estado vacío claro que le invita a ampliar criterios o explorar categorías populares, sin errores técnicos visibles.
8. **Given** un visitante sin sesión que interactúa con la búsqueda, **When** navega por resultados, **Then** en ningún momento se le exige iniciar sesión ni registrarse para ver ni paginar resultados; el login solo se le puede proponer de forma no bloqueante (ej. banner opcional) si procede.

---

### User Story 2 - Filtrar y ordenar resultados (Priority: P1)

Como visitante con una búsqueda activa quiero refinar los resultados mediante filtros (categoría, rango de fechas, precio máximo por día, distancia máxima, rating mínimo, solo usuarios verificados) y ordenarlos (Relevancia, Más cercano, Precio asc/desc, Mejor valorado, Más popular) para encontrar rápidamente el producto que mejor se adapta a mis necesidades.

**Why this priority**: Sin filtros y ordenación, la búsqueda devuelve una lista plana que deja de ser útil en cuanto el catálogo crece. Es la diferencia entre "funciona" y "es útil". Cubre SEARCH-003, SEARCH-004 y SEARCH-008.

**Independent Test**: Partiendo de una búsqueda con resultados, un visitante aplica al menos un filtro y cambia el criterio de ordenación, y la lista de resultados se actualiza reflejando ambos sin necesidad de recargar la página ni identificarse.

**Acceptance Scenarios**:

1. **Given** una búsqueda con resultados, **When** el visitante aplica el filtro de categoría, **Then** la lista se reduce a los productos de esa categoría y el filtro queda reflejado visualmente como activo.
2. **Given** una búsqueda con resultados, **When** el visitante aplica un rango de fechas, **Then** solo se muestran productos con disponibilidad confirmada en al menos parte del rango solicitado.
3. **Given** una búsqueda con resultados, **When** el visitante aplica un precio máximo por día, **Then** desaparecen los productos cuyo precio por día supera ese umbral.
4. **Given** una búsqueda con resultados y una ubicación definida, **When** el visitante aplica una distancia máxima, **Then** solo se muestran productos dentro de ese radio.
5. **Given** una búsqueda con resultados, **When** el visitante aplica un rating mínimo, **Then** solo se muestran productos cuyo rating promedio es mayor o igual al umbral.
6. **Given** una búsqueda con resultados, **When** el visitante activa "Solo usuarios verificados", **Then** solo se muestran productos cuyo arrendador tiene el badge de verificación de identidad activo.
7. **Given** una búsqueda con resultados, **When** el visitante cambia el criterio de ordenación, **Then** el orden de la lista se actualiza según el criterio elegido (Relevancia, Más cercano, Precio asc, Precio desc, Mejor valorado, Más popular) sin perder los filtros aplicados.
8. **Given** un visitante con filtros aplicados, **When** pulsa "Limpiar filtros", **Then** todos los filtros vuelven a su estado por defecto y la lista muestra los resultados sin refinar.
9. **Given** un visitante que aplica filtros que dejan la búsqueda sin resultados, **When** se renderiza la lista, **Then** ve un estado vacío que sugiere relajar los criterios y muestra qué filtros están activos.

---

### User Story 3 - Explorar resultados en mapa interactivo (Priority: P2)

Como visitante con una búsqueda activa quiero ver los productos sobre un mapa interactivo con pins, hacer clic en un pin para ver una preview del producto y entender visualmente dónde están las opciones disponibles, para decidir por cercanía geográfica.

**Why this priority**: El mapa es un diferenciador fuerte frente a una lista plana y cubre SEARCH-006, pero la búsqueda ya es funcional con la lista de resultados (User Stories 1 y 2). Es prioritario pero no bloquea el MVP de búsqueda.

**Independent Test**: Partiendo de una búsqueda con resultados geolocalizados, un visitante cambia a la vista de mapa, ve pins de los productos, hace clic en uno y aparece una preview con la información esencial sin abandonar la página de búsqueda.

**Acceptance Scenarios**:

1. **Given** una búsqueda con resultados geolocalizados, **When** el visitante activa la vista de mapa, **Then** se renderiza un mapa centrado en la ubicación de búsqueda con un pin por cada producto visible.
2. **Given** la vista de mapa activa, **When** el visitante hace clic en un pin, **Then** se muestra una preview del producto (imagen, título, precio por día, rating, distancia) sin navegar fuera de la página de búsqueda.
3. **Given** la vista de mapa activa, **When** el visitante desplaza o hace zoom en el mapa, **Then** los pins se ajustan al área visible y, si procede, se cargan más resultados dentro del nuevo viewport.
4. **Given** la vista de mapa activa con filtros aplicados, **When** cambian los filtros, **Then** los pins del mapa se actualizan para reflejar el mismo conjunto de resultados que la lista.
5. **Given** un visitante en la vista de mapa, **When** hace clic en la preview de un pin, **Then** navega a la página de detalle del producto (cubierta por la feature 3.3, fuera de este alcance).

---

### User Story 4 - Cambiar entre vista grid/lista y paginar resultados (Priority: P2)

Como visitante con una búsqueda activa quiero alternar entre vista de grid (tarjetas) y lista, y poder pasar de página o cargar más resultados según mi dispositivo, para consumir los resultados de la forma que me resulte más cómoda.

**Why this priority**: Mejora la experiencia de consumo de resultados y cubre SEARCH-005 y SEARCH-007, pero la búsqueda ya es funcional con una sola vista y la primera página de resultados. Es prioritario pero no bloquea el MVP de búsqueda.

**Independent Test**: Partiendo de una búsqueda con más resultados de los que caben en una página, un visitante alterna entre vista grid y lista y, según su dispositivo, pagina numéricamente (desktop) o carga más con infinite scroll (móvil), sin perder los filtros ni la ordenación aplicados.

**Acceptance Scenarios**:

1. **Given** una búsqueda con resultados, **When** el visitante alterna entre vista grid y vista lista, **Then** la presentación de los resultados cambia de formato conservando el mismo conjunto de resultados, filtros y ordenación.
2. **Given** una búsqueda en dispositivo de escritorio con más resultados que los mostrados en la primera página, **When** el visitante llega al final de la página, **Then** aparece una paginación numerada que le permite saltar a páginas específicas.
3. **Given** una búsqueda en dispositivo móvil con más resultados que los mostrados inicialmente, **When** el visitante hace scroll hacia abajo, **Then** se cargan automáticamente más resultados (infinite scroll) con un indicador de carga visible.
4. **Given** un visitante que cambia de página o carga más resultados, **When** se renderizan los nuevos resultados, **Then** los filtros y la ordenación aplicados se mantienen y no se reinician.
5. **Given** un visitante que recarga la URL de una búsqueda con filtros, ordenación, vista y página concretas, **When** se vuelve a renderizar la página, **Then** el estado de la búsqueda se restaura a partir de los parámetros de la URL sin perder la configuración.

---

### Edge Cases

- Un visitante sin permiso de geolocalización debe poder buscar seleccionando ubicación manualmente; la ausencia de GPS nunca bloquea la búsqueda.
- La búsqueda sin sesión no debe exponer datos privados del arrendador ni del arrendatario; solo se muestran campos públicos (los mismos que vería un usuario logado en la lista).
- Una búsqueda con un término o ubicación inexistente debe mostrar un estado vacío útil, no un error 500 ni una página en blanco.
- Los filtros combinados entre sí deben comportarse como AND lógico; un filtro no debe anular a otro silenciosamente.
- El autocompletado debe tolerar typos y acentos (búsqueda insensible a mayúsculas/minúsculas y diacríticos en español).
- El mapa debe degradar con elegancia si el proveedor de mapas no carga: la vista de lista debe seguir siendo usable y se debe informar al usuario de que el mapa no está disponible.
- El infinite scroll en móvil debe tener un límite razonable de resultados cargados para no degradar el rendimiento; llegado a ese límite, se ofrece paginación explícita.
- La URL debe reflejar el estado de la búsqueda (término, ubicación, filtros, ordenación, vista, página) para que sea compartible y se pueda restaurar al recargar o volver atrás.
- Un visitante que vuelve a la búsqueda con el botón "Atrás" del navegador debe recuperar el estado anterior (filtros, ordenación, página) sin tener que reconfigurarlo.
- Los resultados pausados, en revisión, rechazados o en borrador nunca deben aparecer en la búsqueda pública; solo listings en estado `Publicado`.
- El filtro "Solo usuarios verificados" nunca debe exponer el estado interno de verificación de un usuario no verificado más allá de excluirlo de los resultados cuando el filtro está activo.
- Un visitante con conexión lenta debe ver skeletons o placeholders mientras cargan los resultados, no una pantalla en blanco.
- La detección de ubicación por GPS debe pedir permiso explícitamente y respetar la decisión del usuario; no se geolocaliza sin consentimiento.
- La paginación numerada en desktop debe deshabilitar o ocultar los controles de página cuando no hay suficientes resultados para paginar.
- La carga inicial de la landing debe mostrar resultados aleatorios incluso si el catálogo es pequeño; si no hay listings publicados, se muestra un estado vacío/informativo en lugar de una lista vacía sin contexto.
- Los resultados aleatorios iniciales no deben ser estáticos entre cargas: dos visitantes (o dos cargas del mismo visitante) pueden ver conjuntos aleatorios distintos, para evitar sesgo hacia un subconjunto fijo del catálogo.
- Al aplicar cualquier criterio de búsqueda sobre los resultados aleatorios iniciales, el sistema debe pasar a comportamiento de búsqueda con criterios (reflejado en la URL); no debe mezclar "aleatorio" con "filtrado" en el mismo estado.
- La paginación sobre resultados aleatorios iniciales debe mantener la coherencia dentro de una misma sesión de visualización (no regenerar el orden aleatorio al pasar de página), para que el visitante no vea duplicados ni pierda resultados al paginar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST servir una página de búsqueda pública en la URL raíz del sitio que actúe como landing y como buscador, accesible sin sesión ni identificación, de forma que cualquier visitante pueda realizar búsquedas y ver resultados sin ser redirigido a login.
- **FR-002**: El sistema MUST ofrecer una barra de búsqueda con autocompletado que sugiera ubicaciones y categorías de forma diferenciada a medida que el visitante escribe, tolerando typos y siendo insensible a mayúsculas y diacríticos en español.
- **FR-003**: El sistema MUST permitir al visitante activar la detección automática de ubicación mediante GPS, previa solicitud explícita de permiso, y usar esa posición como ubicación de búsqueda cuando el visitante consiente.
- **FR-004**: El sistema MUST permitir al visitante seleccionar su ubicación manualmente (por texto autocompletado o sobre el mapa) cuando no concede permiso de geolocalización, cuando no dispone de GPS o cuando prefiere buscar en otra zona, sin que la ausencia de GPS bloquee la búsqueda.
- **FR-005**: El sistema MUST ofrecer los siguientes filtros combinables entre sí (AND lógico): categoría, rango de fechas (recogida/devolución), precio máximo por día, distancia máxima en km respecto a la ubicación de búsqueda y rating mínimo del producto.
- **FR-006**: El sistema MUST ofrecer los siguientes criterios de ordenación de resultados: Relevancia, Más cercano, Precio ascendente, Precio descendente, Mejor valorado y Más popular, manteniendo los filtros aplicados al cambiar de criterio.
- **FR-007**: El sistema MUST ofrecer un filtro "Solo usuarios verificados" que, al activarse, excluya los productos cuyo arrendador no tiene el badge de verificación de identidad activo, sin exponer el estado interno de verificación de los usuarios excluidos.
- **FR-008**: El sistema MUST ofrecer una vista de mapa interactivo que sitúe un pin por cada producto visible, centrada en la ubicación de búsqueda, y que permita desplazar y hacer zoom ajustando los pins al área visible.
- **FR-009**: El sistema MUST mostrar, al hacer clic en un pin del mapa, una preview del producto con imagen principal, título, precio por día, rating y distancia, sin abandonar la página de búsqueda; desde la preview se puede navegar al detalle del producto.
- **FR-010**: El sistema MUST permitir alternar entre vista de grid (tarjetas) y vista de lista, conservando el mismo conjunto de resultados, filtros y ordenación al cambiar de vista.
- **FR-011**: El sistema MUST paginar los resultados de forma adaptativa: infinite scroll con indicador de carga en móvil y paginación numerada en desktop, con un límite razonable de resultados cargados en móvil a partir del cual se ofrece paginación explícita; el cambio de página o carga de más resultados MUST conservar filtros y ordenación.
- **FR-012**: El sistema MUST reflejar en la URL el estado completo de la búsqueda (término, ubicación, filtros, ordenación, vista y página) de forma que sea compartible y se restaure al recargar o navegar atrás/adelante, sin requerir sesión para persistir el estado.
- **FR-013**: La interfaz MUST aplicar el tema `profesional-seguro`, labels explícitos, foco visible, navegación por teclado, alternativas no cromáticas para los filtros y el mapa, y un estado vacío útil cuando no hay resultados, conforme a `constitution/DESIGN.md` y `constitution/FRONTEND.md`.
- **FR-014**: El sistema MUST servir los resultados de búsqueda priorizando Server Components para el renderizado inicial y reservando Client Components para la interactividad imprescindible (autocompletado, mapa, filtros dinámicos, infinite scroll), conforme a `constitution/FRONTEND.md`.
- **FR-015**: El sistema MUST mostrar exclusivamente listings en estado `Publicado` en los resultados de búsqueda pública, excluyendo listings en estado Borrador, En revisión, Pausado o Rechazado, así como los de cuentas suspendidas o eliminadas.
- **FR-016**: El sistema MUST mostrar skeletons o placeholders durante la carga de resultados y de las sugerencias de autocompletado, de forma que un visitante con conexión lenta nunca vea una pantalla en blanco.
- **FR-017**: El sistema MUST degradar con elegancia la vista de mapa cuando el proveedor de mapas no carga o no está disponible: la vista de lista MUST seguir siendo usable y se MUST informar al visitante de que el mapa no está disponible temporalmente.
- **FR-018**: El sistema MUST permitir proponer el inicio de sesión o registro al visitante de forma no bloqueante (ej. banner opcional o CTA secundario), pero en ningún caso MUST exigir autenticación para buscar, filtrar, ordenar, paginar o ver resultados.
- **FR-019**: El sistema MUST mostrar resultados desde la carga inicial de la landing, sin que el visitante haya introducido ningún criterio de búsqueda: por defecto se muestran resultados aleatorios de listings en estado `Publicado` en número suficiente para llenar la primera página, de forma que el visitante perciba contenido disponible nada más entrar.
- **FR-020**: El sistema MUST permitir al visitante configurar la búsqueda desde la propia página de inicio (barra de búsqueda, ubicación, categoría, filtros y ordenación) sobre los resultados iniciales aleatorios, de forma que al aplicar cualquier criterio los resultados aleatorios se sustituyan por los que cumplen los nuevos criterios sin recargar la página.
- **FR-021**: El sistema MUST distinguir internamente entre el estado "búsqueda inicial sin criterios" (resultados aleatorios) y el estado "búsqueda con criterios aplicados" (resultados filtrados/ordenados), de forma que el cambio de ordenación o filtros sobre los resultados aleatorios pase a comportarse como una búsqueda con criterios y se refleje en la URL.

### Key Entities *(include if feature involves data)*

- **Listing** (reutiliza la entidad de `002-registration` / futura feature de listings): Fuente de los resultados de búsqueda. Solo se exponen en la búsqueda pública los listings en estado `Publicado`, con sus campos públicos (título, imagen principal, precio por día, ubicación, categoría, rating, distancia).
- **Category** (reutiliza la entidad del módulo de listings): Árbol jerárquico (2-3 niveles) usado por el autocompletado de categorías y por el filtro de categoría.
- **Location/Geocoding** (entidad de soporte): Resuelve texto de ubicación a coordenadas y alimenta el autocompletado de ubicaciones; no se persiste como entidad propia salvo caché.
- **User** (reutiliza la entidad de `002-registration`): Su `verificationState` (badge verificado) determina la inclusión/exclusión cuando el filtro "Solo usuarios verificados" está activo. En la búsqueda pública solo se exponen campos públicos del arrendador (nombre, avatar, badge), nunca datos privados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los visitantes que abren la URL raíz del sitio aterrizan directamente en la página de búsqueda sin ser redirigidos a login ni requerir identificación.
- **SC-002**: El 100% de las búsquedas puede ejecutarse, filtrarse, ordenarse, paginarse y visualizarse (lista y mapa) sin sesión iniciada.
- **SC-003**: El 100% de las cargas iniciales de la landing muestra resultados aleatorios de listings publicados sin que el visitante haya introducido ningún criterio, en número suficiente para llenar la primera página.
- **SC-004**: Al menos el 90% de las búsquedas devuelve resultados en menos de 2 segundos desde que el visitante pulsa buscar, en condiciones de red normales.
- **SC-005**: El autocompletado de ubicaciones y categorías aparece en menos de 300 ms desde que el visitante deja de teclear, en condiciones de red normales.
- **SC-006**: El 100% de los filtros combinables se comporta como AND lógico y el cambio de ordenación no reinicia los filtros aplicados.
- **SC-007**: El 100% de los estados de búsqueda (término, ubicación, filtros, ordenación, vista, página) se restaura correctamente al recargar la URL o navegar atrás/adelante.
- **SC-008**: El 100% de las búsquedas públicas excluye listings que no estén en estado `Publicado` y arrendadores con cuenta suspendida o eliminada.
- **SC-009**: En pruebas de teclado y lector de pantalla, el 100% de los controles de búsqueda (barra, autocompletado, filtros, ordenación, vistas, paginación, pins del mapa) tiene nombre accesible, orden lógico, foco visible y mensajes de estado anunciados.
- **SC-010**: En el 100% de los casos en que no hay resultados, el visitante ve un estado vacío útil que sugiere relajar criterios o explorar categorías, sin errores técnicos visibles.
- **SC-011**: El 100% de las veces que el proveedor de mapas no carga, la vista de lista sigue siendo usable y se informa al visitante de la indisponibilidad temporal del mapa.
- **SC-012**: Al aplicar cualquier criterio de búsqueda sobre los resultados aleatorios iniciales, el 100% de los casos pasa a comportamiento de búsqueda con criterios (reflejado en la URL) sin recargar la página.

## Assumptions

- La feature se implementa en la aplicación web existente bajo `/development`, reutilizando los modelos `User` y `VerificationState` de `002-registration` y los modelos `Listing` y `Category` que se definan en la feature de listings (sección 2 de `docs/04-especificaciones-funcionales.md`).
- La página de búsqueda es la landing pública del sitio y vive en la URL raíz (`/`); las rutas autenticadas definidas en `003-login` siguen protegiéndose con sesión, pero la raíz es pública.
- En la carga inicial (sin criterios en la URL) el sistema muestra resultados aleatorios de listings en estado `Publicado`; el mecanismo concreto de aleatoriedad (random ordering en BD, muestreo desde un pool, etc.) se decide en el plan técnico. Esta feature define el comportamiento: hay resultados desde el inicio sin que el visitante busque nada.
- La aleatoriedad inicial es por sesión de visualización: una vez cargados los resultados aleatorios, la paginación dentro de esa misma vista debe mantener un orden coherente (sin duplicados ni pérdidas al pasar de página). El plan técnico concretará cómo se estabiliza el orden (ej. seed por sesión o snapshot del orden en cliente).
- Al aplicar cualquier criterio de búsqueda (término, ubicación, categoría, filtro u ordenación) sobre los resultados aleatorios, el sistema pasa a comportamiento de búsqueda con criterios y lo refleja en la URL; no se mezclan "aleatorio" con "filtrado".
- La búsqueda pública solo expone campos públicos de listings y arrendadores; nunca expone datos privados (email, teléfono, dirección exacta, datos de pago) del arrendador ni del arrendatario.
- El detalle del producto (sección 3.3), la tarjeta de producto (sección 3.2) y la creación/gestión de listings (sección 2) quedan fuera de esta feature; esta feature consume los datos públicos que aquellas produzcan y enlaza hacia el detalle.
- El ranking de "Relevancia" y "Más popular" se basa en señales disponibles en el catálogo (cercanía, rating, número de transacciones, vistas, recencia) con un algoritmo que se concretará en el plan técnico; esta feature define el comportamiento esperado, no la fórmula.
- El proveedor de mapas y el servicio de geocoding se concretarán en el plan técnico; esta feature asume que existe uno disponible y define el comportamiento de degradación si falla.
- La detección de ubicación por GPS respeta el consentimiento del usuario y las restricciones del navegador; nunca se geolocaliza sin permiso explícito.
- La paginación usa un tamaño de página por defecto razonable que se concretará en el plan técnico; el infinite scroll en móvil tiene un límite a partir del cual se ofrece paginación explícita para no degradar el rendimiento.
- El estado de búsqueda se codifica en la URL (query params) para que sea compartible y restaurable sin sesión; no se persiste en servidor por usuario anónimo.
- Las reglas visuales definitivas proceden de `constitution/DESIGN.md`; no se añade modo oscuro ni una segunda dirección estética en esta feature.
- La accesibilidad sigue `constitution/DESIGN.md` §7 y `constitution/FRONTEND.md`: todo control interactivo (barra, autocompletado, filtros, ordenación, vistas, paginación, pins) debe ser usable con teclado y lector de pantalla.
- El filtro "Solo usuarios verificados" se basa en el `verificationState` de identidad definido en `002-registration`; un arrendador se considera verificado cuando su verificación de identidad está activa.
- La propuesta de login/registro al visitante es opcional y no bloqueante; el producto decide en el plan técnico si se muestra un banner o un CTA secundario, pero nunca impide buscar.
