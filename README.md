# Human History — Year-by-Year Chronicle

**A 70-day AI research project mapping humanity's history from 2025 CE to ~3200 BCE.**

Each year is researched independently by a Claude Code agent using the ICCRA-structured research prompt (Smarason Method / Tier C). The daemon runs 5 parallel agents per cycle, producing structured JSON with events, sources, confidence levels, graph edges, and anti-sycophancy checks.

## Status

Check `state/progress.json` for current progress. Each completed year produces a JSON file in `outputs/json/`.

**Target:** 5,226 years | **Agents per cycle:** 5 | **Cycle interval:** 20 minutes

## Output Schema

Each year's JSON includes:
- `year` / `year_label` — numeric and human-readable
- `era_context` — 2-4 sentence period description
- `documentation_level` — rich / moderate / sparse / minimal / negligible
- `events[]` — structured events with sources, certainty levels, coordinates
- `disconfirming_evidence` — mandatory anti-sycophancy section
- `historiographic_note` — source reliability assessment
- `graph_edges[]` — cross-year relationships for graph synthesis

## Architecture

- `scripts/orchestrator.sh` — Main daemon loop
- `scripts/run_year.sh` — Single-year agent runner
- `scripts/generate_prompt.sh` — Template substitution
- `docker/` — Containerized deployment (auto-restarts on reboot)
- `LEDGER.md` — Append-only progress log updated every ~20 years

## Post-Completion

The full corpus will be:
1. Validated for structural consistency
2. Merged into a unified timeline
3. Graph edges extracted for Neo4j import
4. Adversarially reviewed for cross-year consistency

---

*Magnus Smárason | smarason.is*
