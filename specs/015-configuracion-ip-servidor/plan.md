# Implementation Plan: Configuración de IP del servidor en aplicaciones móviles

**Branch**: `015-configuracion-ip-servidor` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-configuracion-ip-servidor/spec.md`

## Summary

Permitir que las aplicaciones móviles Android e iPhone consulten, validen, guarden, utilicen y restablezcan una dirección de servidor personalizada por instalación. La interfaz de la aplicación se distribuirá dentro del paquete nativo para que la pantalla de configuración funcione aunque el servidor no esté accesible; la dirección configurable se utilizará únicamente como endpoint de API. La solución aprovechará la resolución de endpoint existente, incorporará una interfaz de configuración visible solo en el shell nativo y actualizará el endpoint efectivo y el estado de conectividad cuando el usuario guarde o restablezca el valor. Las distribuciones web y cualquier otra plataforma conservarán el comportamiento actual.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 14; configuración nativa mediante Capacitor 8

**Primary Dependencies**: React, Capacitor Core/Network, Vitest, Testing Library, Zod ya disponible en el proyecto

**Storage**: Preferencia local del dispositivo mediante `localStorage`; no se requiere persistencia en backend ni sincronización entre dispositivos

**Testing**: Vitest para lógica unitaria y React Testing Library para la interfaz; Playwright/E2E si existe un flujo móvil navegable que lo permita

**Target Platform**: Shells nativos Android e iPhone; la configuración no se expone en web ni en otras distribuciones

**Project Type**: Aplicación web Next.js empaquetada como aplicación móvil multiplataforma

**Performance Goals**: Mostrar la pantalla de configuración sin bloquear el arranque y aplicar un cambio guardado en la siguiente conexión; validación local en menos de 100 ms en condiciones normales

**Constraints**: Reutilizar las reglas de seguridad existentes; no permitir que la configuración de producción habilite overrides inseguros; rechazar valores vacíos, formatos inválidos, esquemas no permitidos y puertos fuera de rango; mantener el endpoint funcional anterior cuando falle una nueva prueba de conexión

**Scale/Scope**: Una preferencia por instalación para Android/iPhone, un nuevo flujo de configuración y cobertura de validación, persistencia, reset, error de conectividad y exclusión de plataformas no móviles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Directorio `constitution/` como fuente de verdad**: PASS. El diseño se alinea con la constitución y no modifica documentos normativos.
- **Gobernanza por capas**: PASS. El cambio está limitado al frontend/shell nativo y a las reglas de seguridad y testing aplicables; no introduce cambios de backend o base de datos.
- **Normas declarativas y verificables**: PASS. La spec, los contratos y la guía definen entradas, resultados y criterios verificables.
- **Responsabilidad por dominio**: PASS. Se consideran frontend, diseño/accesibilidad, seguridad y testing; no se requiere modelo persistente en servidor.
- **Revisión de cumplimiento**: PASS condicionado a la ejecución de pruebas unitarias y de interfaz descritas en quickstart.
- **Seguridad por diseño**: PASS. Se conservan HTTPS en producción, restricciones de cleartext para redes locales y la prohibición existente de runtime override en builds de producción.

## Project Structure

### Documentation (this feature)

```text
specs/015-configuracion-ip-servidor/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mobile-endpoint-settings.md
└── tasks.md              # Creado por /speckit-tasks
```

### Source Code (repository root)

```text
development/
├── src/
│   ├── components/
│   │   └── native/
│   │       ├── native-shell-provider.tsx
│   │       ├── network-status-banner.tsx
│   │       └── mobile-endpoint-settings.tsx       # Nuevo flujo de configuración
│   └── lib/
│       └── native/
│           ├── endpoint-config.ts                 # Validación, persistencia y endpoint efectivo
│           └── platform.ts                         # Android/iPhone frente a web
├── tests/
│   └── unit/
│       └── native/
│           ├── endpoint-config.test.ts            # Extender cobertura de reglas
│           └── mobile-endpoint-settings.test.tsx  # Nuevo contrato de UI
├── next.config.mjs
└── capacitor.config.ts
```

**Structure Decision**: Se mantiene la estructura existente de la aplicación Next.js/Capacitor. La lógica de endpoint continúa en `src/lib/native`, el flujo visible se añade a `src/components/native` y las pruebas siguen la organización unitaria actual. No se crean tablas ni endpoints de backend porque la preferencia es local a cada instalación.

## Complexity Tracking

No hay violaciones de la constitución ni complejidad adicional que justificar.

## Post-Design Constitution Check

- **Fuente de verdad y gobernanza por capas**: PASS. Los artefactos de diseño mantienen la decisión dentro del shell móvil y no introducen una fuente normativa o de datos paralela.
- **Reglas verificables**: PASS. El modelo define validaciones, transiciones y fallback; el contrato define visibilidad, entradas y resultados; quickstart define comprobaciones reproducibles.
- **Responsabilidad por dominio**: PASS. Frontend/shell nativo, seguridad y testing quedan cubiertos; no se requiere backend ni base de datos.
- **Seguridad por diseño**: PASS. El contrato impide runtime override en producción, exige HTTPS para producción y limita HTTP a redes locales en builds internas.
- **Puertas de testing**: PASS condicionado a ejecutar las pruebas unitarias y de componente del quickstart durante la implementación.

**Gate result**: PASS. El diseño está listo para generar `tasks.md` con `/speckit-tasks`.
