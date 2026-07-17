# Mission Prep — Cultural Eras

> Generalise the Classical Music & Opera timeline into a multi-domain **Cultural
> Eras** layer: per-era cultural deep-dives (music, art, literature, philosophy,
> architecture, theatre…), each grounded in real, verified scholarship — the same
> rigour the Music & Opera Layer 2 already meets (161 peer-reviewed sources
> verified against Crossref/DataCite, 0 fabricated).
>
> Status: **PREP** (planning only). No research or build has started. Prepared
> 2026-07-17. Awaiting Magnús's go / scope ratification before any agent runs.

---

## 1. Why

Chronograph already has three layers:

| Layer | What | Where |
|---|---|---|
| **L1 — Corpus** | 5,226 ICCRA year-JSONs (events, sources, certainty, gaps) | `outputs/json/` |
| **L2 — Scholarly eras** | Research deep-dives per era via Scite (verdict, debate, contested claims) | `evidence-layer/`, `/era/[id]` |
| **Music & Opera** | 29 eras · 233 works, model-drafted L1 + Scite-verified L2, overlaid on the main timeline as a "musical" category | `frontend/src/data/music-timeline.ts`, `/music` |

The Music & Opera timeline **proves the pattern**: a single cultural domain, told
era-by-era, model-drafted then verified against real literature, surfaced both as
its own folio and as a filterable tag on the master timeline. **Cultural Eras** is
that pattern generalised across the domains that make up cultural history — so the
Chronograph tells not just what *happened* but what humanity *made and thought*.

This is deliberately parallel to L2 scholarly eras (which cover political /
scientific / social currents). Cultural Eras is the humanities complement.

## 2. Scope — domains

Music & Opera is domain #1 (done). Candidate additional domains, each a first-class
`CulturalDomain`:

| Domain | Covers | Notes |
|---|---|---|
| `music` | Classical music & opera | ✅ shipped (29 eras, 233 works) |
| `visual-art` | Painting, sculpture, later photography | Highest ROI next — dense, well-sourced |
| `literature` | Poetry, drama-as-text, the novel | Large; may split (poetry vs prose) |
| `philosophy` | Schools, key works, turns | Overlaps L2 "scientific" — dedupe carefully |
| `architecture` | Styles, landmark structures | Strong spatial hook for the Atlas |
| `theatre-performance` | Drama staged, dance | Smaller; can fold into literature/music at first |

**Recommended first mission slice:** `visual-art` end-to-end (one domain, full
era coverage, verified) to validate the generalised model before fanning out.
Do NOT attempt all domains at once — the value is depth + verification, not breadth.

## 3. Data model — generalise, don't fork

The `MusicEra`/`MusicEntry`/`EraEvidence` shapes already carry everything a
cultural domain needs. Lift them into a domain-agnostic model:

```ts
type CulturalDomain =
  | "music" | "visual-art" | "literature"
  | "philosophy" | "architecture" | "theatre-performance";

interface CulturalEntry {           // was MusicEntry
  year: number; year_label: string;
  title: string;
  creator: string;                  // was `composer` — generalise the field name
  kind: string;                     // domain-specific vocab (work/movement/school/…)
  region: string;
  certainty: MusicCertainty;        // reuse ICCRA certainty
  suppressed?: boolean;             // reuse the main-timeline dedupe flag
}

interface CulturalEra {             // was MusicEra
  id: string; name: string;
  domain: CulturalDomain;           // NEW — the only structural addition
  entries: CulturalEntry[];
  evidence: EraEvidence;            // unchanged — coverage + synthesis + verified sources
}
```

- `music-timeline.ts` becomes the first `domain: "music"` dataset under a
  `cultural/` data dir; `music-events.ts` (the overlay) generalises to
  `cultural-events.ts` emitting a per-domain category tag.
- **Verification is non-negotiable**: every Layer-2 source must resolve on
  Crossref or DataCite (title + authors + DOI), exactly as the music sources do.
  Reuse the existing verification harness. `verified?: "crossref" | "datacite"`.
- The main timeline gains one category per domain (or a single `cultural`
  category with a `domain` sub-tag) — decide during design; the "musical"
  category is the working precedent.

