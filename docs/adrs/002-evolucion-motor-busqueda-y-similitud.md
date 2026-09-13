---
title: "Evolución del motor de búsqueda de listings y recomendaciones similares"
status: proposed
date: 2026-09-13
authors: [@toolyo-team]
reviewers: [@architecture-team]
tags: [arquitectura, decision, busqueda]
related: [[001-adr-template]], [[004-public-search]]
supersedes: [[adr-anterior]] (si aplica)
---

# ADR: {{title}}

## Estado
{{status}}

## Contexto

La primera versión del motor de búsqueda de listings utiliza PostgreSQL con la extensión `pg_trgm`. Esta solución permite comparar títulos mediante similitud de trigramas, soporta búsquedas tolerantes a errores y mantiene una infraestructura sencilla al permanecer dentro de la base de datos transaccional.

`pg_trgm` es una buena solución para el volumen inicial y para búsquedas léxicas, pero tiene límites cuando crecen el catálogo, la variedad lingüística, el número de consultas y la necesidad de entender la intención semántica. La consulta de recomendaciones similares también tiene un cuello de botella identificado y pendiente de resolver en un `TODO`: combina varios niveles de fallback, similitud textual, filtros de publicación y ordenación antes de aplicar el límite final. El coste puede aumentar al comparar muchos listings y al mantener la consulta como una única operación SQL compleja.

Además, la similitud léxica no representa bien relaciones como sinónimos, equivalencias de categoría, intención de uso o productos visualmente y funcionalmente parecidos cuando no comparten palabras. Por ello, el sistema necesita una evolución hacia búsqueda semántica y vectorial sin introducir prematuramente una plataforma distribuida que complique la operación del MVP.

Restricciones relevantes:

- Mantener PostgreSQL como fuente de verdad transaccional.
- Evitar duplicar innecesariamente datos de listings durante la primera etapa.
- Conservar filtros estructurados como categoría, disponibilidad, precio, estado y ubicación.
- Permitir una migración incremental y medible.
- No convertir la búsqueda semántica en requisito para el lanzamiento inicial.

## Decisión

Se propone adoptar **PostgreSQL con `pgvector` como paso intermedio natural para la v2**.

La evolución se hará de forma híbrida:

1. Mantener PostgreSQL y `pg_trgm` para coincidencia léxica, tolerancia a errores y fallback.
2. Añadir embeddings para listings y, cuando aporte valor, para consultas de usuario.
3. Usar `pgvector` para recuperar candidatos semánticamente similares.
4. Combinar la puntuación vectorial con `match_score` de texto y filtros estructurados de PostgreSQL.
5. Medir relevancia, latencia, coste y calidad antes de sustituir o ampliar la infraestructura.
6. Mantener la consulta actual como fallback durante la transición y resolver el `TODO` de similitud antes de aumentar el volumen de candidatos.

`pgvector` se considera la elección recomendada para la v2 porque conserva la simplicidad operativa de PostgreSQL, permite búsquedas vectoriales híbridas junto a los datos transaccionales y evita introducir un cluster dedicado antes de tener evidencia de que el volumen o la complejidad lo justifican.

El salto a **Elasticsearch u OpenSearch** se reserva para una etapa posterior, cuando el volumen de consultas, la necesidad de escalado independiente, la analítica de relevancia, la tolerancia de operación distribuida o la riqueza de funcionalidades de búsqueda justifiquen un cluster externo.

## Consecuencias

### Positivas

- Se mantiene una única fuente de verdad para listings, categorías, disponibilidad y estados.
- La v2 puede combinar búsqueda léxica, vectorial y filtros estructurados sin duplicar inicialmente todo el dominio en otro sistema.
- La migración es incremental: `pg_trgm` continúa funcionando mientras se evalúan embeddings y `pgvector`.
- Se reduce la complejidad operativa frente a desplegar y mantener un cluster de Elasticsearch/OpenSearch desde el principio.
- Las recomendaciones pueden capturar similitud semántica aunque los títulos no compartan exactamente las mismas palabras.
- La calidad de resultados se puede comparar con métricas antes de tomar una decisión irreversible.

