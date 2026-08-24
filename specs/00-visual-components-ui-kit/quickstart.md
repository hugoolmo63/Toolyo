# Quickstart: Showcase UI Kits

## Prerrequisitos

- Navegador evergreen con JavaScript habilitado.
- Servidor estático local opcional. Tailwind se carga por CDN durante este spike, por lo que la primera apertura necesita red si no se han incorporado estilos compilados.

## Ejecutar

Desde la raíz del repositorio:

```bash
python3 -m http.server 4173 --directory showcase
```

Abrir `http://127.0.0.1:4173`.

Para una revisión rápida también puede abrirse `showcase/index.html` directamente, entendiendo que la carga por CDN puede variar según las políticas del navegador.

## Validación manual

1. Confirmar que la primera opción se muestra y que el estado indica `pending_approval`.
2. Activar las cuatro tabs con ratón y teclado; comprobar que solo una tiene `aria-selected="true"` y que el panel cambia.
3. Usar flechas, `Home` y `End`; comprobar foco visible y orden lógico.
4. Revisar botones, inputs, badges, tarjeta, feedback, modal y chat en los cuatro temas.
5. Comprobar estados de error, éxito, disabled, loading, vacío y fallo; ningún estado debe depender solo del color.
6. Redimensionar a 320, 375, 768 y 1280 px; comprobar que no hay overflow, truncados ni solapamientos.
7. Ejecutar una auditoría de contraste/HTML y revisar que todos los controles tienen nombre accesible.

## Smoke test automatizado opcional

Si se incorpora Playwright al proyecto, el smoke test debe verificar: carga de la página, cuatro opciones, cambio de panel, `aria-selected`, estado `pending_approval`, foco visible y ausencia de overflow horizontal en viewport móvil.

## Resultado esperado

El equipo puede comparar las cuatro direcciones visuales sobre los mismos componentes y tomar una decisión informada sin que la previsualización altere el registro de aprobación.
