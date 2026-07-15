# Self-Optimization Report
**Project:** Human History According to AI
**Date:** 2026-04-17
**Status:** COMPLETE

## Reconnaissance Summary

This repo produces a 5,226-year structured-JSON chronicle of world history (2025 CE → ~3200 BCE) with a Next.js 16 / React 19 interactive frontend on top. Layer 1 — one JSON file per year, ICCRA-schema, Sonnet-4.6-authored — shipped 2026-04-13 (17,991 events, 13,130 cross-year graph edges, 0 failed years, ~$15.68 total API cost). The daemon is a Python 3.11 async pipeline (`scripts/api_client.py` + `scripts/orchestrator.sh` + `scripts/run_year.sh`) running in Docker (`docker/docker-compose.yml`), which progressed through five cost-optimization phases (CLI → direct API, archived Haiku + Gemini Flash experiments as `outputs/{haiku,gemini}_experiment/`). Layer 2 — scholarly evidence deep-dives via Scite MCP — is in progress on the current `evidence-layer` branch (76 files, 1.5 MB, staged-but-uncommitted; see `History_timeline_status170426.md`). Frontend aggregation pipeline: `outputs/json/*.json` → `frontend/scripts/aggregate-data.mjs` → `frontend/public/data/chunks/` (100-year chunks + manifest); Vercel auto-deploys on push to `main`. Git patterns are bimodal: high-frequency daemon commits (`Progress: N/5226 …`, `Auto-refresh: …`) from `scripts/git_sync.sh` and `scripts/refresh_frontend.sh`, and sparse human commits in lowercase-prefix style (`docs:`, `fix:`, `feat:`, `redesign:`). No existing `.claude/` config, no `.github/workflows/`, no JS/TS tests — QA runs through `scripts/validate_corpus.py` and observed-crash hardening in the frontend.

## What Was Created or Modified

| File | Action | Description |
|------|--------|-------------|
| `CLAUDE.md` | Created | Root project rules (97 lines, top 8 rules in first ~25 lines): locked-file list, schema summary, anti-patterns with evidence, command reference, branching rules, AI-data defensive-lookup convention |
| `.claude/commands/validate-corpus.md` | Created | Runs `validate_corpus.py`, proposes migrator patterns (never hand-edits `outputs/json/`), diffs against last green run |
| `.claude/commands/refresh-frontend.md` | Created | Regenerates chunks via `aggregate-data.mjs`, cross-checks manifest against disk |
| `.claude/commands/research-year.md` | Created | End-to-end single-year research workflow honoring ICCRA constraints; calls `api_client.py` or single-shots; validates before reporting; benchmarks against `1066.json`/`-500.json` for thin-output (Haiku-failure) detection |
| `.claude/commands/pre-commit-check.md` | Created | Branch-sanity, scope-check, locked-file guard, frontend lint/build, corpus validator, evidence-layer retraction check, commit-message style verification |
| `.claude/settings.json` | Created | Deny-writes to `RESEARCH_PROMPT.md`, `outputs/json/**`, `outputs/{haiku,gemini}_experiment/**`; allow common read-only + validator bash commands |

No existing files were modified. No source, tests, or configuration were touched.

## Anti-Patterns Discovered

Each of these is backed by an artifact in the repo or git history — not speculation.

1. **Using a smaller / different model without a quality comparison.** Evidence: `outputs/haiku_experiment/` and `outputs/gemini_experiment/` directories exist as archives of failed quality tests. `README.md` Phase 4 documents that Haiku produced "thinner output — shorter descriptions, fewer cross-references, empty geographic_coverage_gaps." `scripts/api_client.py:62-69` encodes the final decision: `DEFAULT_STRATEGY` routes every year to `claude-sonnet-4-6`. Rule: never swap models without archiving a side-by-side sample.

2. **Hand-editing `outputs/json/*.json` to "fix" schema drift.** Evidence: `scripts/fix_categories.py` exists because the daemon occasionally produced compound `category` values like `"political | military"` that had to be normalized across the corpus. The pattern is to write a migrator, not to patch individual files. `scripts/backfill_meta.py` follows the same pattern.

3. **Frontend unguarded enum lookups.** Evidence: commits `b87432d fix: guard YearTimelineCard against unknown category/docLevel values` and its predecessor `fix: guard CATEGORY_CONFIG/CERTAINTY_CONFIG lookups against unknown AI-generated values` (both reachable via `git log --all --oneline`). AI output occasionally contains enum values outside the declared schema even after validation — any frontend map lookup against `CATEGORY_CONFIG`, `CERTAINTY_CONFIG`, or a docLevel config must fall back safely.

4. **Using `claude -p` CLI for bulk generation.** Evidence: `README.md` Phase 3 documents the migration from `claude -p` to direct API, and `scripts/run_year.sh:118-121` still contains the CLI invocation path as a legacy alternative. The CLI adds ~3.5× token overhead per `README.md` Phase 2 ("Optimization Analysis"). Rule: the direct-API path in `scripts/api_client.py` is authoritative.

