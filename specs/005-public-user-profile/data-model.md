# Data Model: Perfil de Usuario

## User

Entidad existente que representa la cuenta y su presentación pública.

| Campo | Tipo | Público | Editable por el usuario |
|---|---|---:|---:|
| `id` | `String` | Sí, como identificador de ruta | No |
| `avatarUrl` | `String?` | Sí | Sí |
| `displayName` | `String?` | Sí | Sí |
| `bio` | `String?` | Sí | Sí |
| `preferredLocation` | `String?` | No por defecto | Sí |
| `ratingAverage` | `Decimal?` | Sí | No; derivado |
| `transactionCount` | `Int?` | Sí | No; derivado |
| `responseTimeHours` | `Int?` | Solo para derivar badge | No |
| `accountStatus`, `deletedAt` | estado/fecha | No | No |

### Constraints y validación

- `displayName`: opcional, longitud máxima 100, trim y normalización de espacios.
- `avatarUrl`: opcional, longitud máxima 512, URL absoluta con protocolo permitido; no aceptar `javascript:` ni esquemas no seguros.
- `bio`: opcional, texto máximo definido por el contrato (propuesta: 1.000 caracteres), trim y sin datos de contacto requeridos por el sistema.
- `preferredLocation`: opcional, máximo 160 caracteres, descripción aproximada; no guardar dirección exacta como requisito del módulo.
- `ratingAverage` debe estar entre 0 y 5 cuando exista.
- `transactionCount` no puede ser negativo.

## PublicProfileView

Proyección de lectura, no entidad persistida. Incluye `id`, avatar, nombre visible, bio, rating, contador de transacciones, badges calculados y listings activos resumidos. Excluye email, teléfono, credenciales, sesiones, KYC y ubicación privada.

## Relaciones

- `User` 1:N `Listing`; solo listings publicados/activos y no eliminados forman parte de `PublicProfileView`.
- `User` 1:N `VerificationState`; la verificación alimenta el badge **Verificado**.