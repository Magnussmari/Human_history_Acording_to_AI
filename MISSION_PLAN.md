# MISSION_PLAN — Eternal Codex Translation Pipeline (EN → IS, IT)

**Commander:** Magnús Smári Smárason
**Operator:** LEON
**Date:** 2026-04-18
**Branch (target):** feature branch off `main` (name TBD on GO, proposed `feat/translation-pipeline`)
**Status:** PHASE 1 — plan complete, awaiting GO. No execution yet.
**Locked:** Gemini Flash 3 Preview (both locales); Icelandic system prompt verbatim (brief §CONTEXT).

---

## 1. RECONNAISSANCE REPORT (observed repo state)

| Subject | Observed |
|---|---|
| Frontend framework | Next.js **16.2.3**, React **19.2.4**, Tailwind **v4**, TypeScript 5 (`frontend/package.json`) |
| i18n library | **None installed.** Grep of `frontend/src` for `next-intl`/`next-i18next`/`useTranslations`/`getTranslations`/`locale` returned zero matches. Greenfield for UI i18n. |
| Corpus path | **`outputs/json/`** (not `/data` as brief phrased it). 5,226 files, one per year; `-1.json` = 2 BCE, `-3200.json` = oldest, `2025.json` = newest. |
| Corpus sample shape (from `outputs/json/-1.json`) | Top-level: `year` (int), `year_label` (str), `era_context` (str), `documentation_level` (enum), `geographic_coverage_gaps` (str[]), `events` (obj[]), `disconfirming_evidence` (str), `historiographic_note` (str), `graph_edges` (obj[]). Event fields: `id`, `title`, `region`, `coordinates_approx`, `category` (enum), `description`, `key_figures` (str[]), `sources` (obj[] with `name`/`type`/`contemporary`), `certainty` (enum), `certainty_note`, `cross_references`. Graph edges: `from`/`to`/`relation` (enum)/`note`. |
| Frontend data layout | `frontend/public/data/` contains `manifest.json`, `progress.json`, `chunks/` (100-year aggregations), `eras/`, `land-110m.json`. Built from `outputs/json/` via `frontend/scripts/aggregate-data.mjs` (prebuild step). |
| Aggregator hook | `frontend/package.json:13` → `prebuild: npm run aggregate`. Runs aggregate-data + aggregate-evidence. |
| Validator | `scripts/validate_corpus.py` — Python. Enforces ICCRA schema (CLAUDE.md §TOP-PRIORITY-3). `ajv ^8.18.0` is a devDep in `frontend/` but unused today. |
| Env files | `.env` exists at repo root with `GOOGLE_AI_API_KEY=...`. `.env.example` exists but is empty. `docker/.env` (daemon key) is separate. |
| `.gitignore` status | **`.env` is NOT ignored.** Only `docker/.env`, `*.lock`, `.claude/state/`, `.claude/local/`, `*.tmp`, `state/lock/`, `docker/.docker/` are. **PRE-FLIGHT FIX REQUIRED.** |
| CI | `.github/` contains only `ISSUE_TEMPLATE/`. **No workflows exist.** Greenfield. |
| Existing scripts | `scripts/*.py` + `scripts/*.sh` = Python/bash daemon (idle, Phase 1 done). `frontend/scripts/*.mjs` = Node ESM aggregation + QA probes. Mixed-language repo, but frontend tooling is Node/ESM. |
| Deployment | Vercel auto-deploys `frontend/` on push to `main` (CLAUDE.md §FILE/DIRECTORY MAP). |
| Branching | On `main` (clean apart from unrelated modifications listed in gitStatus). `evidence-layer` branch has 76 staged files awaiting review — unrelated to this mission. |

### Enum/sentinel fields discovered in `-1.json`
These are **English tokens that drive frontend lookups** (CLAUDE.md §HANDLING AI-GENERATED DATA IN UI) and **must NOT be translated**:

| Field | Values observed |
|---|---|
| `documentation_level` | `rich`, `moderate`, `sparse`, `minimal`, `negligible` |
| `category` (event) | `political`, `military`, `scientific`, `cultural`, `economic`, `demographic`, `technological`, `religious`, `environmental`, `exploration`, `legal` |
| `certainty` (event) | `confirmed`, `probable`, `approximate`, `traditional`, `legendary` |
| `sources[].type` | `primary_text`, `later_compilation`, `numismatic`, `archaeological`, `chronicle`, ... (open set) |
| `sources[].contemporary` | boolean |
| `graph_edges[].relation` | `contemporary_with`, `led_to`, ... (open set) |
| All `id`, `cross_references`, `coordinates_approx`, `year`, numeric/boolean fields | preserved verbatim |

