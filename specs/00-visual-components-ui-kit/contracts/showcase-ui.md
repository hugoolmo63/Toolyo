# UI Contract: Showcase de Componentes

## Entrada y estado inicial

La página no recibe datos externos. Carga cuatro `ThemeOption` y un `PreviewState` inicial:

```yaml
status: pending_approval
selected_option: null
previewed_option: clean-minimal
```

`previewed_option` es únicamente la pestaña visible. Cambiarla nunca aprueba la opción.

## Estructura observable

1. Encabezado con nombre del showcase y estado de aprobación pendiente.
2. Selector accesible de cuatro opciones.
3. Panel único de preview con tokens visibles y muestra de componentes comunes.
4. Componentes mínimos: botones, inputs, badges, listing card, feedback, modal y chat.
5. Indicadores de estados y nota de alcance MVP.

## Contrato de interacción

- Cada opción se presenta como un `button` de tab dentro de `role="tablist"`.
- El tab activo expone `aria-selected="true"`; los demás `false`.
- Cada tab referencia el panel mediante `aria-controls` y el panel expone `role="tabpanel"`.
- Teclado: `ArrowLeft`/`ArrowRight` cambian opción, `Home`/`End` saltan al primer/último tab y `Enter`/`Space` activan el tab enfocado.
- Botones de icono, favorito y cierre tienen nombre accesible visible o programático.
- El modal demostrativo debe mostrar foco visible, cierre y jerarquía de acciones; no necesita persistir datos.

## Contrato visual

- El cambio de tema actualiza tokens sin duplicar fixtures ni alterar la estructura.
- Todos los colores de estado se acompañan de texto, icono, borde o patrón.
- El panel no produce overflow horizontal a 320 px.
- Los nombres y mensajes largos pueden ocupar varias líneas sin solaparse.
- Deben existir estados normal, foco, deshabilitado, carga, error, éxito, vacío y fallo en los componentes donde aplique.

## Criterios de aceptación del showcase

- Las cuatro tabs muestran cuatro direcciones diferenciadas con sus tokens y componentes.
- El estado inicial y el estado de aprobación visible son `pending_approval` y `selected_option: null`.
- La navegación por teclado mantiene foco visible y cambia el panel correcto.
- La tarjeta incluye imagen o placeholder, título, precio, ubicación, rating, arrendador, badge y favorito.
- El chat muestra conversación vacía, mensajes propios/ajenos, timestamp, adjunto y fallo de envío.
- La página es legible y usable en 320/375/768/1280 px sin controles solapados.
