# Guía de Estilo — Tema `profesional-seguro`

> **Versión:** 1.0  
> **Alcance:** Todo el proyecto Toolyo  
> **Modo de aplicación:** Atributo `data-theme="profesional-seguro"` en el elemento raíz (`<html>` o contenedor de la app).

---

## 1. Filosofía de Diseño

El tema **profesional-seguro** transmite **confianza, estabilidad y claridad**. Está pensado para interfaces B2B, herramientas de gestión, dashboards y cualquier flujo donde el usuario delegue datos sensibles o tome decisiones importantes.

### Principios rectores

| Principio | Qué implica en la UI |
|-----------|----------------------|
| **Claridad sobre ornamento** | Cada elemento debe justificar su existencia. Sin ruido visual. |
| **Predicibilidad** | Los patrones de interacción se repiten de forma consistente. Nada sorprende al usuario. |
| **Jerarquía tipográfica** | El tamaño y peso de la fuente guían la atención antes que el color. |
| **Densidad moderada** | Espacio suficiente para respirar, pero sin desperdiciar pantalla en herramientas densas. |
| **Feedback inmediato** | Todo cambio de estado se comunica en ≤100 ms con transiciones suaves. |

---

## 2. Paleta de Colores

### 2.1 Escala primaria (Azul Institucional)

El azul es el ancla emocional del tema: estabilidad, tecnología y confianza.

| Token | Hex | Uso |
|-------|-----|-----|
| `--ps-primary-50` | `#EEF4FF` | Fondos de hover suaves, badges informativos |
| `--ps-primary-100` | `#D9E6FF` | Fondos de sección destacada |
| `--ps-primary-200` | `#B3D1FF` | Bordes de foco (focus rings) |
| `--ps-primary-300` | `#80B3FF` | Ilustraciones, iconos secundarios |
| `--ps-primary-400` | `#4D94FF` | Estados activos, enlaces |
| `--ps-primary-500` | `#1A75FF` | **Principal**. Botones primarios, enlaces principales |
| `--ps-primary-600` | `#005CE6` | Hover de botones primarios |
| `--ps-primary-700` | `#0047B3` | Fondos de header, énfasis fuerte |
| `--ps-primary-800` | `#003380` | Texto sobre fondos claros de marca |
| `--ps-primary-900` | `#00204D` | Fondos oscuros, modales de alto contraste |

### 2.2 Escala neutra (Grises)

Los grises sostienen el 80 % de la interfaz. Deben ser lo suficientemente contrastantes para garantizar accesibilidad WCAG 2.1 AA.

| Token | Hex | Uso |
|-------|-----|-----|
| `--ps-neutral-0` | `#FFFFFF` | Fondo de tarjetas, superficies elevadas |
| `--ps-neutral-50` | `#F8F9FA` | Fondo general de la aplicación |
| `--ps-neutral-100` | `#F1F3F5` | Fondos de filas alternas en tablas |
| `--ps-neutral-200` | `#E9ECEF` | Bordes sutiles, divisores |
| `--ps-neutral-300` | `#DEE2E6` | Bordes de inputs inactivos |
| `--ps-neutral-400` | `#CED4DA` | Iconos inactivos, placeholders |
| `--ps-neutral-500` | `#ADB5BD` | Texto deshabilitado, metadatos |
| `--ps-neutral-600` | `#868E96` | Texto secundario, subtítulos |
| `--ps-neutral-700` | `#495057` | Texto de cuerpo, labels de formularios |
| `--ps-neutral-800` | `#343A40` | Títulos, texto principal |
| `--ps-neutral-900` | `#212529` | Encabezados de máximo peso, iconos activos |

### 2.3 Semántica de estado

