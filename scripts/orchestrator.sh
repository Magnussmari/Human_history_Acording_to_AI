#!/bin/bash
# Main daemon loop. Picks next N years, launches parallel agents, waits, repeats.

set -euo pipefail

PARALLEL=${PARALLEL_AGENTS:-5}
INTERVAL=${CYCLE_INTERVAL_SECONDS:-1200}
START=${START_YEAR:-2025}
END=${END_YEAR:--3200}
PROGRESS="/workspace/state/progress.json"
LEDGER="/workspace/LEDGER.md"
GIT_SYNC="/workspace/scripts/git_sync.sh"

# Fallback for non-Docker runs
if [ ! -f "$PROGRESS" ]; then
  PROGRESS="$HOME/Human_history/state/progress.json"
  LEDGER="$HOME/Human_history/LEDGER.md"
  GIT_SYNC="$HOME/Human_history/scripts/git_sync.sh"
fi

get_next_years() {
  local count=0
  local year=$START

  while [ $year -ge $END ] && [ $count -lt $PARALLEL ]; do
    if ! jq -e "(.completed + .failed) | index(${year})" "$PROGRESS" > /dev/null 2>&1; then
      echo $year
      count=$((count + 1))
    fi
    year=$((year - 1))
  done
}

write_ledger_entry() {
  local cycle=$1
  local completed=$2
  local failed=$3
  local total=$4
  local timestamp=$5

  # Write ledger entry every 4 cycles (= 20 years of 5-year batches)
  if [ $((cycle % 4)) -eq 0 ] && [ $cycle -gt 0 ]; then
    local earliest=$(jq -r '[.completed[]] | sort | first // "none"' "$PROGRESS" 2>/dev/null)
    local latest=$(jq -r '[.completed[]] | sort | last // "none"' "$PROGRESS" 2>/dev/null)

    printf '\n## Cycle %d — %s\n\n' "$cycle" "$timestamp" >> "$LEDGER"
    printf '- **Progress:** %d/%d completed (%d failed)\n' "$completed" "$total" "$failed" >> "$LEDGER"
    printf '- **Year range covered:** %s → %s\n' "$latest" "$earliest" >> "$LEDGER"
    printf '- **Years processed so far:** %d\n' "$completed" >> "$LEDGER"
    printf '- **Status:** Running nominally\n\n---\n' >> "$LEDGER"
    echo "  [LEDGER] Wrote 20-year summary at cycle ${cycle}"

    # Push to GitHub every 20 years
    bash "$GIT_SYNC" 2>&1 || echo "  [GIT SYNC] Failed (non-fatal)"
  fi
}

# Initialize ledger if missing
if [ ! -f "$LEDGER" ]; then
  printf '# Human History Daemon — Ledger\n\n' > "$LEDGER"
  printf '> Append-only log. One entry every ~20 years of progress.\n' >> "$LEDGER"
  printf '> Started: %s\n\n---\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LEDGER"
  echo "[LEDGER] Initialized"
fi

CYCLE=0

while true; do
  CYCLE=$((CYCLE + 1))
  TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  COMPLETED=$(jq '.completed | length' "$PROGRESS")
  FAILED=$(jq '.failed | length' "$PROGRESS")
  TOTAL=$((START - END + 1))
  REMAINING=$((TOTAL - COMPLETED - FAILED))

  echo ""
  echo "========================================"
  echo "[${TIMESTAMP}] Cycle ${CYCLE}"
  echo "  Progress: ${COMPLETED}/${TOTAL} completed, ${FAILED} failed, ${REMAINING} remaining"
  echo "========================================"

  if [ $REMAINING -le 0 ]; then
    echo "All years processed. Daemon complete."
    printf '{"status":"complete","completed":%d,"failed":%d,"timestamp":"%s"}' "$COMPLETED" "$FAILED" "$TIMESTAMP" > /workspace/state/final_status.json 2>/dev/null || true
    # Final git push
    bash "$GIT_SYNC" 2>&1 || true
    exit 0
  fi

  YEARS=$(get_next_years)

  if [ -z "$YEARS" ]; then
    echo "No years available to process. Waiting..."
    sleep "$INTERVAL"
    continue
  fi

  echo "  Launching agents for years: $(echo $YEARS | tr '\n' ' ')"

  PIDS=()
  SCRIPT="/workspace/scripts/run_year.sh"
  [ ! -f "$SCRIPT" ] && SCRIPT="$HOME/Human_history/scripts/run_year.sh"

  for year in $YEARS; do
    bash "$SCRIPT" "$year" &
    PIDS+=("$!")
    sleep 2
  done

  for pid in "${PIDS[@]}"; do
    wait "$pid" 2>/dev/null || true
  done

  # Check if this cycle made progress — if not, we may be rate-limited
  NEW_COMPLETED=$(jq '.completed | length' "$PROGRESS")
  if [ "$NEW_COMPLETED" -eq "$COMPLETED" ]; then
    # No new completions — likely rate limited. Back off longer.
    BACKOFF=600  # 10 minutes
    echo "  WARNING: No progress this cycle (rate limited?). Backing off ${BACKOFF}s."
    sleep "$BACKOFF"
  fi

  # Re-read after cycle for accurate ledger
  COMPLETED=$(jq '.completed | length' "$PROGRESS")
  FAILED=$(jq '.failed | length' "$PROGRESS")

  # Write ledger + git sync every 20 years
  write_ledger_entry "$CYCLE" "$COMPLETED" "$FAILED" "$TOTAL" "$TIMESTAMP"

  echo "  Batch complete. Sleeping ${INTERVAL}s before next cycle."
  sleep "$INTERVAL"
done
