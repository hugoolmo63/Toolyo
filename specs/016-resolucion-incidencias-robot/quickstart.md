# Quickstart: validación del robot de resolución de incidencias

Guía para validar la feature end-to-end tras la implementación.

## Prerequisitos

1. Etiqueta `TO_LOCO` creada en el repo (ya existe: `gh label create TO_LOCO`).
2. Variables del repo (Settings → Secrets and variables → Actions → Variables):
   - `ROBOT_MODEL` = modelo deseado (opcional, p. ej. `deepseek`)
3. Secret del repo `DEVIN_CLI_TOKEN` con la credencial de `devin auth` (ver `research.md` D2 — el token se obtiene tras `devin auth login` local).
4. Permisos del repo: Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests" ✔.
5. El workflow `.github/workflows/robot-resolve.yml` mergeado en la rama por defecto.

## Escenario 1 — Resolución exitosa (camino feliz)

1. Crear una issue bien descrita y de baja complejidad, p. ej.: _"El README de `development/` no menciona el script `db:seed`. Añadir una línea en la sección de scripts explicando que rellena la base de datos de desarrollo."_
2. Aplicar la etiqueta `TO_LOCO` a la issue.
3. **Esperado**:
   - En < 1 min aparece un comentario "trabajo iniciado" con enlace al run, y la label `robot:in-progress`.
   - El run crea la rama `robot/issue-<N>` con un commit del agente.
   - Se abre una PR titulada `robot: <título> (#<N>)` cuyo cuerpo contiene el análisis y `Closes #<N>`.
   - La issue queda con comentario de éxito + label `robot:done`; `robot:in-progress` retirada.
   - CI (`ci.yml`) corre sobre la PR como en cualquier contribución.

## Escenario 2 — Incidencia no resoluble (aborto controlado)

1. Crear una issue con descripción deliberadamente insuficiente, p. ej.: _"Arreglar el fallo"_ (sin más contexto).
2. Aplicarle la etiqueta `TO_LOCO`.
3. **Esperado**: el run termina sin PR; la issue recibe comentario explicando qué falta (contenido de `ROBOT_ABORT.md`) + label `robot:needs-human`.

## Escenario 3 — No disparo fuera del robot

1. Crear una issue sin etiquetar (o con una etiqueta distinta de `TO_LOCO`).
2. **Esperado**: ningún run de `robot-resolve` se inicia (o termina como `skipped`).

## Escenario 4 — Reintento y anti-duplicación

1. Sobre una issue en `robot:failed` o `robot:needs-human`: Actions → `robot-resolve` → Run workflow con `issue_number` = N. **Esperado**: nuevo run.
2. Mientras un run está activo, retirar y reaplicar `TO_LOCO` rápidamente. **Esperado**: no hay un segundo run concurrente (concurrency group + guardia `robot:in-progress`).

## Escenario 5 — Revisión humana

1. En la PR del escenario 1: solicitar cambios / aprobar como en cualquier PR humana.
2. **Esperado**: la PR no puede fusionarse sin aprobación (protección de rama); el robot no auto-fusiona.

## Verificación de puertas de calidad

- La PR del escenario 1 contiene el resumen del análisis y supuestos (trazabilidad US2).
- Ningún comentario/PR expone `DEVIN_CLI_TOKEN` ni contenido de secrets.
- El commit del robot solo toca archivos pertinentes a la issue (alcance del runbook).
