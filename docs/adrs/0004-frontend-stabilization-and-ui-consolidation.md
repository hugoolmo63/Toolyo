---
title: "Estabilización del Frontend y Consolidación del UI Kit previo al Módulo de Reservas"
status: accepted
date: 2026-09-28
authors: [@toolyo-team]
reviewers: []
tags: [arquitectura, frontend, ui-kit, estabilización]
related: [[001-adr-template]], [[010-modulo-reservas]]
supersedes: null
---

# ADR 0004: Estabilización del Frontend y Consolidación del UI Kit previo al Módulo de Reservas

## Estado
Aceptado

## Contexto
Tras completar el Módulo 012 (Backoffice Administrativo) y reorganizar la estructura de `specs/`, el proyecto cuenta con 26 páginas en Next.js App Router. Sin embargo, la auditoría del frontend reveló inconsistencias visuales, navegación parcialmente deshabilitada en el Dashboard ("Próximamente"), uso directo de etiquetas `<img>` sin optimizar, enlaces internos `<a href>` que provocan recargas de página y falta de un UI Kit centralizado para componentes reutilizables (`Button`, `Modal`, `Card`).

Antes de implementar la lógica del Módulo 010 (Reservas MVP), se decide pausar el desarrollo de backend para estabilizar, pulir y consolidar la interfaz de usuario existente.

## Decisión
Implementar un Plan de Estabilización Frontend en tres (3) fases consecutivas:

1. **Fase 1: Correcciones Críticas y Navegación (Inmediato)**
   - Habilitar "Mis alquileres" (`/dashboard/bookings`) y "Mi perfil" (`/profile`) en el Dashboard.
   - Reestructurar y estilar la pantalla de configuración 2FA (`/admin/setup-2fa`).
   - Migrar enlaces internos de `<a href>` a `<Link href>` de Next.js.
   - Corregir el hook `useEffect` con dependencias incompletas en `preferred-location-map.tsx`.

2. **Fase 2: Consolidación del UI Kit y Componentes Compartidos**
   - Crear componentes primitivos en `src/components/ui/` (`<Button>`, `<Modal>`, `<Card>`, `<Input>`).
   - Unificar botones y modales clave (`login-dialog.tsx`, `action-buttons.tsx`).
   - Estandarizar estados de carga, deshabilitado, foco accesible y variante semántica.

3. **Fase 3: Optimización de Rendimiento y Deuda Técnica**
   - Migrar elementos `<img>` restantes a `next/image`.
   - Limpiar advertencias de build y referencias obsoletas en documentación (`/checkout`).

## Consecuencias

### Positivas
- Garantiza una experiencia de usuario 100% navegable, coherente y funcional en todas las pestañas.
- Elimina la deuda técnica visual antes de acoplar nuevos flujos de negocio.
- Facilita la construcción de futuras pantallas al contar con componentes de UI Kit unificados.

### Negativas
- Pospone temporalmente la implementación del Módulo 010 de Reservas.
- Requiere una migración incremental de componentes existentes, con posible trabajo duplicado durante la transición.

## Alternativas Consideradas

### Alternativa 1
Continuar directamente con la implementación del Módulo 010 y corregir las inconsistencias visuales durante su desarrollo.

Se rechaza porque ampliaría la deuda técnica, duplicaría patrones de interfaz y haría más costosa la validación de los nuevos flujos de reserva.

### Alternativa 2
Reescribir todo el frontend con un framework o UI Kit externo antes de continuar con el roadmap.

Se rechaza porque introduciría un cambio tecnológico de alto riesgo y alcance innecesario. La decisión mantiene Next.js, Tailwind y los tokens CSS existentes, consolidándolos de forma incremental.

## Notas de Implementación
- Ejecutar la Fase 1 antes de iniciar nuevas pantallas del Módulo 010.
- Mantener compatibilidad con las rutas y contratos actuales del App Router.
- Validar cada fase con `npx tsc --noEmit`, `npm run build` y una revisión visual de las rutas afectadas.
- Priorizar componentes compartidos sin bloquear la migración de features ya existentes.
- No eliminar las referencias a `/checkout` hasta confirmar que no existen consumidores activos; después, actualizar la documentación obsoleta.

## Referencias
- [[001-adr-template]]
- [[010-modulo-reservas]]
- [`development/src/app/`](../../development/src/app/)
- [`development/src/components/`](../../development/src/components/)
- [`development/src/styles/globals.css`](../../development/src/styles/globals.css)