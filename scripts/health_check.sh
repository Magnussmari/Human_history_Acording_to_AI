#!/bin/bash
# Quick status check — run from host or inside container

PROGRESS="$HOME/Human_history/state/progress.json"

if [ ! -f "$PROGRESS" ]; then
  echo "No progress file found. Daemon may not have started."
  exit 1
fi

COMPLETED=$(jq '.completed | length' "$PROGRESS")
FAILED=$(jq '.failed | length' "$PROGRESS")
IN_PROGRESS=$(jq '.in_progress | length' "$PROGRESS")
TOTAL=5226

echo "Human History Daemon Status"
echo "==========================="
echo "Completed:   ${COMPLETED} / ${TOTAL}"
echo "Failed:      ${FAILED}"
echo "In progress: ${IN_PROGRESS}"
echo "Remaining:   $((TOTAL - COMPLETED - FAILED))"
echo ""
echo "Estimated days remaining: $(echo "scale=1; ($TOTAL - $COMPLETED - $FAILED) / 5 * 20 / 60 / 24" | bc)"
echo ""
echo "Last 5 completed:"
jq -r '.completed | sort | reverse | .[0:5] | .[]' "$PROGRESS" 2>/dev/null || echo "  (none)"
echo ""
echo "Recent failures:"
jq -r '.failed | sort | reverse | .[0:5] | .[]' "$PROGRESS" 2>/dev/null || echo "  (none)"