## 4. Research approach (per domain, per era)

Mirror the Music & Opera Layer-2 method, which is already proven:

1. **Draft (L1)** — model-draft the era's entries (works/creators/movements) with
   region + ICCRA certainty. Cheap, fast, clearly labelled as model-drafted.
2. **Evidence (L2)** — for each era, a Scite research pass (`scite-preflight` →
   `scite-research`) producing: a `synthesis` paragraph, `coverage` rating, and a
   set of **real** sources. Then the **verify** step: every DOI checked against
   Crossref/DataCite; ALL-CAPS/HTML artifacts cleaned; retractions flagged.
3. **Dedupe** — mark `suppressed: true` for works the L1 corpus already covers,
   so the main-timeline overlay never double-counts (the music layer suppressed 13).
4. **Gate** — a Fable adversarial pass on the sources (the music layer's
   "hallucinated sources" incident is the cautionary tale: DOI-resolves ≠ correct;
   title + authors must match the registered record).

Swarm shape per domain: one preflight, then parallel per-era research agents,
then a single verification pass over the pooled sources, then Fable.

## 5. Frontend surfacing

- Generalise `/music` → `/culture` with a **domain switch** (Music · Art ·
  Literature · …); `/music` stays as an alias/redirect. Reuse the folio, the
  rail, the search, the thread.
- **Era ribbon**: add an optional "cultural overlay" mode where the proportional
  bands show cultural-era boundaries; or mark eras that have a cultural deep-dive.
- **Main timeline**: each domain overlays as a filterable category (precedent:
  "musical"). Follow-the-thread generalises to "next in {domain}".
- **Atlas**: architecture + visual-art have strong `region` data → good globe pins.

## 6. Phases & deliverables

| Phase | Deliverable | Gate |
|---|---|---|
| P0 | This prep ratified; scope + first domain (`visual-art`) confirmed | Magnús OK |
| P1 | Generalised data model + `cultural/` dir; music migrated in behind it (no UX change) | E2E still green |
| P2 | `visual-art` L1 draft (eras + entries, region + certainty) | schema valid |
| P3 | `visual-art` L2 evidence via Scite; **every source Crossref/DataCite-verified** | 0 unresolved, Fable SHIP |
| P4 | `/culture` route with domain switch; art overlay + threads on the main timeline | E2E + axe green |
| P5 | Repeat P2–P4 per additional domain, one at a time | per-domain Fable gate |

## 7. Ideal State Criteria (mission)

- **C-ISC-1** One domain-agnostic model; music is just `domain:"music"` under it — no regression (E2E green).
- **C-ISC-2** `visual-art` fully covered era-by-era, every entry region + certainty tagged.
- **C-ISC-3** 100% of Layer-2 sources resolve on Crossref/DataCite; 0 fabricated; retractions flagged. (The project's whole value proposition.)
- **C-ISC-4** `/culture` route + main-timeline overlay + threads work; 0 console errors, no overflow, 0 serious/critical axe — enforced by the existing E2E gate extended to the new routes.
- **C-ISC-5** Fable adversarial sign-off on the sources and the UX.

## 8. Risks & guards

- **Fabricated scholarship** — THE risk (see the music "hallucinated sources"
  incident: sources whose DOIs resolved but whose titles/authors were invented).
  Guard: mandatory Crossref/DataCite title+author verification + a Fable refute pass.
- **Domain sprawl** — doing all domains shallowly. Guard: one domain fully verified
  before the next; depth over breadth.
- **Overlap with L2 scholarly eras** (esp. philosophy vs "scientific"). Guard:
  explicit dedupe + `suppressed` flags; cultural eras cover *works & makers*, L2
  covers *arguments & evidence*.
- **Scale/cost** — many eras × domains × Scite calls. Guard: batch, cache, and
  gate each phase; model-draft is cheap, verification is the spend.

## 9. First action when this is greenlit

Run `scite-preflight` for `visual-art` era coverage (a reviewable mission folder
of prompts + search strategies), have Magnús eyeball the plan, then launch the
per-era research swarm. Nothing hits the frontend until sources are verified and
Fable signs off.

---

*Prep only. No agents have run. The Music & Opera layer is the working reference
implementation for every decision above.*
