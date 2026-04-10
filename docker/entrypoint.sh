#!/bin/bash
set -euo pipefail

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Human History Daemon starting"
echo "  Parallel agents: ${PARALLEL_AGENTS}"
echo "  Cycle interval:  ${CYCLE_INTERVAL_SECONDS}s"
echo "  Year range:      ${START_YEAR} → ${END_YEAR}"
echo "  Running as:      $(whoami) (uid=$(id -u))"

# Ensure directories
mkdir -p /workspace/outputs/json /workspace/outputs/failed /workspace/outputs/logs
mkdir -p /workspace/state/lock /workspace/scripts

# Initialize progress tracker if missing
if [ ! -f /workspace/state/progress.json ]; then
  echo '{"completed": [], "failed": [], "in_progress": []}' > /workspace/state/progress.json
fi

# Main daemon loop
exec /workspace/scripts/orchestrator.sh
