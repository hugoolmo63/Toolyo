# Contract: Workflow `robot-resolve.yml`

Interfaz externa de la feature: eventos GitHub de entrada y efectos observables de salida.

## Entrada — eventos

### `issues` (types: `[labeled, unlabeled]`)

Disparador principal.

```yaml
on:
  issues:
    types: [labeled, unlabeled]
  workflow_dispatch:
    inputs:
      issue_number:
        required: true
        type: number
```

**Condición de ejecución del job**:

```text
(event == issues.labeled    AND event.label.name == "TO_LOCO")
OR (event == workflow_dispatch AND issue con número dado existe, está abierta y tiene TO_LOCO)
```

El tipo `unlabeled` se escucha solo para detectar cancelación temprana en el run siguiente (no inicia trabajo por sí solo).

### `workflow_dispatch`

Reintento manual. Entrada: `issue_number` (obligatorio). Equivale a reaplicar la etiqueta.

## Salida — efectos observables

### 1. Comentarios en la issue

| Momento | Contenido mínimo |
|---------|------------------|
| Inicio | "🤖 Trabajo iniciado" + enlace al run de Actions |
| Éxito | Enlace a la PR creada |
| Aborto | Motivo extraído de `ROBOT_ABORT.md` + cómo reintentar |
| Fallo | Motivo general + enlace al log del run |

### 2. Labels en la issue

Una de `robot:done`, `robot:needs-human`, `robot:failed` al terminar; `robot:in-progress` mientras corre. Definiciones en [data-model.md](../data-model.md#labels-de-proceso).

### 3. Rama

`robot/issue-<N>` creada desde la rama por defecto, con commits del agente.

### 4. Pull Request (solo éxito)

```text
title: robot: <issue title> (#<N>)
base:  <rama por defecto>
head:  robot/issue-<N>
body:  <pr-body-template.md renderizada + ROBOT_SUMMARY.md íntegro>
```

Debe contener la línea `Closes #<N>` para auto-cierre al fusionar.

## Contrato agente ↔ workflow (archivos sentinel)

| Archivo | Productor | Consumidor | Semántica |
|---------|-----------|------------|-----------|
| `ROBOT_SUMMARY.md` | agente | workflow | Éxito. Contenido: incidencia interpretada, cambios, verificaciones ejecutadas, supuestos. Requerido para crear PR |
| `ROBOT_ABORT.md` | agente | workflow | Abandono. Primera línea = motivo legible para humanos |

**Reglas**: ambos son efímeros (raíz del checkout, nunca committeados); presencia de `ROBOT_ABORT.md` tiene prioridad sobre `ROBOT_SUMMARY.md`; ausencia de ambos ⇒ `failed`.

## Configuración requerida

| Nombre | Tipo | Contenido |
|--------|------|-----------|
| `TO_LOCO` | repo label | etiqueta disparadora; su aplicación inicia el proceso y su retirada lo cancela |
| `ROBOT_MODEL` | repo variable (opcional) | modelo para `devin --model`; vacío ⇒ default del CLI |
| `DEVIN_CLI_TOKEN` | repo secret | credencial de `devin auth` para modo headless |

## No-objetivos del contrato

- El workflow NO ejecuta la lógica de negocio del repo ni decide si la solución es correcta — eso es revisión humana.
- El workflow NO expone endpoints ni webhooks nuevos; solo consume eventos nativos de GitHub.
