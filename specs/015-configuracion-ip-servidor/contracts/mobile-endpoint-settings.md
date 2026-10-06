# Contract: Configuración del endpoint móvil

## Scope

Contrato de comportamiento para el control de configuración visible únicamente en Android e iPhone cuando la distribución permite overrides en runtime.

## Visibility

- `platform = android` o `platform = ios` y `allowRuntimeOverride = true`: mostrar el control.
- `platform = web` o cualquier otra plataforma: no renderizar el control.
- `allowRuntimeOverride = false`: no permitir edición aunque la aplicación sea móvil; el endpoint predeterminado permanece activo.

## View Contract

La vista debe ofrecer:

1. Dirección actual efectiva o predeterminada.
2. Campo editable para una nueva dirección.
3. Acción `Guardar`.
4. Acción `Restablecer` cuando exista un override personalizado.
5. Estado accesible de validación, guardado y error de conectividad.

Los mensajes deben ser comprensibles y no mostrar credenciales ni información sensible del entorno.

## Save Contract

### Input

```text
url: string
```

### Success

Cuando `url` es válida y el servidor responde:

- Normalizar y persistir la dirección.
- Actualizar el endpoint efectivo sin reinstalar ni reiniciar la aplicación.
- Mostrar confirmación de que la configuración se aplicó.
- Ejecutar de nuevo la evaluación de conectividad.

### Validation Error

Cuando `url` está vacío, tiene formato inválido, usa un esquema no permitido o tiene un puerto inválido:

- No persistir el nuevo valor.
- Conservar la última configuración funcional.
- Mostrar el motivo y cómo corregirlo.

### Unreachable Error

Cuando la dirección tiene formato válido pero el servidor no responde:

- No reemplazar el endpoint efectivo.
- Conservar la última configuración funcional.
- Mostrar que el servidor no es accesible y permitir reintentar o editar.

## Reset Contract

Al confirmar `Restablecer`:

- Eliminar el override local.
- Recuperar la dirección predeterminada de la distribución.
- Actualizar el endpoint efectivo.
- Revaluar conectividad.
- Mostrar confirmación del restablecimiento.

## Security Contract

- Las builds de producción no pueden habilitar edición en runtime.
- HTTPS es obligatorio para endpoints de producción.
- HTTP solo se permite para destinos locales y builds internas autorizadas.
- No se aceptan comodines de navegación ni se amplían dominios permitidos automáticamente.

## Acceptance Mapping

| Contract behavior | Requirements |
|---|---|
| Visibility by platform and build flag | FR-001, FR-002, FR-009 |
| Validation before persistence | FR-003, FR-007 |
| Persistence and effective endpoint update | FR-004, FR-005 |
| Clear errors and fallback | FR-006, FR-007 |
| Reset to distribution default | FR-008 |
| Existing connection security rules | FR-010 |
