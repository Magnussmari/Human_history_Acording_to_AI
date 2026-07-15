---
description: Pre-commit verification for human-authored changes
---

Run before committing human work. Skips daemon auto-commits.

Branch-gated: the gate you run depends on `git rev-parse --abbrev-ref HEAD`.

Steps:

1. **Branch sanity.** Capture `BRANCH=$(git rev-parse --abbrev-ref HEAD)`.
   - If `BRANCH = main`: Phase 1 is frozen; confirm the change genuinely belongs there. Most new work should be on `evidence-layer` or a feature branch.
   - If `BRANCH = evidence-layer`: Layer 2 scholarly work; do not touch Layer 1 corpus files.
   - Any other branch: treat as feature branch; apply both gates as relevant to the touched paths.
2. **Scope check.** `git status` + `git diff --stat`. Confirm regardless of branch:
   - No unintended edits to `RESEARCH_PROMPT.md` (locked)
   - No hand-edits to `outputs/json/*.json` (daemon-owned)
   - No staged `docker/.env`, `state/lock/`, `*.tmp`, `.claude/state/`, or `.claude/local/` contents
   - No staged `outputs/haiku_experiment/` or `outputs/gemini_experiment/` changes (read-only archives)
3. **Branch-gated validator.**
   - **`main` gate (ICCRA / Layer 1):**
     - If `outputs/json/` or `scripts/*.py` is touched: `python3 scripts/validate_corpus.py` — must pass 100%.
     - If `frontend/` is touched: `cd frontend && npm run lint` and `cd frontend && npm run build` — both must pass (catches Next.js 16 breaking-change issues).
     - Frontend enum-guard spot-check: any new lookup against `CATEGORY_CONFIG`, `CERTAINTY_CONFIG`, or a docLevel map must have a fallback for unknown values. If not, flag it.
   - **`evidence-layer` gate (Scite / Layer 2):**
     - Confirm every citation added has a DOI retrieved through `mcp__scite__search_literature` — no raw-LLM-generated citations.
     - Confirm retraction enforcement hasn't regressed. Reference: `evidence-layer/methodology/scite-skill-system/CASE_STUDY.md` (PREDIMED 2013 `10.1056/NEJMoa1200303` must remain excluded).
     - Validate new era JSONs against `evidence-layer/methodology/scite-skill-system/reference/schema.json` (schema v1.0.0) — not `validate_corpus.py`, which is for Layer 1 only.
     - Spot-check budget: if Scite MCP calls were made, ensure the monthly quota (`~/.scite-quota.json`) isn't exceeded.
4. **Commit message check (if drafted).** Human commits should follow the observed style: lowercase `<type>:` prefix (`docs:`, `fix:`, `feat:`, `redesign:`), short active-voice summary, optional em-dash elaboration. Do not mimic daemon commits (`Progress: …`, `Auto-refresh: …`).
5. Report a green/red summary and which gate ran. Only the commander runs `git commit`.
