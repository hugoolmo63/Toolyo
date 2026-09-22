-- pgvector para búsqueda semántica con OpenAI text-embedding-3-small.
-- La imagen actual postgis/postgis:15-3.4-alpine no incluye vector por defecto.
-- Aplicar esta migración tras usar una imagen PostgreSQL que incluya pgvector
-- junto con PostGIS, o tras instalar la extensión en la imagen de desarrollo.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- pgvector is optional in the PostGIS-only integration image. The embedding
-- table is created only by environments that explicitly install vector.