| Token | Hex | Uso |
|-------|-----|-----|
| `--ps-success-500` | `#2B8A3E` | Confirmaciones, validaciones OK |
| `--ps-success-50` | `#EBFBEE` | Fondos de alerta de éxito |
| `--ps-warning-500` | `#F08C00` | Advertencias, acciones irreversibles pendientes |
| `--ps-warning-50` | `#FFF9DB` | Fondos de alerta de advertencia |
| `--ps-danger-500` | `#C92A2A` | Errores, eliminaciones, acciones destructivas |
| `--ps-danger-50` | `#FFF5F5` | Fondos de alerta de error |
| `--ps-info-500` | `#1A75FF` | (Alias a primary-500) Notificaciones informativas |

### 2.4 Superficies y sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `--ps-surface-0` | `#FFFFFF` | Tarjetas, paneles, modales |
| `--ps-surface-1` | `#FFFFFF` + sombra | Elementos elevados (dropdowns, popovers) |
| `--ps-surface-overlay` | `rgba(33, 37, 41, 0.48)` | Backdrop de modales y drawers |

**Sombras:**

| Token | Valor | Uso |
|-------|-------|-----|
| `--ps-shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Botones, badges |
| `--ps-shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)` | Tarjetas, dropdowns |
| `--ps-shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.03)` | Modales, drawers |
| `--ps-shadow-focus` | `0 0 0 3px var(--ps-primary-200)` | Anillos de foco |

---

## 3. Tipografía

### 3.1 Familia

- **Primaria:** `Inter`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, sans-serif  
  *Razón:* Diseñada para pantallas, alta legibilidad en tamaños pequeños, apariencia neutral y profesional.
- **Monospace:** `JetBrains Mono`, `Fira Code`, `Consolas`, monospace  
  *Uso:* Código, hashes, IDs técnicos, datos tabulares monoespaciados.

### 3.2 Escala tipográfica

| Token | Tamaño | Peso | Altura de línea | Uso típico |
|-------|--------|------|-----------------|------------|
| `--ps-text-xs` | 12 px / 0.75 rem | 400 / 500 | 1.5 | Leyendas, badges, timestamps |
| `--ps-text-sm` | 14 px / 0.875 rem | 400 / 500 | 1.5 | Texto secundario, descripciones |
| `--ps-text-base` | 16 px / 1 rem | 400 | 1.6 | Cuerpo de texto, párrafos |
| `--ps-text-lg` | 18 px / 1.125 rem | 500 | 1.5 | Subtítulos, lead text |
| `--ps-text-xl` | 20 px / 1.25 rem | 600 | 1.35 | Títulos de sección (H4) |
| `--ps-text-2xl` | 24 px / 1.5 rem | 600 | 1.3 | Títulos (H3) |
| `--ps-text-3xl` | 30 px / 1.875 rem | 700 | 1.25 | Títulos de página (H2) |
| `--ps-text-4xl` | 36 px / 2.25 rem | 700 | 1.2 | Hero titles (H1, escaso) |

### 3.3 Reglas tipográficas

- **Nunca** se usa `font-weight` menor a 400.
- **Nunca** se justifica el texto; alineación izquierda (o derecha en RTL).
- **Máximo** 75 caracteres por línea en bloques de texto largo.
- **Color de texto de cuerpo:** `--ps-neutral-700` sobre fondo claro, `--ps-neutral-100` sobre fondo oscuro.

---

## 4. Espaciado y Layout

### 4.1 Sistema de espaciado (8-pt grid)

Base: `1 unidad = 4 px`. Todos los márgenes, paddings, gaps y dimensiones deben ser múltiplos de 4 px.

| Token | Valor | Uso |
|-------|-------|-----|
| `--ps-space-0` | 0 | — |
| `--ps-space-1` | 4 px | Iconos inline, ajustes finos |
| `--ps-space-2` | 8 px | Padding interno de badges, gaps íntimos |
| `--ps-space-3` | 12 px | Padding de botones pequeños |
| `--ps-space-4` | 16 px | Padding estándar de inputs, gaps entre elementos relacionados |
| `--ps-space-5` | 20 px | Padding de tarjetas compactas |
| `--ps-space-6` | 24 px | Padding estándar de tarjetas, separación entre secciones |
| `--ps-space-8` | 32 px | Separación entre bloques de contenido |
| `--ps-space-10` | 40 px | Separación de secciones grandes |
| `--ps-space-12` | 48 px | Layout de página, márgenes exteriores |
| `--ps-space-16` | 64 px | Hero spacers, separación máxima |

### 4.2 Bordes y radios

| Token | Valor | Uso |
|-------|-------|-----|
| `--ps-radius-sm` | 4 px | Inputs, badges, chips |
| `--ps-radius-md` | 6 px | Botones, tarjetas pequeñas |
| `--ps-radius-lg` | 8 px | Tarjetas, modales, paneles |
| `--ps-radius-xl` | 12 px | Contenedores grandes, drawers |
| `--ps-radius-full` | 9999 px | Avatares, badges pill |

### 4.3 Layout grid

- **Grid base:** 12 columnas.
- **Gutter:** 24 px (`--ps-space-6`).
- **Márgenes laterales:**
  - Móvil: 16 px
  - Tablet: 24 px
  - Desktop: 32 px
  - Wide: 48 px
- **Breakpoints:**
  - `sm`: 640 px
  - `md`: 768 px
  - `lg`: 1024 px
  - `xl`: 1280 px
  - `2xl`: 1536 px

---

## 5. Componentes

### 5.1 Botones

#### Variantes

| Variante | Fondo | Texto | Borde | Sombra |
|----------|-------|-------|-------|--------|
| **Primary** | `--ps-primary-500` | `#FFFFFF` | ninguno | `--ps-shadow-sm` |
| **Secondary** | `#FFFFFF` | `--ps-primary-500` | `--ps-primary-500` 1.5 px | ninguna |
| **Tertiary / Ghost** | transparente | `--ps-neutral-700` | ninguno | ninguna |
| **Danger** | `--ps-danger-500` | `#FFFFFF` | ninguno | `--ps-shadow-sm` |

