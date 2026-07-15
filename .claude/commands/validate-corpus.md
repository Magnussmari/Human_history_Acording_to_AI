---
description: Run the full ICCRA schema validator on outputs/json/ and summarize
---

Validate the Layer 1 corpus.

Steps:

1. Run `python3 scripts/validate_corpus.py` from the repo root.
2. Parse the summary:
   - If "Valid: 5226 (100.0%)" with 0 errors — report green.
   - If any file has errors — list the offending filenames and the first 3 error messages per file; do NOT attempt to auto-fix `outputs/json/*.json`; instead propose either a new migrator script in `scripts/` (following the pattern of `fix_categories.py`) or a targeted re-research run.
3. Flag any new warnings that weren't present in the last green run (if `state/last_validation.json` exists, diff against it).
4. Surface the corpus stats block: total events, events per year, category distribution, certainty distribution, models used.

Constraints:
- Never hand-edit `outputs/json/*.json`.
- Never modify `RESEARCH_PROMPT.md`.
- If Layer 2 (`evidence-layer/`) needs validation, note it — the schema differs; use the evidence-layer own validator under `evidence-layer/methodology/scite-skill-system/reference/schema.json`.
