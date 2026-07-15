#!/bin/bash
# Usage: generate_prompt.sh <year_int>
# Outputs the fully substituted prompt to stdout

YEAR=$1
PROMPT_TEMPLATE="/workspace/RESEARCH_PROMPT.md"

# Fallback for non-Docker runs
if [ ! -f "$PROMPT_TEMPLATE" ]; then
  PROMPT_TEMPLATE="$(cd "$(dirname "$0")/.." && pwd)/RESEARCH_PROMPT.md"
fi

if [ "$YEAR" -lt 0 ]; then
  YEAR_LABEL="$(echo $YEAR | sed 's/-//') BCE"
else
  YEAR_LABEL="${YEAR} CE"
fi

sed -e "s/{{YEAR}}/${YEAR}/g" -e "s/{{YEAR_LABEL}}/${YEAR_LABEL}/g" "$PROMPT_TEMPLATE"
