<!--
Sync Impact Report
==================
Version change: (unset placeholder) → 1.0.0
  - Initial constitution materialization. The previous `.specify/memory/constitution.md`
    contained only the untouched `constitution-template` placeholders.
Modified principles: N/A (initial version — no prior principles to rename).
Added sections:
  - Core Principles (5): Directory-as-Source-of-Truth, Layered Governance,
    Testable & Declarative Rules, Area Ownership, Compliance Review.
  - Governing Documents
  - Development Workflow & Quality Gates
  - Governance (amendment procedure, versioning policy, compliance expectations).
Removed sections: none.
Follow-up TODOs: none.
-->

# Toolyo Constitution

La presente constitución define los principios y normas no negociables que rigen
todo desarrollo y diseño del proyecto **Toolyo**. Los documentos del directorio
`constitution/` son la fuente única de verdad normativa del proyecto y deben ser
consultados y respetados antes y durante cualquier implementación o decisión de
diseño.

## Core Principles

### I. Directorio `constitution/` como fuente de verdad

Los documentos del directorio `constitution/` son principios rectores obligatorios.
Todo desarrollo (backend, frontend, base de datos), todo diseño (visual, UX) y toda
decisión técnica DEBE alinearse con lo establecido en esos documentos. Cuando exista
conflicto entre una práctica puntual y lo dispuesto en el directorio, prevalece el
directorio salvo modificación formal tramitada por el proceso de enmienda descrito en
la sección de Governance.

### II. Gobernanza por capas

Cada documento cubre un dominio específico y complementario, sin solapamientos
ambiguos:
- `BACKEND.md` — API, capa de aplicación, capa de datos y servicios externos.
- `DATABASE.md` — modelado, operaciones, migraciones y optimización de PostgreSQL/Prisma.
- `DESIGN.md` — tokens visuales, tema `profesional-seguro` y accesibilidad.
- `FRONTEND.md` — Next.js App Router, componentes y estado del cliente.
- `SECURITY.md` — seguridad transversal (autenticación, autorización, protección de datos).
- `TESTING.md` — pirámide de testing, herramientas y criterios de calidad.

Estos documentos son la fuente de la que derivan las reglas concretas de cada área.
Ninguna implementación puede contradecir lo que su documento de dominio establece.

### III. Normas declarativas y verificables

Toda regla del directorio `constitution/` DEBE ser declarativa, verificable y libre de
ambigüedad. Se prohíben las normas en lenguaje vago ("debería", "se recomienda") cuando
definen comportamientos obligatorios; en su lugar se usan imperativos normativos (MUST /
DEBE) con su justificación explícita cuando no sea evidente.

### IV. Responsabilidad por dominio

Cada área funcional tiene un documento propietario. Los cambios que afecten a un dominio
DEBEN revisarse contra su documento correspondiente. Si una decisión de diseño afecta a
varios dominios (p. ej. una entidad de datos que también define contratos de API y de UI),
la decisión DEBE cumplir simultáneamente todos los documentos implicados.

### V. Revisión de cumplimiento

Todo Pull Request, revisión de código y revisión de diseño DEBE verificar explícitamente
el cumplimiento de los documentos aplicables del directorio `constitution/`. La
complejidad que se aparte de estas normas DEBE justificarse y documentarse.

## Governing Documents

Los siguientes documentos son de obligado cumplimiento y referencia en todo el ciclo de
vida del proyecto. Deben considerarse junto a la arquitectura definida en
`docs/03-arquitectura-y-tech-stack.md`:

- `constitution/BACKEND.md` — principios rectores, organización del código, estilo,
  capa API (tRPC) y validación del backend.
- `constitution/DATABASE.md` — modelado, tipos de datos, relaciones, constraints,
  índices y performance de la base de datos.
- `constitution/DESIGN.md` — filosofía de diseño, paleta de colores, tipografía,
  tokens visuales y accesibilidad (tema `profesional-seguro`).
- `constitution/FRONTEND.md` — principios server-first, organización del código,
  estilo, componentes y estado del cliente.
- `constitution/SECURITY.md` — autenticación, autorización, protección de datos,
  seguridad de APIs y cumplimiento GDPR.
- `constitution/TESTING.md` — pirámide de testing, unitarios, integración y E2E.

Cuando un documento referencia a otro (p. ej. `FRONTEND.md` exige `DESIGN.md`), esa
referencia es vinculante y forma parte de la norma.

## Development Workflow & Quality Gates

Todo trabajo de desarrollo o diseño debe pasar por las siguientes compuertas de calidad
antes de considerarse completado:

1. **Consulta previa de los documentos.** Antes de implementar o diseñar, leer y aplicar
   los documentos del directorio `constitution/` correspondientes al dominio en cuestión.
2. **Cumplimiento en revisión.** Las revisiones de código y de diseño validan el
   cumplimiento explícito de las normas aplicables.
3. **Puertas de testing.** El testing sigue la pirámide definida en `TESTING.md`
   (unitarios, integración y E2E) con los tiempos y herramientas establecidos.
4. **Seguridad por diseño.** Ninguna funcionalidad se considera lista si incumple
   `SECURITY.md`; la seguridad no se añade al final, se define en cada decisión.

## Governance

Esta constitución tiene primacía sobre cualquier práctica de desarrollo no formalizada.
Cualquier conflicto entre documentos, políticas o convenciones se resuelve a favor de lo
dispuesto en esta constitución y en el directorio `constitution/`.

**Procedimiento de enmienda:**
1. Toda modificación a esta constitución o a los documentos del directorio
   `constitution/` DEBE documentarse, justificarse y revisarse.
2. Las enmiendas se registran con un incremento de versión semántica (ver política).
3. Un cambio que retire o redefina un principio rector constituye una enmienda MAJOR.

**Política de versionado (semántico):**
- **MAJOR**: eliminación o redefinición incompatible de principios o normal de gobernanza.
- **MINOR**: adición de un principio o expansión sustancial de la guía.
- **PATCH**: aclaraciones, redacción, correcciones tipográficas o refinamientos no semánticos.

**Expectativas de revisión de cumplimiento:**
- Toda PR/revisión DEBE verificar el cumplimiento de los documentos aplicables.
- Las desviaciones DEBEN estar justificadas y documentadas de forma explícita.
- El directorio `constitution/` es la guía de desarrollo en tiempo de ejecución del
  proyecto y DEBE mantenerse como única fuente de verdad normativa.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): fecha de adopción original no conocida | **Last Amended**: 2026-08-25
