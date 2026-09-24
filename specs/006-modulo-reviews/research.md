# Research: Reviews y Reputación

## Decisión: publicación al vencer la ventana

**Decision**: si solo una parte envía review dentro de 14 días, esa review se publica al vencer el plazo y participa en agregados; no se crea review automática para la parte ausente.

**Rationale**: evita bloquear la reputación de quien sí participó.

**Alternatives considered**: ocultarla indefinidamente; publicarla sin agregarla.

## Decisión: doble ciego por reserva y dirección

**Decision**: una review renter → owner/producto y una owner → renter por reserva; ambas permanecen ocultas hasta que ambas se envían o vence la ventana.

**Rationale**: reduce represalias y hace determinista la publicación.

## Decisión: categorías tipadas

**Decision**: puntuaciones enteras de 1 a 5 para categorías explícitas: renter → owner (`communication`, `punctuality`, `product_condition`) y owner → renter (`communication`, `product_care`, `punctuality`).

**Rationale**: permite validación y agregados coherentes.

## Decisión: adjuntos fotográficos fuera del MVP

**Decision**: el MVP admite puntuaciones y comentario textual opcional; las fotografías de reviews quedan fuera hasta definir una política específica de almacenamiento y moderación.

**Rationale**: evita reutilizar indebidamente los adjuntos del chat.

## Decisión: agregados y redondeo

**Decision**: los promedios se calculan sobre reviews `published`, se redondean al decimal más cercano y se muestran con una decimal. El recuento coincide con las reviews publicadas incluidas.

**Rationale**: evita precisión falsa y mantiene coherencia entre contenido visible y reputación.

## Decisión: moderación con trazabilidad

**Decision**: un reporte no elimina automáticamente; la review pasa a `under_review` tras revisión autorizada y queda fuera de visibilidad y agregados hasta su resolución.

**Rationale**: protege a la comunidad sin perder trazabilidad ni permitir abuso del borrado automático.