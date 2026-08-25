# Feature Specification: Caso Dummy de Desarrollo (Scaffold de Referencia)

**Feature Branch**: `001-dev-scaffold-dummy-case`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "quiero que tengas en cuenta el ámbito del proyecto y los documentos de arquitectura y constitución. A partir de aquí quiero generar un primer dummy-case en el que lo importante será establecer las facilidades para el desarrollo. Al final esperaría tener un componente mínimo con todas las capas y todas las utilidades para que de forma sencilla pueda realizar pruebas en local. Además servirá de guía para el resto de desarrollos. Lo importante no será la funcionalidad, es la utilidad de cara a futuro."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Disponer de un esqueleto ejecutable de referencia (Priority: P1)

Como persona desarrolladora que se incorpora al proyecto, quiero levantar una aplicación mínima en local que atraviese todas las capas definidas en la arquitectura (interfaz, API, lógica de negocio, acceso a datos) para verificar que el entorno está correctamente configurado y entender cómo se conecta cada pieza.

**Why this priority**: Sin un caso funcional de extremo a extremo, el entorno de desarrollo no puede validarse y cada nuevo desarrollo partiría de una configuración ad-hoc sin patrón de referencia.

**Independent Test**: Una persona puede clonar el repositorio, ejecutar los comandos de instalación y arranque documentados, y obtener en su navegador una pantalla funcional que responde con datos persistidos, sin seguir pasos manuales ambiguos.

**Acceptance Scenarios**:

1. **Given** un entorno local con las dependencias instaladas, **When** la persona sigue la guía de arranque, **Then** la aplicación se levanta sin errores y muestra una interfaz mínima funcional.
2. **Given** la aplicación en ejecución, **When** la persona interactúa con el caso de ejemplo, **Then** la operación recorre la capa de interfaz, la capa API y la capa de datos de forma transparente y verificable.
3. **Given** un fallo o dato inválido, **When** la persona provoca el error, **Then** recibe un mensaje claro que permite identificar en qué capa se produjo.

### User Story 2 - Reutilizar el patrón en nuevos desarrollos (Priority: P1)

Como persona desarrolladora, quiero que el caso dummy documente de forma explícita la estructura de carpetas, las convenciones y los puntos de extensión de cada capa, para poder crear una nueva funcionalidad copiando el patrón sin tener que deducir las reglas.

**Why this priority**: El valor principal del caso no es la funcionalidad, sino convertirse en la plantilla viva que garantiza que los próximos desarrollos cumplan la constitución desde el primer commit.

**Independent Test**: Una persona puede localizar, para cada capa (interfaz, API, lógica, datos, validación, testing), el fichero de ejemplo correspondiente y entender dónde situar el equivalente de una nueva funcionalidad.

**Acceptance Scenarios**:

1. **Given** el repositorio del caso dummy, **When** la persona abre la estructura, **Then** identifica sin ambigüedad dónde vive cada capa y qué responsabilidad tiene.
2. **Given** una capa concreta, **When** la persona consulta su ejemplo, **Then** encuentra un patrón coherente con la constitución (validación, manejo de errores, nombrado, organización).
3. **Given** la documentación del caso, **When** la persona sigue los pasos para añadir una nueva entidad mínima, **Then** reproduce el patrón completo sin decisiones de estilo libre.

### User Story 3 - Probar el caso en local con utilidades sencillas (Priority: P2)

Como persona desarrolladora, quiero disponer de utilidades de pruebas locales (unitarias, de integración y semilla de datos) que se ejecuten con comandos simples, para validar cambios de forma rápida y determinista sin depender de infraestructura externa en el día a día.

**Why this priority**: Las facilidades de prueba determinan la velocidad y confianza del desarrollo; un scaffold sin pruebas no sirve como referencia de calidad.

**Independent Test**: Una persona ejecuta los comandos de prueba documentados y obtiene resultados deterministas que cubren las capas del caso dummy, sin necesitar credenciales ni servicios de producción.

**Acceptance Scenarios**:

1. **Given** las herramientas de prueba instaladas, **When** la persona ejecuta la suite local, **Then** los tests se ejecutan y finalizan con resultado verde de forma reproducible.
2. **Given** datos de ejemplo, **When** la persona ejecuta la semilla, **Then** obtiene un conjunto de datos mínimo y estable para probar el flujo de extremo a extremo.
3. **Given** un cambio en la lógica de negocio, **When** la persona ejecuta la suite, **Then** dispone de tests que fallan si se rompe el comportamiento esperado.

### Edge Cases

