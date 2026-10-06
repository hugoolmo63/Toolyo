# Data Model: Configuración de IP del servidor en aplicaciones móviles

## MobileEndpointPreference

Preferencia local que representa la dirección personalizada del servidor para una instalación Android o iPhone.

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `overrideUrl` | string | No | Dirección personalizada normalizada. Ausente o nula significa que se usa el valor predeterminado de la distribución. |
| `source` | enum | Sí | `default` cuando se usa el valor de la distribución; `custom` cuando existe un override guardado. |
| `lastValidatedAt` | timestamp | No | Momento de la última validación local/conectividad exitosa, si se conserva como metadato. |

### Storage

- Ámbito: instalación/dispositivo actual.
- Clave lógica: `toolyo.mobile.endpointOverride`.
- El valor persistido debe ser solo la dirección normalizada; `source` se deriva de la presencia del valor y no requiere una segunda clave.
- El almacenamiento no contiene credenciales, tokens ni secretos.
- Si el almacenamiento no está disponible, la aplicación mantiene el endpoint predeterminado y muestra un error no bloqueante cuando corresponda.

## MobileEndpointConfig

Configuración efectiva derivada de las variables de build y de la preferencia local.

| Field | Type | Description |
|---|---|---|
| `baseUrl` | string | Dirección predeterminada inyectada en la distribución móvil. |
| `allowRuntimeOverride` | boolean | Indica si la distribución permite cambiar la dirección desde la aplicación. Debe ser falso en producción. |
| `allowCleartext` | boolean | Indica si las reglas de la distribución permiten HTTP en claro, únicamente bajo las condiciones existentes. |
| `effectiveUrl` | string | `overrideUrl` si existe y está permitido; en otro caso `baseUrl`. |

## Validation Rules

1. El valor se recorta antes de validarse.
2. El valor vacío se interpreta como una solicitud de restablecimiento, pero no reemplaza una configuración válida hasta que el usuario confirme la acción.
3. La dirección debe ser una URL absoluta con host válido.
4. Solo se permiten `https://` en producción; `http://` se admite únicamente para hosts de red local y builds internas autorizadas.
5. El puerto, si está presente, debe ser numérico y estar entre 1 y 65535.
6. No se permiten credenciales embebidas, comodines de host ni destinos que violen las reglas de navegación segura existentes.
7. Una dirección que no sea alcanzable no se convierte en el nuevo endpoint efectivo; se conserva la última configuración funcional.
8. Las reglas solo se aplican al shell Android/iPhone. En web, el valor no se lee ni se muestra como configuración editable.

## State Transitions

```text
default
  ├─ save(valid + reachable custom URL) ─> custom
  └─ reset/clear ------------------------> default

custom
  ├─ save(valid + reachable custom URL) ─> custom (reemplaza valor)
  ├─ save(invalid or unreachable URL) ----> custom (conserva valor anterior)
  └─ reset/clear ------------------------> default
```

## Relationships

- `MobileEndpointPreference` se consume por `NativeShellProvider`.
- `NativeShellProvider` entrega `effectiveUrl` al banner de conectividad y a los consumidores de solicitudes del cliente móvil.
- No existe relación con entidades de usuario, listings o tablas del backend.
