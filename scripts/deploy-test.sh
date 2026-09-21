#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Toolyo — deploy-test.sh (wrapper)
# Delega en deploy-test.mjs para compatibilidad multiplataforma.
# En Windows usar directamente:  node scripts/deploy-test.mjs
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "[deploy-test] Error: Node.js no está instalado." >&2
  echo "[deploy-test] Instálalo desde https://nodejs.org (v20+)" >&2
  exit 1
fi

exec node "$SCRIPT_DIR/deploy-test.mjs" "$@"
