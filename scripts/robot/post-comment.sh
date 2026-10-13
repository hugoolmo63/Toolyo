#!/usr/bin/env bash
# post-comment.sh <issue-number> <body-file>
# Comenta en una issue y garantiza que las labels de proceso robot:* existen.
set -euo pipefail

ISSUE="$1"
BODY_FILE="$2"

for label in robot:in-progress robot:done robot:needs-human robot:failed; do
  gh label create "$label" --force --description "Estado del robot de resolución de incidencias" >/dev/null 2>&1 || true
done

gh issue comment "$ISSUE" --body-file "$BODY_FILE"
