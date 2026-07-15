# Chronograph v0.2.0 — Notebook + Layer 2 Evidence

Released 2026-04-18.

This is the first tagged release. It bundles the original Layer 1 corpus (shipped 2026-04-13), the new Layer 2 scholarly evidence work (shipped 2026-04-17), and a wholesale frontend rebuild (2026-04-18).

---

## 📖 Frontend — completely rebuilt

The original prototype ("Eternal Codex" — dark-gold grimoire) has been **removed and rebuilt** from scratch using the Claude Design handoff bundle.

Three coordinated surfaces, one navigation:

- **Notebook** (`/`) — cream parchment, oxblood editorial stamps, Newsreader serif display. Virtualised 5,226-row timeline with bookmark lanes for era / decade rules. Every year is a folio entry.
- **Stratum** (`/stratum`) — dataset-as-instrument dashboard. Click-anywhere-to-jump year strip, 3-panel stats, event grid with category rail + contempo/later source meters.
- **Atlas** (`/atlas`) — orthographic globe with 17,515 plotted events. Imperative RAF canvas draw, time-brush histogram, category filter, off-Earth / orbital toggle, LOD that switches heat → cluster → pin by zoom.

**Two-layer shell** — brand + Methodology + GitHub are always visible; the view switcher appears only on the three interactive routes. Reading routes (year, era, methodology) render without the switcher.

**Per-year folio** (`/year/[id]`) and **per-era scholarly brief** (`/era/[id]`) both rebuilt in the Notebook idiom: FOLIO stamp + ordinal, italic display year, § 01 Events with indexed dossier entries, § 02 Disconfirming evidence, § 03 Historiographic note, § 04 Cross-year edges, triple-ruled end-of-entry footer.

**Proper Open Graph** — 1200×630 cream-folio card via Next 16 file convention, rendered with Newsreader + Inter Tight.

---

## 🔬 Layer 2 — Scholarly Evidence (new)

Introduced under `evidence-layer/` — scholarly deep-dives per era via the Scite MCP.

| Phase | Eras | Status |
|---|---|---|
| Phase 3 (schema v1.0.0, god-tier) | 7 | ✅ validated |
| Phase 2 (pre-schema) | 13 | ⚠ awaiting re-migration |
| Education pilots | 3 | ✅ VALOR-sourced |

- **161 bibliography entries** harvested from Scite and VALOR
- **9 validation missions** including the Mediterranean-diet / CVD god-tier run that caught the **PREDIMED retraction**
- **143 citations** from the VALOR education corpus catalogued
- Scite MCP whitepaper + case study at `/methodology/scite-mcp` on the live site

---

## ✅ Layer 1 — Corpus (reference)

| Metric | Value |
|---|---|
| Years researched | 5,226 / 5,226 |
| Events | 17,991 |
| Graph edges | 13,130 |
| Failed years | 0 |
| Runtime | 57.7 hours |
| Cost | ~$15.68 |
| Model | Claude Sonnet 4.6 |

99.98% of events have named sources. Every year carries disconfirming evidence, historiographic note, geographic gap declarations, and cause-effect graph edges.

---

## 🧪 Quality gates

Three reproducible Playwright scripts ship under `frontend/scripts/`:

- `qa-tour.mjs` — screenshot every surface at multiple scroll positions
- `qa-font-audit.mjs` — walks the live DOM, flags any text under 14px
- `qa-contrast.mjs` — computes WCAG AA ratios on every reading element

Result at ship: 0 text nodes under 14px on any reading surface (one intentional 13.8px inline `<code>` in methodology prose). Globe rail passes AA with 9–17× ratios on every meta label.

---

## 🐞 Notable fixes in this cycle

- Timeline virtualizer stabilised with uniform 168px rows + bookmark-lane era headers (was leaking ~500px phantom gaps at certain scroll offsets)
- Globe rotation decoupled from React state — imperative RAF loop reads `rotRef`, no re-render over 17k events per frame
- Globe drag restored to canonical d3-geo convention (right = reveal east)
- Sticky chrome made fully opaque (was bleeding content through at 78% blur)
- Era pills collapsed to 6 primary + overflow toggle so the secondary scholarly-era row stops clipping at "Hellenistic World"
- "Edu" ambiguous badge → GraduationCap icon + tooltip
- Off-Earth keyword-filter: Apollo, ISS, Mars-rover, Hubble etc. no longer dot the mid-Pacific
- Blue-on-blue heading regression fixed (Notebook `--fg` was bleeding into the Atlas surface)

---

## 📄 License

Code: MIT (see `LICENSE`).
Corpus data (JSON under `outputs/json/`, aggregated chunks, evidence layer): CC BY 4.0 — attribution required.

---

## 🙏 Credits

- **Research daemon + corpus**: Claude Sonnet 4.6 via the ICCRA schema
- **Layer 2 scholarly pipeline**: Scite MCP + VALOR education corpus
- **Frontend design**: Claude Design (claude.ai/design)
- **Frontend implementation**: Claude Code
- **Orchestration, direction, all the feedback loops**: Magnús Smári Smárason

**Live site:** https://human-history-acording-to-ai.vercel.app
