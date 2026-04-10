#!/bin/bash
# Pushes current progress to GitHub.
# Updates the README progress counter, then commits and pushes.

set -eu

BASE="/workspace"
[ ! -d "$BASE/.git" ] && BASE="$HOME/Human_history"

cd "$BASE"

COMPLETED=$(jq '.completed | length' state/progress.json 2>/dev/null || echo "?")
FAILED=$(jq '.failed | length' state/progress.json 2>/dev/null || echo "?")
TOTAL=5226
REMAINING=$((TOTAL - COMPLETED))
PCT=$(echo "scale=1; $COMPLETED * 100 / $TOTAL" | bc 2>/dev/null || echo "?")

# Build the progress bar (50 chars wide)
FILLED=$(echo "$COMPLETED * 50 / $TOTAL" | bc 2>/dev/null || echo 0)
EMPTY=$((50 - FILLED))
BAR=$(printf '%0.s=' $(seq 1 $FILLED 2>/dev/null || true))$(printf '%0.s-' $(seq 1 $EMPTY 2>/dev/null || true))

# Figure out the current year being researched
LATEST_YEAR=$(jq -r '[.completed[]] | sort | first // "?"' state/progress.json 2>/dev/null || echo "?")

# Update README progress block
# Look for the marker lines and replace between them
if grep -q '<!-- PROGRESS_START -->' README.md 2>/dev/null; then
  # Use perl for reliable multiline replacement
  perl -i -0777 -pe "s|<!-- PROGRESS_START -->.*?<!-- PROGRESS_END -->|<!-- PROGRESS_START -->\n## \x{1f310} Live Progress\n\n\`\`\`\n[$BAR] ${PCT}%\n\n${COMPLETED} / ${TOTAL} years completed \x{b7} ${FAILED} failed \x{b7} ${REMAINING} remaining\nCurrently researching: ~${LATEST_YEAR} CE\nLast updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)\n\`\`\`\n<!-- PROGRESS_END -->|s" README.md 2>/dev/null || true
fi

# Stage everything
git add outputs/json/*.json state/progress.json LEDGER.md README.md 2>/dev/null || true

# Check if there are changes
if git diff --cached --quiet 2>/dev/null; then
  echo "[GIT SYNC] No changes to commit."
  exit 0
fi

git commit -m "Progress: ${COMPLETED}/${TOTAL} years completed (${FAILED} failed)" 2>/dev/null || {
  echo "[GIT SYNC] Commit failed."
  exit 1
}

if git push origin main 2>/dev/null; then
  echo "[GIT SYNC] Pushed to main: ${COMPLETED} completed years."
else
  echo "[GIT SYNC] Push failed (will retry next sync)."
fi
