# Human History Daemon — Setup Instructions for Claude Code Daemon Factory

> **Project:** Human_history
> **Location:** ~/Human_history/
> **Objective:** Map humanity's history year-by-year from 2025 CE to ~3200 BCE using AI research agents.
> **Duration:** ~70 days continuous operation
> **Parallelism:** 5 agents concurrently (5 years per 20-minute cycle)
> **Total runs:** ~5,226 years ÷ 5 agents = ~1,046 cycles × 20 min = ~14.5 days minimum wall-clock (with overhead and retries, budget 70 days)

---

## 1. Project Structure

```
~/Human_history/
├── RESEARCH_PROMPT.md          # The ICCRA-structured prompt template (already exists)
├── DAEMON_SETUP.md             # This file
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── entrypoint.sh
│   └── .env
├── scripts/
│   ├── orchestrator.sh         # Main loop: picks next years, launches 5 agents
│   ├── run_year.sh             # Single-year agent runner
│   ├── generate_prompt.sh      # Template substitution for {{YEAR}} and {{YEAR_LABEL}}
│   └── health_check.sh         # Monitors agent status, logs failures
├── state/
│   ├── progress.json           # Tracks which years are done/failed/pending
│   └── lock/                   # Per-year lock files to prevent double-runs
├── outputs/
│   ├── json/                   # Raw JSON per year: 2025.json, 2024.json, ..., -3200.json
│   ├── failed/                 # Failed runs moved here with error logs
│   └── logs/                   # Per-run logs: 2025.log, etc.
└── synthesis/                  # Future: aggregated graph, timeline, analysis
```

---

## 2. Docker Setup (Reboot-Persistent)

### Dockerfile

```dockerfile
FROM ubuntu:24.04

# System deps
RUN apt-get update && apt-get install -y \
    curl git jq bc coreutils bash \
    nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Working directory
WORKDIR /workspace

# Copy project files
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  human-history-daemon:
    build:
      context: ./docker
    container_name: human_history_daemon
    restart: unless-stopped          # Survives reboots
    volumes:
      - ../:/workspace               # Mount entire Human_history project
      - ~/.claude:/root/.claude       # Claude Code auth/config
      - ~/.anthropic:/root/.anthropic # API keys
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - PARALLEL_AGENTS=5
      - CYCLE_INTERVAL_SECONDS=1200   # 20 minutes
      - START_YEAR=2025
      - END_YEAR=-3200
      - MAX_RETRIES=3
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    deploy:
      resources:
        limits:
          memory: 16G
```

### .env

```bash
ANTHROPIC_API_KEY=<your-key-here>
```

### entrypoint.sh

```bash
#!/bin/bash
set -euo pipefail

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Human History Daemon starting"
echo "  Parallel agents: ${PARALLEL_AGENTS}"
echo "  Cycle interval:  ${CYCLE_INTERVAL_SECONDS}s"
echo "  Year range:      ${START_YEAR} → ${END_YEAR}"

# Ensure directories
mkdir -p /workspace/outputs/json /workspace/outputs/failed /workspace/outputs/logs
mkdir -p /workspace/state/lock /workspace/scripts

# Initialize progress tracker if missing
if [ ! -f /workspace/state/progress.json ]; then
  echo '{"completed": [], "failed": [], "in_progress": []}' > /workspace/state/progress.json
fi

# Main daemon loop
exec /workspace/scripts/orchestrator.sh
```

---

## 3. Core Scripts

### scripts/generate_prompt.sh

```bash
#!/bin/bash
# Usage: generate_prompt.sh <year_int>
# Outputs the fully substituted prompt to stdout

YEAR=$1
PROMPT_TEMPLATE="/workspace/RESEARCH_PROMPT.md"

if [ "$YEAR" -lt 0 ]; then
  YEAR_LABEL="$(echo $YEAR | sed 's/-//') BCE"
else
  YEAR_LABEL="${YEAR} CE"
fi

sed -e "s/{{YEAR}}/${YEAR}/g" -e "s/{{YEAR_LABEL}}/${YEAR_LABEL}/g" "$PROMPT_TEMPLATE"
```

### scripts/run_year.sh

```bash
#!/bin/bash
# Usage: run_year.sh <year_int>
# Runs a single Claude Code research agent for one year

set -euo pipefail

YEAR=$1
LOCKFILE="/workspace/state/lock/${YEAR}.lock"
OUTPUT="/workspace/outputs/json/${YEAR}.json"
LOGFILE="/workspace/outputs/logs/${YEAR}.log"
PROGRESS="/workspace/state/progress.json"
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
PROMPT=$(bash /workspace/scripts/generate_prompt.sh "$YEAR")

ATTEMPT=0
SUCCESS=false

while [ $ATTEMPT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "[${YEAR}] Attempt ${ATTEMPT}/${MAX_RETRIES}" | tee -a "$LOGFILE"

  # Run Claude Code in print mode (non-interactive, single prompt, stdout capture)
  if claude -p "${PROMPT}" --output-format json > "${OUTPUT}.tmp" 2>> "$LOGFILE"; then
    # Extract the actual JSON response from Claude Code output
    # Claude Code --output-format json wraps the response; extract the assistant message content
    jq -r '.result // .content // .' "${OUTPUT}.tmp" > "${OUTPUT}.raw" 2>/dev/null || cp "${OUTPUT}.tmp" "${OUTPUT}.raw"

    # Validate: must be valid JSON with a "year" field
    if jq -e '.year' "${OUTPUT}.raw" > /dev/null 2>&1; then
      mv "${OUTPUT}.raw" "$OUTPUT"
      rm -f "${OUTPUT}.tmp"
      SUCCESS=true
      echo "[${YEAR}] Completed successfully." | tee -a "$LOGFILE"
    else
      echo "[${YEAR}] Output failed JSON validation on attempt ${ATTEMPT}." | tee -a "$LOGFILE"
      mv "${OUTPUT}.raw" "/workspace/outputs/failed/${YEAR}-attempt${ATTEMPT}.json" 2>/dev/null || true
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
```

