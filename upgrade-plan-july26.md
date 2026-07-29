# Chronograph — Upgrade Plan, July 2026

**Status:** planning · no work started
**Author:** Magnus Smárason | smarason.is
**Date:** 2026-07-29
**Live target:** https://timeline.sumarhus.com (sovereign edge, smarason-edge-hel1)

Sequences the two 2026-07-29 brainstorms into buildable work, grounded in the
repo as it actually stands today.

**Inputs**
- `docs/era-expansion-brainstorm-2026-07-29.md` — ~25 proposed new scholarly eras
  (dark history, non-Western civilisations, thematic Big-History lenses).
- `docs/ux-brainstorm-parallel-timelines-2026-07-29.md` — era-filter → visual
  scrubber, swimlane parallel timelines, filter discoverability.
- `docs/ux-audit-2026-07-16.md` — the earlier audit; several items still open.
- `docs/tech-debt.md`, `docs/s-tier-isc.md` — the standing debt + quality gates.

---

## 0. The spine of this plan

Both brainstorms want the same thing and neither says it outright:

> **An event currently belongs to at most one era. Everything downstream —
> swimlanes, parallel tracks, thematic lenses, dark-history filters — requires
> an event to belong to *many* eras at once.**

The Haitian Revolution is simultaneously Age of Revolutions, Age of Abolition,
and Modern. The Black Death is both a Medieval year-range and a thematic crisis
lens. So the data model change is the precondition, not a parallel track. Any
order that builds swimlane UI before the many-to-many era model will build it
twice.

**Therefore: Data model → Era corpus → UI → Research depth.** Workstreams B and
C can overlap once A ships; D runs continuously.

---

## 1. Where the repo actually stands (2026-07-29)

| Thing | State |
|---|---|
| Last commit | `a890b2e` 2026-07-17 — autonomous-loop checkpoint, S-tier wind-down |
| **Working tree** | **DIRTY on `main`** — an unlanded SEO refactor (see §2) |
| Corpus (Layer 1) | 5,226 years · 17,991 events · 13,130 edges · shipped |
| Evidence (Layer 2) | 22 eras registered: 7 phase-3 validated, 13 phase-2 drifted, 2 unresearched |
| Era numbering | Registry uses 1–20, 25, 50; **21–49 reserved via `futureBuckets`, unfilled** |
| Frontend | Next 16 / React 19 · Notebook + Stratum + Atlas · E2E + CI green · a11y 0 serious/critical |
| Translation | EN→IS pipeline shipped, IS backfill in flight |

The era registry already reserves the numeric space this expansion wants to
fill. That is a gift — the expansion is *filling a designed gap*, not
retrofitting.

---

## 2. Workstream 0 — Clear the deck (do this first, half a day)

The tree has an uncommitted, coherent refactor sitting on `main`: server shells
for `/year/[id]` and `/era/[id]` (`page.tsx`) delegating to new client
components (`YearFolioClient.tsx`, `EraDossierClient.tsx`), plus
`src/lib/page-metadata.ts` giving all 5,226 year pages unique
title/description/OG cards. This is the SEO-audit `generateMetadata` lever.

It also happens to be **exactly the shape `docs/tech-debt.md` says static export
requires** (server wrapper + `generateStaticParams`, client logic in a child).
So it is load-bearing for later hosting moves, not incidental.

- [ ] **0.1** Review the diff, run E2E + build, land it as its own commit. Do not
      start new work on top of an unlanded refactor.
- [ ] **0.2** Verify per-page metadata live on 3 sampled years + 2 eras (view
      source, not curl status — `feedback_curl_is_not_verification`).
- [ ] **0.3** Confirm `origin/main` clean; CI green.

**Gate:** clean tree, CI green, metadata verified in a real browser.

---

## 3. Workstream A — The multi-era data model

The unlock for everything else.

- [ ] **A.1 Schema.** Extend ICCRA so an event carries `eras: string[]` (era ids)
      rather than deriving a single era from its year. Keep year-derived era as
      a computed fallback so nothing regresses while the corpus backfills.
