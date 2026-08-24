# Data Model: Showcase UI Kits

## ThemeOption

Representa una propuesta estética completa tomada de la spec.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Único; `clean-minimal`, `calido-sostenible`, `profesional-seguro` o `vibrante-comunitario`. |
| `name` | string | Nombre visible de la opción. |
| `description` | string | Dirección visual breve. |
| `tokens` | object | Colores, tipografías, tamaños, bordes, radios y sombras. |
| `component_treatment` | object | Tratamiento visible de botones, inputs, badges, tarjeta, modal y chat. |

Relación: una `ThemeOption` se aplica a todos los `ComponentFixture`; nunca se duplica el fixture por tema.

## VisualTokenSet

| Grupo | Contenido |
|---|---|
| `color` | Primario, secundario/acento, superficies, texto, error, éxito y warning. |
| `typography` | Familias, pesos, tamaños y alturas de línea para H1-H3, cuerpo, auxiliar y label. |
| `shape` | Grosor/color de borde, radios de control/tarjeta y sombras. |
| `focus` | Color, grosor y offset del indicador de foco. |

Reglas: cada estado de color requiere texto, icono, borde o estructura adicional; las combinaciones de texto y fondo se revisan por contraste.

## ComponentFixture

Ejemplo representativo de un componente del catálogo MVP.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Único dentro del showcase. |
| `category` | enum | `action`, `form`, `status`, `catalog`, `feedback` o `communication`. |
| `title` | string | Etiqueta visible. |
| `variants` | array | Variantes que deben poder inspeccionarse. |
| `states` | array | Estados normal, focus, disabled, loading, error, success, empty o failed según aplique. |
| `content` | object | Datos fixture de prueba, incluidos nombres y mensajes largos. |
| `accessibility_notes` | array | Label, rol, foco, alternativa cromática y responsive. |

Fixtures mínimos: botones, inputs, badges, listing card, alert/banner, selector de tema, modal y chat box. Puede incluir calendario y stepper como componentes de extensión para representar Fase 2.

## PreviewState

| Campo | Tipo | Reglas |
|---|---|---|
| `previewed_option` | string/null | Solo puede ser uno de los cuatro IDs; controla la demo activa. |
| `status` | enum | Inicialmente `pending_approval`; no cambia al cambiar de tab. |
| `selected_option` | string/null | Inicialmente `null`; no se modifica por la interacción de preview. |
| `approved_by` | string/null | Nulo hasta decisión formal. |
| `approved_at` | date/null | Nulo hasta decisión formal. |
| `decision_notes` | string/null | Nulo hasta decisión formal. |

Transiciones: `previewed_option: null -> ThemeOption.id` al seleccionar un tab; la decisión solo puede pasar de `pending_approval` a aprobada mediante un proceso posterior explícito fuera del showcase.
