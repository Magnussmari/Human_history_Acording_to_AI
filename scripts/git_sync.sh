#!/bin/bash
# Pushes current progress to GitHub every 20 completed years
# Called by orchestrator.sh

set -euo pipefail

BASE="/workspace"
[ ! -d "$BASE/.git" ] && BASE="$HOME/Human_history"

cd "$BASE"

COMPLETED=$(jq '.completed | length' state/progress.json)
FAILED=$(jq '.failed | length' state/progress.json)
TOTAL=5226

# Stage outputs and state
git add outputs/json/*.json state/progress.json LEDGER.md 2>/dev/null || true
git add outputs/failed/ 2>/dev/null || true

# Check if there are changes to commit
if git diff --cached --quiet 2>/dev/null; then
  echo "[GIT SYNC] No changes to commit."
  return 0 2>/dev/null || exit 0
fi

git commit -m "Progress: ${COMPLETED}/${TOTAL} years completed (${FAILED} failed)" 2>/dev/null || true
git push origin main 2>/dev/null || echo "[GIT SYNC] Push failed (will retry next sync)"

echo "[GIT SYNC] Pushed ${COMPLETED} completed years to GitHub"