### scripts/orchestrator.sh

```bash
#!/bin/bash
# Main daemon loop. Picks next N years, launches parallel agents, waits, repeats.

set -euo pipefail

PARALLEL=${PARALLEL_AGENTS:-5}
INTERVAL=${CYCLE_INTERVAL_SECONDS:-1200}
START=${START_YEAR:-2025}
END=${END_YEAR:--3200}
PROGRESS="/workspace/state/progress.json"

get_next_years() {
  # Walk from START down to END, skip completed and failed
  local count=0
  local year=$START

  while [ $year -ge $END ] && [ $count -lt $PARALLEL ]; do
    # Check if already done or failed
    if ! jq -e "(.completed + .failed) | index(${year})" "$PROGRESS" > /dev/null 2>&1; then
      echo $year
      count=$((count + 1))
    fi
    year=$((year - 1))
  done
}

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
    echo "{\"status\": \"complete\", \"completed\": ${COMPLETED}, \"failed\": ${FAILED}, \"timestamp\": \"${TIMESTAMP}\"}" > /workspace/state/final_status.json
    exit 0
  fi

  # Get next batch
  YEARS=$(get_next_years)

  if [ -z "$YEARS" ]; then
    echo "No years available to process. Waiting..."
    sleep $INTERVAL
    continue
  fi

  echo "  Launching agents for years: $(echo $YEARS | tr '\n' ' ')"

  # Launch agents in parallel
  PIDS=()
  for year in $YEARS; do
    bash /workspace/scripts/run_year.sh "$year" &
    PIDS+=("$!")
    sleep 2  # Stagger launches slightly to avoid API burst
  done

  # Wait for all agents to complete
  for pid in "${PIDS[@]}"; do
    wait "$pid" 2>/dev/null || true
  done

  echo "  Batch complete. Sleeping ${INTERVAL}s before next cycle."
  sleep $INTERVAL
done
```

### scripts/health_check.sh

```bash
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
TOTAL=5227

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
```

---

## 4. Deployment Commands

Run these on Hercules to initialise everything:

```bash
cd ~/Human_history

# Create directory structure
mkdir -p docker scripts state/lock outputs/json outputs/failed outputs/logs synthesis

# Copy the scripts (the daemon factory should write them from the content above)
# Then make executable:
chmod +x scripts/*.sh docker/entrypoint.sh

# Build and launch
cd docker
docker compose up -d --build

# Verify running
docker logs -f human_history_daemon

# Health check from host
bash ~/Human_history/scripts/health_check.sh
```

---

## 5. Operations

### Monitor
```bash
# Live logs
docker logs -f human_history_daemon

# Health check
bash ~/Human_history/scripts/health_check.sh

# Count completed outputs
ls ~/Human_history/outputs/json/ | wc -l
```

### Retry failed years
```bash
# Clear failed list to allow re-processing
cd ~/Human_history
jq '.failed = []' state/progress.json > state/progress.json.tmp && mv state/progress.json.tmp state/progress.json
docker restart human_history_daemon
```

### Pause / Resume
```bash
docker stop human_history_daemon    # Pause
docker start human_history_daemon   # Resume — picks up where it left off
```

### Survives reboot
The `restart: unless-stopped` policy in docker-compose means the container restarts automatically after any system reboot. Progress is persisted in `state/progress.json` on the host volume, so no work is lost.

---

## 6. Post-Completion

When the daemon reports all years complete:

1. **Validate corpus:** `for f in outputs/json/*.json; do jq -e '.year' "$f" > /dev/null || echo "INVALID: $f"; done`
2. **Merge to single file:** `jq -s 'sort_by(.year) | reverse' outputs/json/*.json > synthesis/human_history_complete.json`
3. **Generate graph edges:** `jq -s '[.[].graph_edges[]? | select(. != null)]' outputs/json/*.json > synthesis/all_edges.json`
4. **Import to Neo4j:** Convert `all_edges.json` + events to Cypher import script
5. **Run adversarial pass:** Feed the full corpus to the Honest Oracle for cross-year consistency checks
6. **Export timeline:** Generate a chronological markdown or interactive visualisation

---

## 7. Handover Notes for Daemon Factory

This project is fully self-contained in `~/Human_history/`. The daemon factory needs to:

1. **Write the files** from sections 2 and 3 above into their respective paths
2. **Set the API key** in `docker/.env`
3. **Build and launch** the Docker container
4. **Verify** the first cycle completes with 5 valid JSON outputs
5. **Confirm reboot persistence** with `sudo reboot` + verify container auto-restarts

The RESEARCH_PROMPT.md is already in place. The prompt uses {{YEAR}} and {{YEAR_LABEL}} as substitution tokens. The generate_prompt.sh script handles the substitution including BCE year formatting.

The orchestrator walks years from 2025 downward. Progress is idempotent — interrupted runs leave no corrupt state. Failed years are logged and can be retried by clearing the failed list.

**Expected resource usage per cycle:**
- 5 parallel Claude Code instances
- ~15K–30K tokens per year (varies enormously: 2024 will use much more than -2800)
- ~20 min wall-clock per cycle including sleep
- ~50MB disk for the full 5,226-year JSON corpus

**This is a Tier C production run under the Smarason Method.** The prompt includes anti-sycophancy protocol, disconfirming evidence requirements, source typing, and graph edges. Post-completion, the Honest Oracle should review the full corpus for cross-year consistency, convergence bias, and Western-centric gaps.
