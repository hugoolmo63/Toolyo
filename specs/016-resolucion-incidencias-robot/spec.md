# Feature Specification: Resolución automática de incidencias por robot

**Feature Branch**: `016-resolucion-incidencias-robot`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "quisiera automatizar el proceso de resolucion de incidencias con github actions. El proceso que tengo en mente es el siguiente:
- añado tarea a github
- asigno la tarea al robot
- actions dispara el evento para
  - descargar proyecto
  - en un entorno con speckit
  - analiza incidencia con skills apropiadas o extensiones de speckit
  - resuelve
  - sube PR para revision por humano"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resolver una incidencia asignándola al robot (Priority: P1)

Como mantenedor del proyecto, quiero etiquetar una incidencia del repositorio con la etiqueta `TO_LOCO`, de forma que el sistema descargue el proyecto, analice la incidencia con las herramientas de especificación disponibles, implemente la solución y abra una solicitud de cambios (pull request) lista para mi revisión, sin intervención adicional.

**Why this priority**: Es el flujo completo que aporta el valor principal: convertir una incidencia en una propuesta de cambio revisable sin escribir código manualmente.

**Independent Test**: Crear una incidencia sencilla y bien descrita, aplicarle la etiqueta `TO_LOCO`, esperar a que el proceso automático finalice y comprobar que existe una pull request que enlaza a la incidencia, contiene los cambios propuestos y una descripción de lo realizado.

**Acceptance Scenarios**:

1. **Given** una incidencia abierta con título y descripción suficientes, **When** el mantenedor le aplica la etiqueta `TO_LOCO`, **Then** el proceso automático se inicia y deja constancia visible (comentario o estado) de que el trabajo ha comenzado.
2. **Given** que el proceso automático se ha iniciado, **When** el robot completa su análisis y resolución, **Then** abre una pull request que referencia la incidencia original, resume los cambios realizados y queda pendiente de revisión humana.
3. **Given** una pull request generada por el robot, **When** un humano la revisa, **Then** puede aprobarla, solicitar cambios o cerrarla con el mismo flujo de revisión que cualquier otra contribución.
4. **Given** una incidencia que no tiene la etiqueta `TO_LOCO`, **When** se crea, edita o comenta, **Then** no se inicia ningún proceso automático.

---

### User Story 2 - Comprender el razonamiento y las decisiones del robot (Priority: P2)

Como revisor humano, quiero que la pull request y/o la incidencia incluyan trazabilidad del análisis realizado por el robot (qué herramientas o skills utilizó, qué interpretó de la incidencia y qué supuestos aplicó), de forma que pueda revisar con contexto y detectar malentendidos antes de aprobar.

**Why this priority**: La revisión humana es la puerta de calidad; sin trazabilidad el revisor debe adivinar la intención del robot y el riesgo de aprobar cambios erróneos aumenta.

**Independent Test**: Tras una resolución automática, inspeccionar la pull request y la incidencia y verificar que incluyen un resumen del análisis, las decisiones tomadas y cualquier supuesto o punto ambiguo encontrado.

**Acceptance Scenarios**:

1. **Given** una pull request generada por el robot, **When** el revisor abre su descripción, **Then** encuentra el resumen de la incidencia interpretada, los cambios principales y los supuestos aplicados.
2. **Given** una incidencia ambigua o incompleta procesada por el robot, **When** el robot genera cambios, **Then** la pull request identifica explícitamente los puntos que el robot interpretó por su cuenta para facilitar la revisión.

---

### User Story 3 - Gestionar incidencias que el robot no puede resolver (Priority: P3)

Como mantenedor, quiero que el sistema me avise de forma visible cuando el robot no consiga resolver una incidencia (por falta de información, incidencia demasiado compleja o errores durante el proceso), de forma que la incidencia no quede en un estado incierto y pueda retomarla manualmente.

**Why this priority**: Garantiza que ninguna incidencia quede "perdida" en el proceso automático y mantiene la confianza en el flujo; es complementario al flujo principal.

**Independent Test**: Asignar al robot una incidencia deliberadamente irresoluble (p. ej. descripción vacía o contradictoria) y verificar que la incidencia queda marcada claramente como no resuelta con la explicación del motivo.

**Acceptance Scenarios**:

1. **Given** una incidencia cuya descripción es insuficiente para actuar, **When** el robot la analiza, **Then** deja un comentario en la incidencia explicando qué información falta y la marca de forma reconocible (etiqueta de estado) sin crear una pull request.
2. **Given** que el proceso automático falla por un error interno, **When** el fallo se produce, **Then** la incidencia refleja el estado de fallo y el motivo general, y el mantenedor puede reintentar reaplicando la etiqueta `TO_LOCO` o mediante una acción explícita.
3. **Given** una incidencia que excede el alcance de lo que el robot puede resolver con seguridad, **When** el robot lo detecta, **Then** se detiene sin aplicar cambios parciales y lo comunica en la incidencia.

---

### Edge Cases

