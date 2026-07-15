---
description: Regenerate frontend data chunks from outputs/json/ and verify manifest
---

Refresh the frontend's aggregated data and confirm the manifest.

Steps:

1. From the repo root, run `node frontend/scripts/aggregate-data.mjs`.
2. Read `frontend/public/data/manifest.json` and confirm:
   - `total_years` matches the count of non-tmp files in `outputs/json/`
   - `total_events` matches the sum of `.events[]` across all years (spot-check a few)
   - `year_range.newest` is 2025 and `year_range.oldest` is near -3200
   - `chunks[]` entries all exist on disk under `frontend/public/data/chunks/`
3. If mismatched, re-run the aggregator once. If still mismatched, list the skipped files from stdout ("Skip invalid: …") and stop — the year JSON is malformed; escalate to `/validate-corpus`.
4. Do NOT commit. That's the commander's call. Emit a one-line summary with the new `total_years` and `total_events`.

Constraints:
- Aggregator must be run from repo root (`JSON_DIR=outputs/json` is relative).
- The command wipes and rewrites `frontend/public/data/chunks/` — safe, it is regenerated deterministically.