#### Estados

| Estado | Estilo |
|--------|--------|
| **Default** | Como tabla anterior |
| **Hover** | Fondo oscurece un 8 % (ej. primary pasa a `--ps-primary-600`). Transición `150 ms ease-in-out`. |
| **Active / Pressed** | Fondo oscurece un 12 %; transform `translateY(1px)`. |
| **Focus** | Anillo `--ps-shadow-focus` (sin outline del navegador). |
| **Disabled** | Opacidad 0.5, cursor `not-allowed`, sin sombra. |

#### Tamaños

| Tamaño | Altura | Padding horizontal | Texto |
|--------|--------|--------------------|-------|
| `sm` | 32 px | 12 px | `--ps-text-sm` |
| `md` | 40 px | 16 px | `--ps-text-base` |
| `lg` | 48 px | 24 px | `--ps-text-lg` |

### 5.2 Inputs y Formularios

- **Altura estándar:** 40 px (`md`).
- **Fondo:** `--ps-surface-0`.
- **Borde:** 1 px sólido `--ps-neutral-300`.
- **Radio:** `--ps-radius-sm`.
- **Padding:** 0 `--ps-space-3`.
- **Placeholder:** `--ps-neutral-400`, `--ps-text-base`.
- **Label:** `--ps-neutral-700`, `--ps-text-sm`, `font-weight: 500`, margen inferior `--ps-space-1`.
- **Error:** borde `--ps-danger-500`, texto de ayuda `--ps-danger-500`, `--ps-text-sm`.
- **Focus:** borde `--ps-primary-500` + anillo `--ps-shadow-focus`.

### 5.3 Tarjetas (Cards)

- **Fondo:** `--ps-surface-0`.
- **Borde:** 1 px `--ps-neutral-200` (opcional; puede ser sin borde con sombra).
- **Radio:** `--ps-radius-lg`.
- **Sombra:** `--ps-shadow-md`.
- **Padding:** `--ps-space-5` a `--ps-space-6`.
- **Header de tarjeta:** padding inferior `--ps-space-4`, borde inferior 1 px `--ps-neutral-100`, título `--ps-text-lg` semibold.

