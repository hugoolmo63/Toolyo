#!/bin/sh
set -e

# Aplicar migraciones Prisma antes de arrancar la app (docs/09 §4.3)
# Solo si DATABASE_URL está definida
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying Prisma migrations..."
  npx prisma migrate deploy
  echo "[entrypoint] Migrations applied."
else
  echo "[entrypoint] DATABASE_URL not set — skipping migrations."
fi

echo "[entrypoint] Starting Next.js..."
exec node server.js