- Se retira la etiqueta `TO_LOCO` o se cierra la incidencia mientras el robot está trabajando.
- La misma incidencia recibe la etiqueta `TO_LOCO` varias veces (evitar trabajos duplicados o pull requests duplicadas).
- La incidencia describe un cambio que afecta a información sensible o credenciales.
- El robot produce cambios que no superan las verificaciones automáticas del repositorio (tests, lint, compilación).
- Dos incidencias distintas etiquetadas con `TO_LOCO` modifican las mismas partes del proyecto.
- La incidencia requiere acceso a recursos externos o secretos que el robot no tiene.
- La etiqueta `TO_LOCO` se aplica a una pull request en lugar de una incidencia (el sistema debe ignorarla o tratarla explícitamente).
- El tiempo de ejecución del proceso excede los límites razonables del entorno de ejecución.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST disponer de una etiqueta reconocible (`TO_LOCO`) que actúa como disparador del proceso sobre incidencias del repositorio.
- **FR-002**: El sistema MUST iniciar el proceso de resolución automática únicamente cuando se aplica la etiqueta `TO_LOCO` a una incidencia abierta.
- **FR-003**: El sistema MUST obtener una copia de trabajo del proyecto en un entorno aislado y limpio para cada incidencia procesada.
- **FR-004**: El entorno de ejecución MUST disponer del conjunto de herramientas de especificación y skills apropiadas para analizar y resolver incidencias; el robot MUST intentar cualquier incidencia etiquetada con `TO_LOCO` y determinar caso a caso si puede resolverla.
- **FR-005**: El robot MUST registrar de forma visible en la incidencia cuándo comienza y cuándo finaliza el trabajo, indicando el resultado (pull request creada, información insuficiente o fallo).
- **FR-006**: El robot MUST crear una pull request por incidencia resuelta que referencie la incidencia de origen y describa los cambios, el análisis realizado y los supuestos aplicados.
- **FR-007**: Las pull requests generadas por el robot MUST permanecer bloqueadas hasta la aprobación de un revisor humano; el robot no MUST fusionar sus propios cambios.
- **FR-008**: El sistema MUST ejecutar las verificaciones automáticas del repositorio (pruebas, lint, compilación) sobre los cambios propuestos antes de considerar la pull request lista para revisión.
- **FR-009**: Cuando el robot no pueda resolver una incidencia, MUST comunicarlo en la propia incidencia con el motivo general, sin crear una pull request y sin dejar la incidencia en estado ambiguo.
- **FR-010**: El sistema MUST impedir la ejecución simultánea o duplicada del proceso para una misma incidencia.
- **FR-011**: El robot MUST operar con credenciales de alcance mínimo necesario (lectura de incidencias, escritura de ramas/pull requests/comentarios) y MUST no exponer secretos del repositorio en comentarios ni en las pull requests.
- **FR-012**: El sistema MUST permitir al mantenedor cancelar o reintentar el proceso de una incidencia mediante acciones explícitas (retirar/reaplicar la etiqueta `TO_LOCO` u orden equivalente).

### Key Entities *(include if feature involves data)*

- **Incidencia**: Trabajo descrito por un humano en el rastreador de incidencias del repositorio; contiene título, descripción, estado, etiquetas y comentarios. Es la unidad de entrada del proceso.
- **Etiqueta disparadora**: `TO_LOCO` — su aplicación a una incidencia actúa como disparador del flujo automático y su retirada como señal de cancelación.
- **Trabajo de resolución**: Ejecución aislada del proceso para una incidencia concreta; incluye su estado (en curso, completada, fallida), el registro de análisis y las herramientas/skills utilizadas.
- **Solicitud de cambios**: Resultado revisable del trabajo de resolución; referencia a la incidencia, rama de cambios, descripción estructurada y estado de revisión humana.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En al menos el 70% de las incidencias bien formadas (título claro y descripción suficiente) etiquetadas con `TO_LOCO`, se genera una pull request sin intervención humana intermedia.
- **SC-002**: El tiempo medio desde la aplicación de la etiqueta hasta la apertura de la pull request es inferior a 60 minutos para incidencias de complejidad baja-media.
- **SC-003**: El 100% de las incidencias etiquetadas con `TO_LOCO` termina en un estado visible y no ambiguo: pull request creada, marcada como información insuficiente o marcada como fallo, con su motivo.
- **SC-004**: El 100% de las pull requests generadas por el robot incluye referencia a la incidencia de origen y un resumen del análisis y supuestos aplicados.
- **SC-005**: Al menos el 80% del tiempo que un mantenedor dedicaba a incidencias aptas para el robot se reduce tras adoptar el flujo (medido por percepción del mantenedor tras un período de uso).
- **SC-006**: Ninguna pull request del robot se fusiona sin aprobación humana explícita (0 casos de auto-fusión).

## Assumptions

- El rastreador de incidencias y la plataforma de automatización son los proporcionados por el propio alojamiento del repositorio (GitHub Issues y GitHub Actions), tal como describe la petición.
- El "entorno con speckit" se entiende como un entorno de ejecución que dispone del toolkit de especificación (speckit) con sus skills y extensiones; el detalle de aprovisionamiento es decisión de planificación.
- El disparador es la etiqueta `TO_LOCO` sobre incidencias; no se requiere una cuenta robot dedicada para el disparo (la autoría de commits usa una identidad de bot genérica).
- Las verificaciones automáticas existentes del repositorio (tests, lint, compilación) se reutilizan como puerta de calidad de las pull requests generadas.
- El robot actúa sobre el mismo repositorio en el que reside la incidencia; la resolución multi-repositorio queda fuera de alcance.
- El mantenedor conserva la decisión final de fusión; el robot nunca auto-fusiona ni fuerza cambios en ramas protegidas.
- Las incidencias que requieran secretos o acceso a servicios externos no disponibles en el entorno se tratarán como no resolubles y se comunicarán como tales.
- Los costes de ejecución del agente/entorno (minutos de CI, llamadas a modelos) se asumen aceptables y no forman parte de los criterios de éxito de esta versión.
