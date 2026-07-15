---
description: Research a single year following the ICCRA protocol and the locked RESEARCH_PROMPT.md
argument-hint: <year-int, negative for BCE>
---

Research year **$ARGUMENTS** and produce a schema-valid JSON file at `outputs/json/$ARGUMENTS.json`.

Steps:

1. **Check state first.** Read `state/progress.json`. If `$ARGUMENTS` is already in `.completed`, abort and surface the existing `outputs/json/$ARGUMENTS.json` instead of re-running.
2. **Generate the prompt.** Run `bash scripts/generate_prompt.sh $ARGUMENTS` to substitute `{{YEAR}}` and `{{YEAR_LABEL}}` into the canonical template. Do not modify the template.
3. **Run the research.** Two options:
   - Preferred (matches daemon): invoke `scripts/api_client.py` via `python3 scripts/api_client.py --year $ARGUMENTS --prompt-file RESEARCH_PROMPT.md --output-dir outputs/json` — this uses Sonnet 4.6 against the Anthropic API directly. Requires `ANTHROPIC_API_KEY` in env.
   - Alternative (single-shot from this conversation): follow the prompt yourself using the rules in `RESEARCH_PROMPT.md`. Return valid JSON only, no markdown fences.
4. **Validate the output.**
   - `jq -e '.year and .events and .disconfirming_evidence' outputs/json/$ARGUMENTS.json` — must pass
   - `python3 scripts/validate_corpus.py 2>&1 | grep -A5 "$ARGUMENTS.json"` — must show no errors
5. **Do NOT auto-commit.** Report the file path, event count, certainty distribution, and any declared geographic gaps. Let the commander review.

Hard constraints (from `RESEARCH_PROMPT.md` — do not violate):
- No fabrication. Empty `events` with honest `era_context` beats hallucinated entries.
- Every event names a specific source; "general knowledge" is not acceptable.
- Single-value `category` and `certainty` — no compound values.
- `disconfirming_evidence` never empty (`"No disconfirming evidence identified for events listed."` is acceptable).
- `geographic_coverage_gaps` must be an array; empty only if coverage is actually global.
- No modern categories on pre-modern events (no "economic crisis" for a Bronze Age palace fire).

Quality benchmark: compare against `outputs/json/1066.json` for a modern year or `outputs/json/-500.json` for an ancient one. If output is noticeably thinner (shorter descriptions, no cross-references, empty `geographic_coverage_gaps`), flag it — thin outputs are the Haiku-experiment failure mode.
