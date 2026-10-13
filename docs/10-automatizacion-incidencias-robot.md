# Automatización de resolución de incidencias (robot)

El repositorio dispone de un flujo automático que convierte issues en pull
requests revisables: aplicas la etiqueta **`TO_LOCO`** a la issue y el workflow
`.github/workflows/robot-resolve.yml` ejecuta Devin CLI en modo no interactivo
sobre el proyecto, que analiza la incidencia, implementa la solución y deja la
rama lista para que el workflow abra la PR.

## Uso

1. Crea la issue con un título claro y una descripción suficiente.
2. Aplícale la etiqueta `TO_LOCO`.
3. El robot comenta "trabajo iniciado" y trabaja en la rama `robot/issue-<N>`.
4. Resultado posible (label en la issue):
   - `robot:done` — PR abierta con el análisis y los cambios; revisar como cualquier PR humana.
   - `robot:needs-human` — el agente abandonó con motivo (falta información, fuera de alcance...). Enriquecer la issue y reintentar.
   - `robot:failed` — error interno; consultar el log del run.

## Reintentar / cancelar

- **Reintentar**: retirar y reaplicar la etiqueta `TO_LOCO`, o
  Actions → `robot-resolve` → *Run workflow* indicando el número de issue.
- **Cancelar**: retirar la etiqueta `TO_LOCO` o cerrar la issue; el run en
  curso lo detecta y termina sin crear PR.
- No hay ejecuciones duplicadas: un solo run activo por issue
  (`concurrency` + label `robot:in-progress`).

## Configuración

| Nombre | Tipo | Contenido |
|--------|------|-----------|
| `TO_LOCO` | Etiqueta del repo | Disparador del proceso (ya creada) |
| `ROBOT_MODEL` | Variable de repo (opcional) | Modelo para `devin --model` (p. ej. `deepseek`); vacío = default |
| `DEVIN_CLI_TOKEN` | Secret de repo | Contenido de `credentials.toml` generado por `devin auth login` |

### Obtener `DEVIN_CLI_TOKEN`

1. Instalar Devin CLI y autenticarse: `devin auth login`
2. El CLI persiste las credenciales en `credentials.toml`:
   `~/.local/share/devin/credentials.toml` (Linux) o `~/Library/Application Support/devin/credentials.toml` (macOS) o
   `%APPDATA%\devin\credentials.toml` (Windows).
3. Copiar el contenido completo del archivo al secret `DEVIN_CLI_TOKEN`.
   El workflow lo restaura en `~/.local/share/devin/credentials.toml` del runner.

Requisito del repo: *Settings → Actions → General → Allow GitHub Actions to
create and approve pull requests* debe estar activado.

## Garantías

- El robot **nunca auto-fusiona**: la PR requiere aprobación humana y pasa por
  `ci.yml` como cualquier contribución.
- El agente trabaja con permisos mínimos; los secretos del repositorio no se
  exponen en comentarios ni en la PR.
- Toda PR incluye trazabilidad: interpretación de la incidencia, cambios,
  verificaciones ejecutadas y supuestos (contenido de `ROBOT_SUMMARY.md`).

## Diseño

Ver `specs/016-resolucion-incidencias-robot/` (spec.md, plan.md, research.md,
contracts/workflow-contract.md, quickstart.md).