### 5.4 Tablas

- **Cabecera:** fondo `--ps-neutral-50`, texto `--ps-neutral-700`, `--ps-text-sm`, `font-weight: 600`, mayúsculas opcional (letter-spacing 0.05 em).
- **Filas:** fondo alternado `--ps-neutral-50` / `#FFFFFF`.
- **Celdas:** padding `--ps-space-3` `--ps-space-4`, texto `--ps-text-sm`.
- **Hover de fila:** fondo `--ps-primary-50`.
- **Bordes:** 1 px `--ps-neutral-200` entre filas (no bordes verticales).
- **Estado seleccionado:** borde izquierdo 3 px `--ps-primary-500` + fondo `--ps-primary-50`.

### 5.5 Modales / Dialogs

- **Backdrop:** `--ps-surface-overlay` con `backdrop-filter: blur(2px)`.
- **Contenedor:** fondo `--ps-surface-0`, radio `--ps-radius-lg`, sombra `--ps-shadow-lg`.
- **Ancho máximo:** 560 px (por defecto), 720 px (`lg`), 400 px (`sm`).
- **Header:** padding `--ps-space-5`, título `--ps-text-xl`, botón de cierre a la derecha.
- **Body:** padding `--ps-space-5`.
- **Footer:** padding `--ps-space-4` `--ps-space-5`, alineación derecha, botones con gap `--ps-space-3`.
- **Entrada:** animación de escala `0.96 → 1` + opacidad `0 → 1`, duración `200 ms`, easing `ease-out`.

### 5.6 Navegación

#### Sidebar (navegación principal)

- **Ancho:** 256 px (64 px en modo colapsado).
- **Fondo:** `--ps-neutral-0` o `--ps-neutral-50`.
- **Borde derecho:** 1 px `--ps-neutral-200`.
- **Item:** altura 44 px, padding horizontal `--ps-space-4`, radio `--ps-radius-md`.
- **Item default:** texto `--ps-neutral-600`, icono `--ps-neutral-500`.
- **Item hover:** fondo `--ps-primary-50`, texto `--ps-primary-600`.
- **Item activo:** fondo `--ps-primary-50`, texto `--ps-primary-700`, icono `--ps-primary-500`, borde izquierdo 3 px `--ps-primary-500`.

#### Topbar

- **Altura:** 64 px.
- **Fondo:** `--ps-surface-0`.
- **Borde inferior:** 1 px `--ps-neutral-200`.
- **Sombra:** ninguna (a menos que haya scroll; entonces `--ps-shadow-sm`).

### 5.7 Badges y Tags

| Variante | Fondo | Texto |
|----------|-------|-------|
| Default | `--ps-neutral-100` | `--ps-neutral-700` |
| Primary | `--ps-primary-50` | `--ps-primary-700` |
| Success | `--ps-success-50` | `--ps-success-500` |
| Warning | `--ps-warning-50` | `--ps-warning-500` |
| Danger | `--ps-danger-50` | `--ps-danger-500` |

- **Padding:** `--ps-space-1` `--ps-space-2`.
- **Texto:** `--ps-text-xs`, `font-weight: 600`.
- **Radio:** `--ps-radius-full` (pill) o `--ps-radius-sm` (rectangular).

### 5.8 Alertas / Toasts

| Tipo | Fondo | Borde izquierdo | Icono |
|------|-------|-----------------|-------|
| Info | `--ps-primary-50` | `--ps-primary-500` | info azul |
| Success | `--ps-success-50` | `--ps-success-500` | check verde |
| Warning | `--ps-warning-50` | `--ps-warning-500` | warning amarillo |
| Error | `--ps-danger-50` | `--ps-danger-500` | error rojo |

