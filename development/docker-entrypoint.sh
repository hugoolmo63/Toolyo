#!/bin/sh
set -e

# Aplicar migraciones Prisma antes de arrancar la app (docs/09 §4.3)
# Solo si DATABASE_URL está definida
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying Prisma migrations..."
  # Usar el binario local de prisma (npx puede no encontrarlo en standalone)
  if [ -x "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma migrate deploy
  else
    npx prisma migrate deploy
  fi
  echo "[entrypoint] Migrations applied."
else
  echo "[entrypoint] DATABASE_URL not set — skipping migrations."
fi

echo "[entrypoint] Starting Next.js..."
exec node server.js
