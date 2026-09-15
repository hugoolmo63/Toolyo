---
title: "Adopción de @huggingface/transformers in-process (Xenova/all-MiniLM-L6-v2) para embeddings sin dependencias externas"
status: proposed
date: 2026-09-14
authors: [@toolyo-team]
reviewers: [@architecture-team]
tags: [arquitectura, embeddings, busqueda, transformers]
related: [[002-evolucion-motor-busqueda-y-similitud]]
---

# ADR: {{title}}

## Estado

{{status}}

## Contexto

El motor semántico ha experimentado con Ollama local y con OpenAI. OpenAI añade
latencia de red y costes por uso; Ollama requiere una dependencia de infraestructura
local o remota que hay que operar junto con la aplicación. Para el volumen inicial de
Toolyo queremos eliminar ambas dependencias externas y medir una alternativa que pueda
ejecutarse dentro del proceso Node.js.

## Decisión

Adoptar `@huggingface/transformers` in-process con el modelo
`Xenova/all-MiniLM-L6-v2` para generar embeddings en memoria. El modelo se carga de
forma singleton y cada texto se procesa con pooling `mean` y normalización.

Los vectores resultantes tienen 384 dimensiones y se almacenan en PostgreSQL como
`vector(384)` mediante `pgvector`.

La búsqueda mantiene los filtros estructurados y el fallback léxico `pg_trgm`.
La calidad y el rendimiento se medirán con un benchmark reproducible de 100 textos.

## Consecuencias

### Positivas

- Se elimina la latencia de red de OpenAI/OpenRouter.
- Coste de API de embeddings: 0 €.
- No se requiere un proceso o servicio Ollama adicional.
- El modelo y la inferencia se controlan desde el runtime de la aplicación.

### Negativas y riesgos

- La inferencia consume CPU y memoria dentro del proceso Node.js.
- La carga inicial del modelo aumenta el tiempo de arranque o la primera consulta.
- A gran escala será necesario aislar la inferencia con Worker Threads o un
  microservicio dedicado para evitar bloquear el servidor web.
- La calidad de embeddings de 384 dimensiones puede diferir de modelos remotos y
  deberá medirse con consultas reales.

## Notas de implementación

- Mantener una instancia singleton del pipeline para reutilizar el modelo.
- Validar siempre que el vector tenga exactamente 384 valores finitos.
- Reindexar los listings cuando cambie el modelo o la dimensión.
- Medir tiempo de carga, latencia media, RPS y memoria residente antes de habilitarlo
  como proveedor único en producción.