- **Estructura:** icono + título (`--ps-text-sm` semibold) + descripción (`--ps-text-sm`).
- **Padding:** `--ps-space-4`.
- **Radio:** `--ps-radius-md`.
- **Sombra:** `--ps-shadow-md`.

---

## 6. Estados de Interacción y Movimiento

### 6.1 Duraciones

| Contexto | Duración |
|----------|----------|
| Micro-interacciones (hover, active) | `100 ms – 150 ms` |
| Apertura de menús, dropdowns | `150 ms – 200 ms` |
| Modales, drawers | `200 ms – 250 ms` |
| Transiciones de página | `250 ms – 300 ms` |

### 6.2 Curvas de easing

| Nombre | Valor | Uso |
|--------|-------|-----|
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transiciones de estado por defecto |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elementos que entran (modales, toasts) |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elementos que salen |

### 6.3 Movimiento permitido

- **Escalas:** `0.96 → 1` para aparición de diálogos.
- **Desplazamientos:** `translateY(-8px → 0)` para dropdowns, `translateX` para drawers.
- **Opacidad:** siempre acompañada a otro transform (nunca opacidad sola para elementos grandes).
- **Prohibido:** animaciones de rotación, rebotes exagerados, parpadeos, o movimientos que no tengan un propósito funcional.

---

## 7. Accesibilidad (A11y)

### 7.1 Contraste

- **Texto normal:** mínimo 4.5:1 contra el fondo.
- **Texto grande (≥18 px bold / 24 px regular):** mínimo 3:1.
- **Componentes interactivos (bordes de input, iconos de acción):** mínimo 3:1.

### 7.2 Foco

- **Nunca** eliminar el outline sin reemplazo.
- **Reemplazo obligatorio:** anillo `--ps-shadow-focus` en todo elemento interactivo.
- El foco debe ser visible tanto con ratón como con teclado.

### 7.3 Tamaño táctil

- **Área mínima clickable:** 44 × 44 px.
- **Inputs y botones:** altura mínima 32 px (`sm`), recomendado 40 px (`md`).

### 7.4 Motion

- Respetar `prefers-reduced-motion`:
  - Si está activo, eliminar todas las transiciones de transform y opacidad excepto las esenciales para el entendimiento de estado (ej. toggle).
  - Reducir duraciones a `0 ms` o usar un simple fade de `50 ms`.

---

## 8. Modo Oscuro (Preparación)

Aunque el tema por defecto es claro, los tokens están diseñados para invertirse:

| Token claro | Token oscuro (futuro) |
|-------------|-----------------------|
| `--ps-neutral-50` → fondo | `--ps-neutral-900` |
| `--ps-neutral-100` → fila alterna | `--ps-neutral-800` |
| `--ps-neutral-700` → texto | `--ps-neutral-200` |
| `--ps-surface-0` → tarjeta | `--ps-neutral-800` |
| Sombras | Sustituir por bordes sutiles o sombras con mayor opacidad |

> **Nota:** No implementar modo oscuro hasta que exista un requisito explícito. Mantener los tokens preparados.

---

## 9. Aplicación en el Proyecto

### 9.1 Activación del tema

```html
<html data-theme="profesional-seguro">
  …
</html>
```

O en el contenedor de la aplicación:

```html
<div id="app" data-theme="profesional-seguro">
  …
</div>
```

### 9.2 CSS de soporte mínimo (ejemplo)