- [ ] **A.2 Era taxonomy.** Add a `kind` to the era registry so the UI can style
      and group by it:
      `chronological` (existing 1–20 style) · `thematic` (Scientific Revolution,
      Industrial Age) · `crisis` (Black Death, Little Ice Age, genocide lens) ·
      `regional` (West African Golden Age, Edo, Classic Maya).
      Add `tone` (`golden` / `sombre` / `neutral`) — the brainstorm's ask for
      muted palettes on dark-history eras belongs in data, not in a CSS special-case.
- [ ] **A.3 Overlap-safe registry.** `index.json` currently implies a mostly
      linear sweep. Thematic eras overlap heavily; the registry needs to declare
      overlap as legal and the index builder must stop assuming disjointness.
- [ ] **A.4 Backfill.** Tag the existing 17,991 events with the new era ids.
      Rule-based first (year-range + region + category), LLM-assisted only for
      the genuinely ambiguous residue. Batch API, same discipline as the
      original daemon run (~$15 for the whole corpus is the benchmark).
- [ ] **A.5 Lite index.** `scripts/build-timeline-index.mjs` must carry era tags
      into the lite index — without it the home/filter views can't filter by
      thematic era, and we re-open the full-corpus performance wound.

**Gate:** an event known to belong to 3 eras (pick the Haitian Revolution, 1791)
returns all 3 from the lite index; existing single-era views unchanged.

---

## 4. Workstream B — Era corpus expansion

Fills registry slots 21–49 plus the thematic set, per
`docs/era-expansion-brainstorm-2026-07-29.md`.

**B.1 — Priority tier (build first).** The brainstorm's own argument is that
LLM training data is weakest and most biased exactly here, which makes these the
highest-value *and* highest-risk to research. Layer-2 Scite evidence matters most:

- Transatlantic Slave Trade (c. 1526–1867) + Age of Abolition (c. 1780–1888)
- The Age of the World Wars (1914–1945)
- Modern Genocide & Mass Atrocity (1904–present)
- Black Death & Crisis of the Late Middle Ages (1346–1353)
- West African Golden Age (c. 1200–1600) — Mali/Songhai
- Tang & Song Cosmopolitan Era (618–1279)
- Classic Maya (c. 250–900) + Imperial Andes (c. 1438–1533)

**B.2 — Thematic lenses.** Scientific Revolution · Age of Revolutions ·
Industrial Age · Decolonisation · Digital & Information Age. These map cleanly
onto the existing `futureBuckets` (`04_renaissance_knowledge.md` →
`07_information_age.md`), so VALOR sourcing already exists.

**B.3 — Remaining regional/crisis eras.** Cold War · Atlantic Piracy · Late
Antique Little Ice Age & Justinian Plague · Little Ice Age · Rise of the
Caliphates · Pax Mongolica · Edo Period.

**B.4 — Close the phase-2 drift.** 13 eras still sit on the pre-schema format.
Migrating them to schema v1 is a prerequisite for showing any era uniformly in
the new UI; a mixed-schema registry will produce half-broken era pages.

**Editorial guardrail.** Dark-history eras carry a duty of care the golden-age
eras do not. Every B.1 era needs sourcing at phase-3 standard before it ships
publicly — no "probable"-tier corpus text standing alone on a genocide page.
This is a hard gate, not a preference.

**Gate:** each new era passes schema v1 validation, has ≥1 Layer-2 evidence
dossier, and renders on `/era/[id]` with no placeholder text.

---

## 5. Workstream C — The parallel-timeline UI

Per `docs/ux-brainstorm-parallel-timelines-2026-07-29.md`. Starts once A.5 lands.

- [ ] **C.1 Era scrubber replaces the era button band.** Horizontal minimap of
      the full 5,226-year span showing data density, with named eras plotted as
      bands. Drag to scrub; click an era to snap. Supersedes the July-16 audit's
      "vertical minimap" item where they conflict — decide one, note the other
      as rejected, don't build both.
- [ ] **C.2 Swimlanes (desktop ≥1400px).** 2–3 columns, shared vertical time
      axis, one era/track per column. Needs A.1 to be meaningful.
- [ ] **C.3 Mobile parallelism.** Interleaved single list with colour-coded
      track markers per the brainstorm's Concept B. Must hold ISC-3 (no
      horizontal overflow at 320px) — the swimlane layout is the single most
      likely thing in this plan to break that gate.
- [ ] **C.4 Filter surfacing.** Lift Category / Region out of the hidden modal
      into persistent chrome.