Translatable fields (values only, never keys): `year_label` ("2 BCE (Proleptic Gregorian)" → "2 f.Kr. (Gregoríanskt fordæmistal)"), `era_context`, `geographic_coverage_gaps[]`, event `title`/`region`/`description`/`key_figures[]`/`certainty_note`, `sources[].name`, `disconfirming_evidence`, `historiographic_note`, `graph_edges[].note`.

---

## 2. FEATURE LIST (execution units)

```json
[
  {
    "id": "F01-preflight-secrets",
    "name": "Add .env to .gitignore; verify no key in git history; populate .env.example",
    "acceptance": "`git check-ignore .env` exits 0; `git log --all -- .env` returns empty; `.env.example` lists GOOGLE_AI_API_KEY=your_key_here with comment.",
    "depends_on": [],
    "status": "pending"
  },
  {
    "id": "F02-schema-validator-node",
    "name": "Port ICCRA schema to Zod+Ajv Node validator at scripts/translate/schema.ts",
    "acceptance": "`tsx scripts/translate/validate.ts outputs/json/-1.json` exits 0; running against a deliberately-broken file exits non-zero with field-level error; enum sets mirror scripts/validate_corpus.py exactly.",
    "depends_on": ["F01-preflight-secrets"],
    "status": "pending"
  },
  {
    "id": "F03-gemini-client",
    "name": "Gemini Flash 3 Preview SDK wrapper with response_mime_type=application/json + exponential backoff on 429/5xx",
    "acceptance": "Unit test: mocked 429 → retries 3× with jitter → surfaces final error; real integration smoke test against 1 known field returns valid JSON.",
    "depends_on": ["F01-preflight-secrets"],
    "status": "pending"
  },
  {
    "id": "F04-system-prompt-is",
    "name": "Icelandic system prompt file (verbatim from brief) + DO_NOT_TRANSLATE glossary extension",
    "acceptance": "File at scripts/translate/prompts/system.is.md contains the 4-rule Icelandic prompt exactly as in brief; glossary extends rule #1 to list enum tokens + URLs + IDs with concrete examples; SHA256 of prompt file is pinned in manifest for drift detection.",
    "depends_on": [],
    "status": "pending"
  },
  {
    "id": "F05-system-prompt-it",
    "name": "Italian system prompt composed fresh in Italian (not translated from Icelandic), mirroring 4-rule structure",
    "acceptance": "File at scripts/translate/prompts/system.it.md in Italian, 4 rules: JSON integrity, academic register with canonical Italian historiographic terminology, canonical Italian names/places where established (Giulio Cesare, Roma, Costantinopoli), no Markdown fencing. Review by commander before first run.",
    "depends_on": [],
    "status": "pending"
  },
  {
    "id": "F06-json-translator-core",
    "name": "Core translator: walks JSON, translates only value strings at permitted paths, preserves keys/enums/IDs/URLs/numbers/booleans",
    "acceptance": "Unit test on fixture: round-trip preserves all keys, all enum values, all numeric/boolean/coord fields, all IDs, all cross_references; translates only the whitelisted string paths; output passes F02 validator.",
    "depends_on": ["F02-schema-validator-node", "F03-gemini-client", "F04-system-prompt-is"],
    "status": "pending"
  },
  {
    "id": "F07-manifest-hashing",
    "name": "Idempotency manifest at .translation-manifest.json tracking SHA256(source) + SHA256(system_prompt) per file per locale",
    "acceptance": "Re-running pipeline on unchanged source → 0 API calls, exit 0. Changing prompt SHA invalidates entire locale. Changing one source file invalidates only that file for both locales.",
    "depends_on": ["F06-json-translator-core"],
    "status": "pending"
  },
  {
    "id": "F08-is-pipeline-dry-run",
    "name": "End-to-end Icelandic translation of 3-file sample (-1.json, 0.json, 2025.json) to outputs/translations/is/",
    "acceptance": "3 files produced; each parses as JSON; each passes schema validator; commander eyeballs quality against prompt intent. STOP point for IT work per brief instruction 'START ONLY WITH ICELANDIC'.",
    "depends_on": ["F06-json-translator-core", "F07-manifest-hashing"],
    "status": "pending"
  },
  {
    "id": "F09-it-pipeline-dry-run",
    "name": "End-to-end Italian translation of same 3-file sample to outputs/translations/it/ (ON COMMANDER SIGN-OFF of F08)",
    "acceptance": "3 IT files produced + schema-valid; commander approves Italian register.",
    "depends_on": ["F08-is-pipeline-dry-run", "F05-system-prompt-it"],
    "status": "pending"
  },
  {
    "id": "F10-aggregator-i18n",
    "name": "Extend frontend/scripts/aggregate-data.mjs to emit per-locale chunks at frontend/public/data/{is,it}/{chunks,eras,manifest.json}",
    "acceptance": "`npm run aggregate` produces en/is/it chunk trees; missing-locale years fall back to English with a `_locale_fallback: \"en\"` marker; manifest lists per-locale coverage.",
    "depends_on": ["F08-is-pipeline-dry-run"],
    "status": "pending"
  },
  {
    "id": "F11-ui-i18n-next-intl",
    "name": "Install next-intl; add [locale] segment to App Router; locale detection middleware; en/is/it message files",
    "acceptance": "Routes: /en/..., /is/..., /it/...; default locale = en; Accept-Language honored; LocaleSwitcher in header; no hardcoded user-facing strings left in src/app, src/components. Zero hydration warnings. Tested in Next 16.2.3 per frontend/AGENTS.md — read node_modules/next/dist/docs/ before writing.",
    "depends_on": ["F10-aggregator-i18n"],
    "status": "pending"
  },
  {
    "id": "F12-ui-string-extraction",
    "name": "Extract all user-facing literals from frontend/src into messages/en.json; produce IS and IT via same Gemini pipeline",
    "acceptance": "grep for hardcoded Icelandic/English strings in components returns only valid exceptions (aria-label defaults, dev-only); messages/is.json + messages/it.json validate against messages/en.json shape; UI renders all three locales without missing-key warnings.",
    "depends_on": ["F11-ui-i18n-next-intl", "F09-it-pipeline-dry-run"],
    "status": "pending"
  },
  {
    "id": "F13-github-action",
    "name": ".github/workflows/translate.yml: on push to main touching outputs/json/*.json, translate new/changed years to IS+IT, open PR",
    "acceptance": "Simulated change to one year triggers workflow; bot PR appears with exactly that year's IS+IT output + manifest update; PR passes schema validator in CI; no Gemini key in logs.",
    "depends_on": ["F08-is-pipeline-dry-run", "F09-it-pipeline-dry-run"],
    "status": "pending"
  },
  {
    "id": "F14-full-corpus-backfill-is",
    "name": "One-shot backfill of all 5,226 years → Icelandic (batched, rate-limited, resumable)",
    "acceptance": "100% of outputs/json/*.json has an outputs/translations/is/*.json counterpart; 100% schema-valid; manifest 100% coverage; total cost logged.",
    "depends_on": ["F13-github-action"],
    "status": "pending"
  },
  {
    "id": "F15-full-corpus-backfill-it",
    "name": "One-shot backfill → Italian (on commander GO after IS complete)",
    "acceptance": "100% IT coverage + schema-valid.",
    "depends_on": ["F14-full-corpus-backfill-is"],
    "status": "pending"
  },
  {
    "id": "F16-post-launch-report",
    "name": "POST_LAUNCH_REPORT.md + DEBRIEF.md + CLAUDE.md amendment",
    "acceptance": "All four reporting artifacts produced per brief Phases 3 & 4; anti-pattern registry updated with any IS grammar failures observed.",
    "depends_on": ["F15-full-corpus-backfill-it"],
    "status": "pending"
  }
]
```

Hard gate ordering: **F08 → commander sign-off → F09.** Brief explicitly says "START ONLY WITH ICELANDIC." No Italian code executes until Icelandic sample is approved.

---

## 3. ARCHITECTURE DECISIONS

| Decision | Choice | Rationale |
|---|---|---|
| Script language | **TypeScript (Node 20+), tsx runner** | Frontend is TS; `ajv` already a devDep; translation scripts live best next to the aggregator (`frontend/scripts/*.mjs`) which is already Node/ESM. Python daemon stays untouched — it's a separate concern (English corpus generation). |
| Schema validator | **Ajv (already installed)** mirroring `scripts/validate_corpus.py` exactly | No new deps; compile-time JSON-Schema validation; CLAUDE.md §TOP-PRIORITY-3 requires strict gate. |
| Translation output location | **`outputs/translations/{is,it}/<year>.json`** | Mirrors `outputs/json/` layout; keeps primary corpus path untouched (CLAUDE.md §TOP-PRIORITY-2); easy glob for aggregator. |
| Aggregated locale chunks | **`frontend/public/data/{is,it}/{chunks,eras,manifest.json}`** with English at `frontend/public/data/` (existing) untouched | Preserves current frontend contract; additive only. |
| UI i18n library | **next-intl** | Native App Router support, actively maintained, supports Next 16, minimal runtime, easy message-file swap. `next-i18next` is Pages-Router-era. Read `frontend/node_modules/next/dist/docs/` before implementation (frontend/AGENTS.md). |
| UI translation management | **In-repo JSON-per-locale** (`frontend/messages/{en,is,it}.json`) generated by the same Gemini pipeline | Tolgee/Inlang are overkill for ~200 UI strings; in-repo JSON is version-controlled, PR-reviewable, CI-validatable, zero external service dependency. |
| Manifest format | **`.translation-manifest.json`** at repo root, committed, JSON keyed by relative source path: `{ source_sha, prompts: { is: prompt_sha, it: prompt_sha }, locales: { is: { target_sha, translated_at, model }, it: {...} } }` | Atomic idempotency; any SHA change invalidates the cached translation. |
| Model pinning | Exact Gemini model ID locked in `scripts/translate/config.ts` with commit-level version. If model ID differs from brief's "Gemini Flash 3 Preview" string in the SDK, escalate 🔺 before changing. | Brief §CONSTRAINTS: "Do not substitute model versions without explicit authorization." |
| DO_NOT_TRANSLATE glossary | Repo-level `scripts/translate/glossary.json` with: all ICCRA enum values (exhaustive list from §1 above), all regex patterns for IDs (`^\d+-\d+$`, `^-?\d+$`), URL fields (`sources[].url`), numeric strings matching coordinate pattern. Fed into system prompt as an appended block AFTER the 4 rules (does not modify the verbatim prompt). | CLAUDE.md §HANDLING AI-GENERATED DATA IN UI: any enum drift crashes the UI. This is the highest-impact correctness guard. |
| Italian system prompt (DRAFT, for commander review) | See §3a below | Brief §AUTHORITY: delegated; must mirror 4-rule structure. |

### 3a. Italian system prompt — DRAFT (not final; commander review before F05 locks)

```
Sei uno storico esperto e traduttore specialistico per un archivio di dati storici. Il tuo compito è tradurre dati JSON storici dall'inglese verso un italiano accademico, rigoroso e di registro colto.

REGOLE INDEROGABILI:
1. INTEGRITÀ DEL JSON: Traduci ESCLUSIVAMENTE i valori (values). Mantieni tutte le chiavi (keys) in inglese, identiche all'originale.
2. REGISTRO ACCADEMICO: Usa la terminologia storiografica italiana consolidata (es. "a.C." per BCE e "d.C." per CE; "Impero Romano d'Occidente/d'Oriente", "Tardo Antico", "Alto Medioevo"). Il linguaggio deve essere oggettivo, preciso e di registro scritto elevato.
3. NOMI E LUOGHI: Dove esiste una forma italiana canonica per nomi storici, dinastie o toponimi (es. "Giulio Cesare" per "Julius Caesar", "Costantinopoli" per "Constantinople", "Aquisgrana" per "Aachen"), usala. Altrimenti, mantieni il nome originale.
4. NESSUN PREAMBOLO: Restituisci ESCLUSIVAMENTE un documento JSON valido. Nessuna spiegazione, nessuna introduzione, nessuna formattazione Markdown (come ```json) attorno alla risposta.
```

**Commander: please read this draft before GO. If wording needs adjustment, it will be edited in F05 before any IT API calls fire.**

---

## 4. RISK REGISTER (ranked likelihood × impact, ↓)

| # | Risk | L × I | Mitigation |
|---|---|---|---|
| R1 | **Enum translation breaks frontend** (model translates `category: "political"` → `"stjórnmálalegt"`; CATEGORY_CONFIG lookup crashes) | High × Critical | DO_NOT_TRANSLATE glossary (arch §3); post-translation Ajv validator blocks commit; frontend guard `?? CATEGORY_CONFIG.political` already exists (CLAUDE.md). Belt-and-suspenders-and-belt. |
| R2 | **`.env` accidentally committed** (already in working tree, not gitignored) | High × Critical | F01 is the first execution step; blocks all downstream work. Check `git log --all -- .env` to confirm never-committed; if it was, escalate 🔺 immediately for key rotation. |
| R3 | **"Gemini Flash 3 Preview" model ID drift** (SDK may call it `gemini-flash-3-preview` or `gemini-3.0-flash-preview` or similar; previews can be renamed/retired) | Medium × High | F03 resolves actual model ID against live SDK as first smoke test; if string differs from brief, escalate 🔺 per §AUTHORITY before proceeding. |
| R4 | **Icelandic grammatical drift** (cases, mutations, dative/accusative errors, compound-word failures) | High × Medium | F08 sample review by commander (native speaker) before ANY bulk run; log every observed failure into an anti-pattern registry; if rate unacceptable, revisit prompt (but prompt is locked by brief — escalate 🔺). |
| R5 | **Partial-write corruption** (process killed mid-file, leaves malformed JSON) | Medium × High | Write to `*.tmp` in same dir, `JSON.parse` roundtrip, Ajv validate, then atomic `rename` to final path. Never write-in-place. |
| R6 | **429 rate-limit cascade on full backfill** (5,226 × 2 = 10,452 calls) | High × Medium | Exponential backoff + jitter; concurrency cap (start 4, tune); persistent resume via manifest; nightly batch windows in Action. |
| R7 | **Schema drift** (new category/certainty enum appears in future English generation that translator doesn't recognize) | Low × High | Validator rejects unknown enums BEFORE translation; surfaces to commander for glossary update; never silently propagates. |
| R8 | **Aggregator regression** (locale chunks break existing EN frontend) | Medium × High | F10 keeps EN path bit-identical; adds IS/IT as new sibling dirs; CI diff check confirms EN chunks unchanged. |
| R9 | **Cost overrun** | Low × Low | Flash pricing ≈ $0.10/M input + $0.40/M output (order of magnitude); ~5K-word avg × 5,226 years × 2 locales ≈ <$25 estimated. Log per-file cost; abort if 2× budget. |
| R10 | **Translation of source citations misleads scholars** (e.g., "Josephus, Antiquities of the Jews" → "Jósefus, Fornfræði Gyðinga") | Medium × Medium | Keep `sources[].name` in original where it's a canonical published work title; translate only when it's a descriptive phrase ("Archaeological evidence from..."). Encode this nuance in glossary + system-prompt addendum. Sample review catches it. |

---

## 5. PRE-FLIGHT CHECKLIST (must all be ✅ before GO)

- [ ] **`.env` added to `.gitignore`** and not present in `git log --all -- .env` (if it is, rotate key + escalate 🔺)
- [ ] **`.env.example` populated** with `GOOGLE_AI_API_KEY=your_key_here` and a comment
- [ ] **Commander reviewed Italian system prompt draft** (§3a above) and either approved or provided edits
- [ ] **Commander confirms**: Italian system prompt text is final-draft or provides replacement
- [ ] **Commander confirms target branch name** (proposed: `feat/translation-pipeline`)
- [ ] **Commander confirms output location**: `outputs/translations/{is,it}/` (vs alternative: `outputs/json-is/`, `outputs/json-it/`)
- [ ] **Commander aware of `evidence-layer` branch interaction**: this mission opens on `main`, not on `evidence-layer`; confirm no merge conflict risk
- [ ] **Commander acknowledges F14/F15 cost estimate** (~$25 for both full backfills at current Flash pricing)
- [ ] **Confirm Gemini Flash 3 Preview model ID** will be verified live before any API call; if SDK names it differently, LEON escalates 🔺 and stops

---

## 6. GO/NO-GO RECOMMENDATION

**Recommend: GO, with pre-flight items R2 (env leak) and commander sign-off on Italian prompt draft as mandatory gates.**

Reasoning:
- Repo is in excellent condition for this work. Frontend is greenfield for i18n (no competing lib to dislodge). Ajv already present. Corpus schema is well-defined and already has a validator to mirror.
- Brief's constraints are clean and internally consistent. Only ambiguity is model ID string, which I can resolve in F03 smoke test.
- Primary risk (R1, enum translation) has a complete technical mitigation via the DO_NOT_TRANSLATE glossary layered on top of the locked Icelandic prompt.
- Phased approach (IS first, commander eyeball, then IT) honors brief instruction "START ONLY WITH ICELANDIC" and gives you a native-speaker review gate before any cost commitment.
- **Small caveat**: `.env` not being in `.gitignore` is a live exposure. If by chance the key has ever been committed, we will stop everything for rotation. I will check this as F01 step 1.

**What I need from you to proceed:**
1. **GO** (or hold with questions).
2. **Italian prompt draft (§3a)**: approved, edited, or replaced.
3. **Branch name confirmation**: `feat/translation-pipeline` OK?
4. **Output path confirmation**: `outputs/translations/{is,it}/` OK?

Awaiting your reply. Nothing executed.