```css
/* ==== Variables del tema profesional-seguro ==== */
[data-theme="profesional-seguro"] {
  /* Primaria */
  --ps-primary-50: #EEF4FF;
  --ps-primary-100: #D9E6FF;
  --ps-primary-200: #B3D1FF;
  --ps-primary-300: #80B3FF;
  --ps-primary-400: #4D94FF;
  --ps-primary-500: #1A75FF;
  --ps-primary-600: #005CE6;
  --ps-primary-700: #0047B3;
  --ps-primary-800: #003380;
  --ps-primary-900: #00204D;

  /* Neutral */
  --ps-neutral-0: #FFFFFF;
  --ps-neutral-50: #F8F9FA;
  --ps-neutral-100: #F1F3F5;
  --ps-neutral-200: #E9ECEF;
  --ps-neutral-300: #DEE2E6;
  --ps-neutral-400: #CED4DA;
  --ps-neutral-500: #ADB5BD;
  --ps-neutral-600: #868E96;
  --ps-neutral-700: #495057;
  --ps-neutral-800: #343A40;
  --ps-neutral-900: #212529;

  /* Semántica */
  --ps-success-50: #EBFBEE;
  --ps-success-500: #2B8A3E;
  --ps-warning-50: #FFF9DB;
  --ps-warning-500: #F08C00;
  --ps-danger-50: #FFF5F5;
  --ps-danger-500: #C92A2A;
  --ps-info-500: var(--ps-primary-500);

  /* Superficies y sombras */
  --ps-surface-0: #FFFFFF;
  --ps-surface-overlay: rgba(33, 37, 41, 0.48);
  --ps-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --ps-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
  --ps-shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.03);
  --ps-shadow-focus: 0 0 0 3px var(--ps-primary-200);

  /* Tipografía */
  --ps-font-sans: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  --ps-font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;

  /* Espaciado (rem base 16px) */
  --ps-space-1: 0.25rem;   /* 4px */
  --ps-space-2: 0.5rem;    /* 8px */
  --ps-space-3: 0.75rem;   /* 12px */
  --ps-space-4: 1rem;      /* 16px */
  --ps-space-5: 1.25rem;   /* 20px */
  --ps-space-6: 1.5rem;    /* 24px */
  --ps-space-8: 2rem;      /* 32px */
  --ps-space-10: 2.5rem;   /* 40px */
  --ps-space-12: 3rem;     /* 48px */
  --ps-space-16: 4rem;     /* 64px */

  /* Radios */
  --ps-radius-sm: 4px;
  --ps-radius-md: 6px;
  --ps-radius-lg: 8px;
  --ps-radius-xl: 12px;
  --ps-radius-full: 9999px;

  /* Movimiento */
  --ps-duration-fast: 100ms;
  --ps-duration-base: 150ms;
  --ps-duration-slow: 200ms;
  --ps-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ps-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ps-ease-in: cubic-bezier(0.4, 0, 1, 1);
}
```

### 9.3 Reglas de uso obligatorio

1. **Todo color** debe provenir de los tokens `--ps-*`. Ningún color hardcodeado excepto en assets gráficos.
2. **Todo espaciado** debe usar `--ps-space-*`.
3. **Toda transición** debe usar `--ps-duration-*` y `--ps-ease-*`.
4. **Todo componente nuevo** debe documentarse en este archivo si introduce un patrón no listado.

---

## 10. Checklist de Revisión de UI

Antes de dar por finalizada una pantalla o componente, verificar:

- [ ] No hay colores fuera de la paleta definida.
- [ ] Los textos cumplen contraste WCAG AA.
- [ ] Los elementos interactivos tienen estado de foco visible.
- [ ] Los botones y links tienen estados hover, active y disabled.
- [ ] Las animaciones respetan `prefers-reduced-motion`.
- [ ] Las áreas táctiles son ≥ 44 × 44 px.
- [ ] El espaciado respeta el grid de 4 px.
- [ ] No hay bordes redondeados inconsistentes (mezclar 4 px con 12 px en el mismo nivel jerárquico).
- [ ] Las sombras no son excesivas (máximo `--ps-shadow-lg`).
- [ ] Los iconos y textos deshabilitados usan `--ps-neutral-400` / `--ps-neutral-500`, nunca opacidad arbitraria.

---

*Documento mantenido por el equipo de diseño y frontend de Toolyo.  
Para propuestas de cambio, abrir un PR modificando este archivo y asignar a `@design-lead`.*
