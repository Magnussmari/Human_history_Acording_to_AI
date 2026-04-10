#!/bin/bash
# Usage: run_year.sh <year_int>
# Runs a single Claude Code research agent for one year

set -euo pipefail

YEAR=$1
BASE="/workspace"

# Fallback for non-Docker runs
if [ ! -d "$BASE/state" ]; then
  BASE="$HOME/Human_history"
fi

LOCKFILE="${BASE}/state/lock/${YEAR}.lock"
OUTPUT="${BASE}/outputs/json/${YEAR}.json"
LOGFILE="${BASE}/outputs/logs/${YEAR}.log"
PROGRESS="${BASE}/state/progress.json"
MAX_RETRIES=${MAX_RETRIES:-3}

# Skip if already completed
if jq -e ".completed | index(${YEAR})" "$PROGRESS" > /dev/null 2>&1; then
  echo "[${YEAR}] Already completed, skipping."
  exit 0
fi

# Lock
if [ -f "$LOCKFILE" ]; then
  echo "[${YEAR}] Lock exists, skipping."
  exit 0
fi
echo $$ > "$LOCKFILE"
trap "rm -f $LOCKFILE" EXIT

# Mark in-progress
jq ".in_progress += [${YEAR}]" "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"

# Generate prompt
PROMPT=$(bash "${BASE}/scripts/generate_prompt.sh" "$YEAR")

ATTEMPT=0
SUCCESS=false

while [ $ATTEMPT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "[${YEAR}] Attempt ${ATTEMPT}/${MAX_RETRIES}" | tee -a "$LOGFILE"

  # Run Claude Code in print mode with --dangerously-skip-permissions
  if claude -p "${PROMPT}" --dangerously-skip-permissions --output-format json > "${OUTPUT}.tmp" 2>> "$LOGFILE"; then
    # Extract the actual response content from Claude Code JSON output
    # Claude --output-format json returns {"type":"result","subtype":"success","result":"..."}
    RESULT_TEXT=$(jq -r '.result // empty' "${OUTPUT}.tmp" 2>/dev/null || true)

    if [ -n "$RESULT_TEXT" ]; then
      # The result field is a string containing JSON — try to extract it
      # First try: the result IS valid JSON directly
      if echo "$RESULT_TEXT" | jq -e '.year' > /dev/null 2>&1; then
        echo "$RESULT_TEXT" | jq '.' > "${OUTPUT}.raw"
      else
        # Second try: extract JSON block from markdown-wrapped response
        echo "$RESULT_TEXT" | sed -n '/^{/,/^}/p' | jq '.' > "${OUTPUT}.raw" 2>/dev/null || \
        echo "$RESULT_TEXT" | grep -Pzo '(?s)\{.*\}' | jq '.' > "${OUTPUT}.raw" 2>/dev/null || \
        echo "$RESULT_TEXT" > "${OUTPUT}.raw"
      fi
    else
      # Fallback: try treating the whole file
      cp "${OUTPUT}.tmp" "${OUTPUT}.raw"
    fi

    # Validate: must be valid JSON with a "year" field
    if jq -e '.year' "${OUTPUT}.raw" > /dev/null 2>&1; then
      mv "${OUTPUT}.raw" "$OUTPUT"
      rm -f "${OUTPUT}.tmp"
      SUCCESS=true
      echo "[${YEAR}] Completed successfully." | tee -a "$LOGFILE"
    else
      echo "[${YEAR}] Output failed JSON validation on attempt ${ATTEMPT}." | tee -a "$LOGFILE"
      cat "${OUTPUT}.raw" >> "$LOGFILE" 2>/dev/null || true
      mv "${OUTPUT}.raw" "${BASE}/outputs/failed/${YEAR}-attempt${ATTEMPT}.json" 2>/dev/null || true
      rm -f "${OUTPUT}.tmp"
    fi
  else
    echo "[${YEAR}] Claude Code exited non-zero on attempt ${ATTEMPT}." | tee -a "$LOGFILE"
    rm -f "${OUTPUT}.tmp" "${OUTPUT}.raw"
  fi

  # Back off before retry
  [ "$SUCCESS" = false ] && [ $ATTEMPT -lt $MAX_RETRIES ] && sleep 30
done

# Update progress
if [ "$SUCCESS" = true ]; then
  jq "(.in_progress |= map(select(. != ${YEAR}))) | .completed += [${YEAR}]" "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
else
  jq "(.in_progress |= map(select(. != ${YEAR}))) | .failed += [${YEAR}]" "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
  echo "[${YEAR}] FAILED after ${MAX_RETRIES} attempts." | tee -a "$LOGFILE"
fi
