#!/bin/bash
# Usage: run_year.sh <year_int>
# Runs a single Claude Code research agent for one year
# Rate limits are waited out — they do NOT consume retry attempts.

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
RATE_LIMIT_WAIT=300  # 5 minutes between rate-limit retries
MAX_RATE_LIMIT_WAITS=50  # Give up after ~4 hours of rate limiting

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

# --- Rate limit detection ---
# Returns 0 if rate limited, 1 if not
check_rate_limit() {
  local file="$1"
  # Check the JSON output for rate limit signals
  if [ -f "$file" ]; then
    local result
    result=$(jq -r '.result // ""' "$file" 2>/dev/null || true)
    if echo "$result" | grep -qi "hit your limit\|rate limit\|resets\|too many requests\|overloaded"; then
      return 0
    fi
    # Also check if is_error is true with a limit message
    local is_err
    is_err=$(jq -r '.is_error // false' "$file" 2>/dev/null || echo "false")
    if [ "$is_err" = "true" ]; then
      if echo "$result" | grep -qi "limit\|resets\|capacity"; then
        return 0
      fi
    fi
  fi
  # Check stderr/log for rate limit indicators
  if [ -f "$LOGFILE" ]; then
    if tail -5 "$LOGFILE" | grep -qi "hit your limit\|rate limit\|resets\|429\|too many requests\|overloaded"; then
      return 0
    fi
  fi
  return 1
}

ATTEMPT=0
SUCCESS=false

while [ $ATTEMPT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "[${YEAR}] Attempt ${ATTEMPT}/${MAX_RETRIES}" | tee -a "$LOGFILE"

  RATE_LIMIT_HITS=0

  while true; do
    # Run Claude Code
    CLAUDE_EXIT=0
    claude -p "${PROMPT}" --dangerously-skip-permissions --output-format json > "${OUTPUT}.tmp" 2>> "$LOGFILE" || CLAUDE_EXIT=$?

    # Check for rate limiting — in both the output file and stderr
    if check_rate_limit "${OUTPUT}.tmp"; then
      RATE_LIMIT_HITS=$((RATE_LIMIT_HITS + 1))
      if [ $RATE_LIMIT_HITS -ge $MAX_RATE_LIMIT_WAITS ]; then
        echo "[${YEAR}] Rate limited ${RATE_LIMIT_HITS} times, giving up." | tee -a "$LOGFILE"
        break
      fi
      echo "[${YEAR}] Rate limited (hit ${RATE_LIMIT_HITS}/${MAX_RATE_LIMIT_WAITS}). Waiting ${RATE_LIMIT_WAIT}s..." | tee -a "$LOGFILE"
      rm -f "${OUTPUT}.tmp"
      sleep $RATE_LIMIT_WAIT
      # Do NOT increment ATTEMPT — rate limits are not real failures
      continue
    fi

    # Not rate limited — break out of the rate-limit retry loop
    break
  done

  # If we exhausted rate limit waits, skip to next attempt
  if [ $RATE_LIMIT_HITS -ge $MAX_RATE_LIMIT_WAITS ]; then
    continue
  fi

  if [ $CLAUDE_EXIT -eq 0 ]; then
    # Extract the response content
    RESULT_TEXT=$(jq -r '.result // empty' "${OUTPUT}.tmp" 2>/dev/null || true)

    if [ -n "$RESULT_TEXT" ]; then
      # Try to parse the result as JSON with a .year field
      if echo "$RESULT_TEXT" | jq -e '.year' > /dev/null 2>&1; then
        echo "$RESULT_TEXT" | jq '.' > "${OUTPUT}.raw"
      else
        # Try extracting a JSON block from a wrapped response
        echo "$RESULT_TEXT" | sed -n '/^{/,/^}/p' | jq '.' > "${OUTPUT}.raw" 2>/dev/null || \
        echo "$RESULT_TEXT" | grep -Pzo '(?s)\{.*\}' | jq '.' > "${OUTPUT}.raw" 2>/dev/null || \
        echo "$RESULT_TEXT" > "${OUTPUT}.raw"
      fi
    else
      cp "${OUTPUT}.tmp" "${OUTPUT}.raw" 2>/dev/null || true
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
    echo "[${YEAR}] Claude Code exited non-zero (code ${CLAUDE_EXIT}) on attempt ${ATTEMPT}." | tee -a "$LOGFILE"
    rm -f "${OUTPUT}.tmp" "${OUTPUT}.raw"
  fi

  # Back off before retry (only for real failures, not rate limits)
  [ "$SUCCESS" = false ] && [ $ATTEMPT -lt $MAX_RETRIES ] && sleep 30
done

# Update progress
if [ "$SUCCESS" = true ]; then
  jq "(.in_progress |= map(select(. != ${YEAR}))) | .completed += [${YEAR}]" "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
else
  jq "(.in_progress |= map(select(. != ${YEAR}))) | .failed += [${YEAR}]" "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
  echo "[${YEAR}] FAILED after ${MAX_RETRIES} attempts." | tee -a "$LOGFILE"
fi