- [ ] **C.5 Era-page elevation.** Dark-history eras use the `tone` token from
      A.2 for a sombre palette. Era deep-dives render as narrative interstitials,
      not list items — this also closes the still-open July-16 audit item.
- [ ] **C.6 "New research" indicators** on recently-expanded eras.

**Gate:** the full ISC suite (`docs/s-tier-isc.md`) stays green — ISC-2 zero
console errors, ISC-3 no overflow at 320/375/414/768, ISC-4 axe 0
serious/critical — *plus* a real-browser sweep at Magnús's own viewport. Green CI
is not "it works".

---

## 6. Workstream D — Standing debt (continuous)

From `docs/tech-debt.md`, unchanged but now load-bearing for the above:

- Atlas still loads the full corpus (needs a coords-only index); clustering /
  heatmapping still open from the July-16 audit.
- Stratum full-corpus load — acceptable today; revisit if C.1 absorbs Stratum's
  role, which it may.
- Icelandic locale has no lite index — **blocks the IS timeline shipping**, and
  every new era multiplies the translation surface. Worth doing before B lands,
  not after.
- `opengraph-image.tsx` edge runtime blocks `output: 'export'`.

---

## 7. Sequencing

```
0. Clear the deck        ├─ half a day, blocking
A. Multi-era data model  ├─ blocking for B and C
B. Era corpus expansion  ├─┐ can run in parallel once A lands
C. Parallel-timeline UI  ├─┘
D. Standing debt         └─ continuous; IS lite index before B ships
```

Rough shape: 0 and A are days. B is the long pole — it is research, not code,
and phase-3 quality on the dark-history tier cannot be rushed. C is a
self-contained frontend sprint gated on A.5 and best sequenced *after* enough of
B exists to make swimlanes show something real.

---

## 8. Decisions

**Resolved 2026-07-29 by Magnús:**

> **2. Editorial threshold for dark-history eras — NOT a hard publish gate.**
> Instead: *deep research and triangulation*, with Scite or other quality
> sources. The requirement is research depth and visible provenance, not a
> binary gate that blocks shipping. Implemented as `careLevel: "high"` in the
> era registry, which obliges: contested figures shown as ranges with named
> provenance, no single-source victim counts, and attribution of contested
> naming conventions to whoever uses them.

**Resolved by me under the standing autonomy grant (reversible — say the word):**

1. **Scrubber wins; vertical minimap rejected.** The horizontal era scrubber
   doubles as the shared time axis for the swimlane layout (C.2). A vertical
   minimap cannot — it would be a second, competing spatial device. The July-16
   audit item is closed as *superseded*, not deferred.
3. **Backfill scope: all 17,991 events.** Rule-based (year-range + region +
   category) covers the bulk; only the ambiguous residue goes to a model. The
   original corpus cost ~$15.68 for 5,226 API-researched years, so a tagging
   pass over the same corpus is not the expensive part of this plan.
4. **Stratum survives.** The scrubber is a home-page navigation device; Stratum
   is the deep per-year instrument with `era_context` and per-source provenance.
   Different jobs. Revisit only if usage says otherwise.

**Still genuinely open:**

- Whether the swimlane view ships behind a toggle or becomes the default
  desktop layout. Wants to be decided against a real prototype, not in advance.

---

## 9. ISC tracker (to be filled when work starts)

| # | Criterion | Gate | Status |
|---|---|---|---|
| U-1 | Tree clean, SEO refactor landed | CI green, metadata verified in browser | ☐ |
| U-2 | Events carry multiple eras | Haitian Revolution returns 3 eras from lite index | ☐ |
| U-3 | Era registry supports overlap + tone | Schema validates overlapping thematic eras | ☐ |
| U-4 | Priority dark-history eras researched | Each has phase-3 dossier, 0 placeholders | ☐ |
| U-5 | Phase-2 drift closed | 13 eras migrated to schema v1 | ☐ |
| U-6 | Parallel timelines usable | Swimlanes desktop + tracks mobile, ISC-3 holds at 320px | ☐ |
| U-7 | Full S-tier suite still green | `docs/s-tier-isc.md` ISC-1…8 unregressed | ☐ |
| U-8 | Verified live, not just built | Real-browser sweep of all routes on timeline.sumarhus.com | ☐ |