### Negativas

- PostgreSQL asumirá más carga de lectura y almacenamiento al mantener embeddings e índices vectoriales.
- Será necesario generar, versionar y actualizar embeddings cuando cambien títulos, descripciones, categorías o imágenes.
- La consulta híbrida será más compleja que una búsqueda basada únicamente en `pg_trgm`.
- `pgvector` puede quedarse corto si el catálogo o el tráfico alcanzan una escala que requiera escalado horizontal especializado.
- Los embeddings introducen dependencia de un modelo, costes de inferencia y posibles riesgos de privacidad o cambios de calidad.
- La calidad semántica necesitará evaluación con datos reales y no puede darse por garantizada solo por añadir vectores.

## Alternativas Consideradas

### PostgreSQL con `pgvector`

Mantener PostgreSQL como sistema principal y añadir una columna vectorial e índices ANN cuando el volumen lo requiera.

**Pros:**

- Integración directa con el modelo transaccional existente.
- Menor complejidad de infraestructura y operación.
- Permite combinar SQL, `pg_trgm`, filtros, PostGIS y vectores en una misma consulta o flujo.
- Facilita una migración progresiva y un fallback claro.

**Contras:**

- La búsqueda y el almacenamiento vectorial comparten recursos con las transacciones.
- El escalado independiente de lectura es más limitado.
- Requiere diseñar pipelines de embeddings y estrategias de actualización.

**Decisión:** Elegida como paso intermedio recomendado para la v2.

### Elasticsearch / OpenSearch

Introducir un cluster dedicado para indexar listings, texto, filtros, geolocalización, analítica de relevancia y vectores.

**Pros:**

- Escalado independiente para cargas de búsqueda elevadas.
- Herramientas maduras de relevancia, analyzers, facetas, geolocalización y búsqueda híbrida.
- Mejor separación entre carga transaccional y carga intensiva de búsqueda.
- Adecuado para grandes catálogos, alto volumen de consultas y necesidades avanzadas de observabilidad.

**Contras:**

- Añade una segunda fuente de datos derivada y exige sincronización robusta.
- Incrementa costes operativos, monitorización, backups y mantenimiento.
- Introduce consistencia eventual entre PostgreSQL y el índice.
- Puede ser excesivo para el MVP y para la primera etapa de búsqueda semántica.

**Decisión:** Reservada para una fase posterior, cuando las métricas demuestren que PostgreSQL con `pgvector` no es suficiente.

## Notas de Implementación

- Mantener `pg_trgm` y `Listing_title_trgm_idx` activos como parte del fallback léxico.
- Resolver y medir el `TODO` actual de la consulta de similitud antes de habilitar recomendaciones vectoriales en producción.
- Añadir una tabla o campos versionados para embeddings, incluyendo modelo, dimensión, fecha de generación y estado de actualización.
- Generar embeddings fuera de la transacción principal mediante un proceso asíncrono idempotente.
- Invalidar o regenerar embeddings al cambiar el contenido que participa en la representación semántica.
- Aplicar primero filtros duros de visibilidad, estado, propietario activo y disponibilidad; después combinar candidatos léxicos y vectoriales.
- Definir un experimento controlado con métricas de precisión de resultados, CTR de listings, latencia p95, coste por consulta y tasa de fallback.
- No habilitar KYC, datos privados o contenido no publicado dentro del índice de búsqueda.
- Revisar el impacto de los embeddings sobre privacidad, proveedores externos y retención antes de almacenar datos derivados.
- Considerar Elasticsearch u OpenSearch solo tras superar umbrales explícitos de volumen, latencia o calidad que PostgreSQL no pueda cumplir.

## Referencias

- [[03-arquitectura-y-tech-stack]]
- [[04-especificaciones-funcionales]]
- [[05-diagramas-navegacion]]
- [pgvector](https://github.com/pgvector/pgvector)
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [OpenSearch](https://opensearch.org/docs/latest/)