5. **Committing secrets or local-only state.** Evidence: `.gitignore` excludes `docker/.env`, `state/lock/`, `*.tmp`, and `.claude/`. Note: the last entry means the new `.claude/` configuration created by this mission is local-only; flagged below for commander decision.

## Key Learnings for Future Sessions

1. **The corpus is a contract, not a working artifact.** 5,226 year-JSONs in `outputs/json/` are frozen Phase-1 outputs; any schema change is retroactive and expensive. Migrations go through new scripts, not in-place edits. `RESEARCH_PROMPT.md` is locked — changing it invalidates the corpus's provenance.

2. **Honesty > completeness.** The project's whole value proposition is declared gaps, named sources, and `disconfirming_evidence`. In any work here, empty arrays with honest `era_context` beat fabricated entries; "No disconfirming evidence identified" beats an empty string. This maps directly to the system prompt's anti-sycophancy protocol.

3. **Two active branches, two different QA regimes.** `main` = Phase 1 corpus (validator is the gate). `evidence-layer` = Scite-sourced scholarly layer (retraction-enforcement + DOI verification is the gate, not ICCRA schema). Don't cross the streams — `validate_corpus.py` does not apply to `evidence-layer/`.

4. **Next.js 16 + React 19 = training data is stale.** Per `frontend/AGENTS.md`, read `frontend/node_modules/next/dist/docs/` before writing frontend code. Treat React 19 async components, Server Actions, and file-system-router conventions as unknowns until verified.

5. **AI-authored data requires defensive UI.** Even after the validator passes, downstream code must guard against unknown enum values. The pattern `CONFIG[key] ?? CONFIG.defaultKey` is established by two prior "guard" commits and should be reused in any new UI component touching corpus data.

## Flags for Commander Review 🔺

1. **`.claude/` is in `.gitignore`.** The configuration created by this mission (`.claude/commands/*.md`, `.claude/settings.json`, `.claude/SELF-OPTIMIZATION-REPORT.md`) will not be committed by default. Options:
   - (a) Leave as-is — configuration is local-only per-developer.
   - (b) Remove the `.claude/` line from `.gitignore` and commit — share slash commands with any future contributor. Recommended if Layer 2 research brings in new collaborators.
   - (c) Replace the `.claude/` line with `.claude/local/` and move private state there — selective sharing. `CLAUDE.md` at repo root is already outside `.gitignore` and will be committed normally.

2. **Uncommitted `evidence-layer/` (76 files).** Not a configuration issue, but it intersects with these new commands. `/pre-commit-check` references Scite / retraction enforcement which only apply once `evidence-layer/` is staged; if the commander decides to ship Layer 2 to a separate repo instead, that command section becomes dead weight and should be trimmed.

3. **Daemon may still be running idle on Hercules.** Phase 1 is complete, but `docker-compose.yml` uses `restart: unless-stopped`. Not urgent; flagged for awareness if daemon-related scripts are edited.

## Configuration Quick Reference

### Slash commands (in `.claude/commands/`)

| Command | Use case |
|---|---|
| `/validate-corpus` | Run `validate_corpus.py`, surface error/warning deltas, propose migrators (never auto-fix) |
| `/refresh-frontend` | Regenerate 100-year chunks + manifest from `outputs/json/`; cross-check with disk |
| `/research-year <year>` | End-to-end ICCRA-compliant single-year research; uses `api_client.py`; benchmarks against reference years for thin-output detection |
| `/pre-commit-check` | Full pre-commit gate: branch sanity, locked-file guard, frontend lint/build, corpus validation, evidence-layer sanity, commit-style verification |

### Hook / settings enforcement (`.claude/settings.json`)

- **Denied (write-locked):** `RESEARCH_PROMPT.md`, `outputs/json/**`, `outputs/haiku_experiment/**`, `outputs/gemini_experiment/**`. These are either canonical prompts, daemon-owned outputs, or quality archives — all require a migrator or new run rather than in-place edits.
- **Allowed (auto-approved):** read-only bash commands (`git status/diff/log/branch`, `jq`, validator scripts, frontend lint/build/dev, aggregator).

### `CLAUDE.md` highlights

- First 25 lines contain the 8 top-priority rules (locked files, no hand-edits, schema is enforced, no silent model swaps, defensive UI, Next.js 16 warning, priority ordering, commit style).
- Section `FILE / DIRECTORY MAP` gives a per-path touch policy.
- Section `CORPUS SCHEMA (ICCRA)` inlines the exact valid-values enums so validator logic can be cross-checked without opening `validate_corpus.py`.
- Section `ANTI-PATTERNS` lists evidence-linked failure modes.
- Section `HANDLING AI-GENERATED DATA IN UI` codifies the defensive-lookup pattern established by two prior bug-fix commits.

Total: 97 lines, all critical rules within the first ~25 lines.
