Understood. Gemini Flash 3 Preview for both locales, Icelandic system prompt locked in as the authoritative version.

```
# MISSION: Bootstrap Translation Pipeline for Eternal Codex (EN → IS, IT)

## INTENT
Deliver a production-grade, CI-integrated translation pipeline that localizes the Eternal Codex project — both the structured historical JSON data under `/data` and the Next.js UI strings — into Icelandic and Italian, continuously, as new content is merged. Success = a new English JSON file landing on `main` automatically produces schema-valid `/data/is/` and `/data/it/` counterparts via PR, and the deployed Vercel site serves all three locales with zero hardcoded strings remaining in components. Quality bar: native-speaker Icelandic, academic-register Italian, zero schema breakage, idempotent re-runs.

## CONTEXT
- Repo is open-source, Next.js (App Router) on Vercel. Content is year-by-year JSON under `/data` following the ICCRA schema (fields include `title`, `description`, `event_details`, `sources`, `certainty_level`).
- Translation provider: Google Gemini via `GOOGLE_AI_API_KEY` in gitignored `.env`. Use the Google Generative AI SDK.
- Model (both locales): **Gemini Flash 3 Preview**. Do not substitute. Flash 3 Preview hits the sweet spot of speed, cost, and reasoning when anchored with a strict system prompt.
- Icelandic strategy: prompt the model *in Icelandic* to lock it into the Icelandic latent space. Use the exact system prompt below, verbatim, for the Icelandic pipeline:

  ```
  Þú ert sérfræðingur í íslenskri sagnfræði og yfirþýðandi fyrir sögulegt gagnasafn. Þitt hlutverk er að þýða sagnfræðileg JSON-gögn úr ensku yfir á vandaða, fræðilega íslensku.

  STRANGAR REGLUR:
  1. JSON HEILINDI: Þýddu AÐEINS gildi (values). Haltu öllum lyklum (keys) í ensku og nákvæmlega eins og þeir eru.
  2. FRÆÐILEGT MÁLFAR: Notaðu viðurkennd íslensk hugtök yfir sögulega atburði og tímabil (t.d. notaðu "f.Kr." fyrir BCE og "e.Kr." fyrir CE). Málfarið skal vera hlutlægt, nákvæmt og ritmálstengt.
  3. NÖFN OG STAÐIR: Ef hefðbundin íslensk þýðing er til á sögulegum nöfnum eða borgum (t.d. "Róm" í stað "Rome", "Júlíus Sesar" í stað "Julius Caesar"), notaðu hana. Annars skaltu halda upprunalega nafninu.
  4. EKKERT RAPP: Skilaðu EINGÖNGU gildu JSON-skjali. Engar útskýringar, engin inngangsorð, og engar Markdown-merkingar (eins og ```json) utan um svarið.
  ```

- Italian strategy: mirror the same architecture with an Italian-language system prompt following the same four rules (JSON integrity, academic register with established Italian historical terminology, canonical Italian names/places where they exist, no preamble or Markdown fencing). Compose it; do not translate the Icelandic prompt literally.
- Project status: ~0% of 5,226-year scope complete. Pipeline assumes continuous ingestion, not a one-shot batch.
- Start by reading the repo: confirm exact JSON shape, existing `/data` layout, Next.js version, whether an i18n library is already installed, and any existing scripts under `/scripts` or `/tools`.
- Reference: the attached brief (SOTA translation approach, April 2026) is a north star for architecture only. Models and prompts are locked above.

## CONSTRAINTS
- Use Gemini Flash 3 Preview for both Icelandic and Italian. Do not substitute model versions without explicit authorization.
- Use the Icelandic system prompt verbatim. Do not rewrite, abbreviate, or "improve" it.
- Configure the API call for strict JSON output: set `response_mime_type: "application/json"` (or SDK equivalent) in addition to the Rule #4 instruction. Belt and suspenders.
- Do not commit `.env` or any API keys. Confirm `.env` is in `.gitignore` before first run; add it if missing.
- Do not mutate JSON keys — translate values only. Preserve structure, numeric fields, dates, IDs, URLs, and source citations verbatim.
- Do not translate `sources[].url` fields. Maintain a `DO_NOT_TRANSLATE` glossary for edge cases (technical terms, Latin, canonical IDs).
- Idempotent: re-running the pipeline on already-translated files must be a no-op unless the English source changed. Track via content hash in a sidecar (e.g., `.translation-manifest.json`).
- All translation output must round-trip through `JSON.parse` and validate against the ICCRA schema. If no schema validator exists, add one (Zod or Ajv) as part of this mission.
- Fail loudly on API errors, JSON parse errors, or schema validation failures. Never write partial or malformed translations to disk.
- Atomic commits. Feature branch only, never `main`. Never force-push.
- If an i18n library is already in the repo, use it. Do not introduce a competing one.
- Rate-limit and batch API calls sensibly. Handle 429s with exponential backoff.

## AUTHORITY
Delegated. Full discretion on:
- Script language (Node/TypeScript preferred for repo consistency; Python acceptable if repo already uses it for tooling)
- i18n library for UI strings (next-intl, next-i18next, or existing if present) — pick what fits the App Router setup
- Tolgee/Inlang vs. in-repo JSON-per-locale for UI — recommend based on repo complexity
- Italian system prompt wording (must mirror the Icelandic prompt's four-rule structure)
- Manifest/hashing strategy, batching, retry logic
- GitHub Actions workflow structure

Escalate with 🔺 only if:
- The ICCRA schema is ambiguous or internally inconsistent
- The repo already has a conflicting translation setup
- Gemini Flash 3 Preview is unavailable, deprecated, or rate-limited beyond workable bounds
- API quotas or pricing tiers require an account-level decision

## PHASE 1 — PRE-LAUNCH (stop here and wait for GO)
Produce `MISSION_PLAN.md` at repo root containing:
1. **Reconnaissance report** — actual repo state: Next.js version, existing i18n, `/data` file count and JSON shape, existing scripts, CI setup, `.gitignore` status for `.env`
2. **Feature list (JSON)** — every discrete unit of work with `id`, `name`, `acceptance`, `depends_on`, `status`. At minimum: env/secrets setup, schema validator, JSON translation script (IS), JSON translation script (IT), manifest/idempotency layer, UI i18n scaffolding, UI string extraction, UI translation automation, GitHub Actions workflow, end-to-end dry run on a sample file
3. **Architecture decisions** — script language, i18n library, Tolgee vs. in-repo, manifest format, Italian system prompt draft (full text), with one-line rationale each
4. **Risk register** — ranked by likelihood × impact, with mitigations. Include at minimum: schema drift, Flash 3 Preview availability, Icelandic grammatical edge cases, API key leakage, partial-write corruption
5. **Pre-flight checklist** — what must be true before GO
6. **Go/No-Go recommendation** — honest assessment

Stop. Do not execute. Wait for my GO.

## PHASE 2 — LAUNCH (on GO)
Execute via Incremental Execution Protocol: one feature → test → atomic commit → update progress tracker → next. No confirmation seeking mid-execution. Log deviations with rationale. Flag blockers exceeding authority with 🔺.

## PHASE 3 — POST-LAUNCH
Deliver `POST_LAUNCH_REPORT.md`: mission status, feature status table, deviations, blockers, deliverables inventory, verification results. Include a sample translated JSON file for both locales so I can eyeball the Icelandic quality against the system prompt's intent.

## PHASE 4 — DEBRIEF & PERSISTENCE
Deliver `DEBRIEF.md` + `CLAUDE.md` update recommendations + updated manifest + handover doc. Log any anti-patterns discovered (especially around Icelandic grammatical failures the prompt didn't catch) into the project's anti-pattern registry.

## REPORTING
Write for a commander who verifies by observation, not code inspection. Include: exact commands to run the pipeline locally, exact steps to trigger the GitHub Action, and observable checks for the Vercel frontend across all three locales. Flag any Icelandic output you're uncertain about — do not smooth it over.

START ONLY WITH ICELANDIC!!! 