- El arranque sin las variables de entorno requeridas debe fallar de forma explícita y explicar qué falta, en lugar de arrancar en un estado inconsistente.
- Una petición con datos inválidos debe rechazarse en el borde (validación) sin propagar el error hacia capas internas.
- La ausencia de base de datos disponible en local debe producir un mensaje accionable (p.ej. instrucción para levantarla) y no un fallo opaco.
- Un recurso inexistente (identificador que no corresponde a ningún registro) debe devolver un estado "no encontrado" con mensaje claro, no un error genérico.
- El flujo de ejemplo debe funcionar tanto con la primera ejecución (estado vacío) como con ejecuciones sucesivas (datos ya presentes), sin romper por duplicados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El proyecto DEBE proporcionar una aplicación mínima ejecutable en local que atraviese las capas de interfaz, API, lógica de negocio y acceso a datos definidas en `docs/03-arquitectura-y-tech-stack.md`.
- **FR-002**: El scaffold DEBE incluir una entidad de ejemplo representativa del dominio que permita demostrar las operaciones de lectura y escritura de extremo a extremo.
- **FR-003**: Todo input que atraviese la capa API DEBE validarse en el borde mediante un esquema declarativo único y compartido entre capas, conforme a `constitution/BACKEND.md`.
- **FR-004**: El manejo de errores DEBE usar una jerarquía de errores de dominio explícita, sin exponer detalles internos ni trazas de pila al cliente (conforme a `constitution/BACKEND.md` §9).
- **FR-005**: La ordenación de carpetas y el nombrado DEBEN seguir la estructura y convenciones de `constitution/BACKEND.md` y `constitution/FRONTEND.md` como guía de referencia para futuros desarrollos.
- **FR-006**: El scaffold DEBE incluir utilidades de prueba unitaria e integración con comandos reproducibles y deterministas, conforme a `constitution/TESTING.md`.
- **FR-007**: El proyecto DEBE validar las variables de entorno al arranque y fallar de forma explícita si falta una variable crítica (conforme a `constitution/BACKEND.md` §10.4).
- **FR-008**: El scaffold DEBE proporcionar datos de semilla mínimos y estables para poder validar el flujo en local sin datos manuales.
- **FR-009**: El scaffold DEBE documentar de forma explícita los comandos de instalación, arranque y prueba, así como los puntos de extensión de cada capa.
- **FR-010**: Los campos de auditoría (`createdAt`, `updatedAt`) DEBEN estar presentes en la entidad de ejemplo, conforme a `constitution/DATABASE.md` §7.2.
- **FR-011**: El caso dummy DEBE ser autocontenido en cuanto a configuración local, sin depender de credenciales ni servicios de producción para su funcionamiento y prueba.

### Key Entities *(include if feature involves data)*

- **Entidad de ejemplo (dummy)**: representa el recurso mínimo del dominio sobre el que se demuestra el patrón completo. Atributos mínimos: identificador único, un campo de negocio editable, un estado, y marcas temporales de creación/modificación. No tiene reglas de negocio complejas; su propósito es demostrar la trazabilidad entre capas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona nueva puede pasar de "repositorio clonado" a "aplicación funcionando en local" en menos de 15 minutos siguiendo únicamente la documentación.
- **SC-002**: El flujo de extremo a extremo del caso dummy es verificable en local con un número de pasos manuales mínimo (arranque + una interacción).
- **SC-003**: La suite de pruebas locales se ejecuta con un único comando y produce resultados deterministas (verdes) en todas sus ejecuciones.
- **SC-004**: El 100 % de las capas definidas en la arquitectura tiene al menos un ejemplo localizable y documentado en el scaffold.
- **SC-005**: Un fallo inyectado en cualquier capa produce un error identificable en esa capa de forma clara (no un fallo genérico u opaco).
- **SC-006**: La estructura del caso cumple las convenciones obligatorias de la constitución (validación, errores, auditoría, nombrado) sin desviaciones injustificadas.

## Assumptions

- El stack de referencia es el definido en `docs/03-arquitectura-y-tech-stack.md` (Next.js App Router + tRPC + Prisma + PostgreSQL + Zod), y el scope del dummy se limita a la web app, sin incluir la app móvil ni el dashboard de administración en esta primera iteración.
- La funcionalidad del caso dummy es deliberadamente mínima (una única entidad de ejemplo) porque el objetivo es la utilidad de desarrollo futura, no la cobertura de negocio.
- La elección concreta de la entidad de ejemplo se tomará en fase de planificación; aquí solo se define que debe ser representativa y mínima.
- El entorno local usará una base de datos PostgreSQL efímera o local; no se presupone un proveedor cloud específico para el desarrollo diario.
- Los servicios externos de la plataforma (pagos, KYC, seguros, búsqueda, mapas) están fuera del alcance de este caso dummy y no se integran.
- Se asume que el tema visual `profesional-seguro` y el catálogo de componentes (spec `00-visual-components-ui-kit`) están disponibles como base para la capa de interfaz, sin redefinirlos en este caso.