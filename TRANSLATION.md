# Eternal Codex — Open-Source Translation Project

> **Þýðingarverkefni** — every year of human history, in your language. Open source. AI-assisted, human-reviewable, schema-locked, hallucination-resistant.

This document is the public methodology and status for the **Chronograph translation layer**: a production-grade pipeline that localizes the 5,226-year ICCRA corpus into other languages — starting with **Icelandic**.

If you speak Icelandic, you can help. If you want to add another language (Italian, Polish, Faroese, Greenlandic, Sámi, Welsh — the smaller the better), the pipeline is built to fit you.

---

## What this is

The [Chronograph corpus](README.md) is 5,226 JSON files — one per year from 3,200 BCE to 2025 CE — produced by Claude Sonnet 4.6 against the [ICCRA schema](RESEARCH_PROMPT.md). Every event is sourced. Every gap is declared. Every uncertainty is graded.

The translation layer takes those English JSON files and produces **byte-identical structure in other languages**, with strict guarantees that no key, ID, enum, coordinate, or numeric field can be silently mutated by the translation model.

The result is a multilingual encyclopedia with the same schema worldwide and the same retrieval guarantees in every language.

---

## Why open-source it (especially for Icelandic)

Three reasons:

1. **Small-language corpora are scarce**. A 5,226-year structured-history dataset in *any* language is rare; in Icelandic, virtually nonexistent. Open-sourcing this gives Icelandic NLP, education, and AI projects a high-quality structured corpus to build on.
2. **The methodology travels**. The same pipeline that does EN → IS does EN → ANY. The cost barrier (~$35 for the full Icelandic corpus at 2026 batch pricing) is low enough that small communities can run their own locale.
3. **Native speakers are the ground truth**. The pipeline can produce the first draft; only a human native speaker can validate idiom, register, and historiographic vocabulary. Open-sourcing makes that review collaborative instead of locked behind one operator.

---

## Methodology — the six-guard correctness chain

The translation pipeline is **not** "ask the model nicely and hope." Every translated file must pass **all six guards** or it is not written:

1. **Locked verbatim system prompt** — the model is prompted *in Icelandic* with a 4-rule prompt: JSON integrity, academic register (`f.Kr.` / `e.Kr.`), canonical Icelandic names where they exist, no Markdown fencing. Prompt content is content-hashed and pinned in the manifest; any edit invalidates the entire locale cache.
2. **Glossary preamble** — every JSON key from the source file + every ICCRA enum value is listed in the user message as a do-not-translate sentinel before the JSON body.
3. **API-level strict JSON** — `responseMimeType: "application/json"` forces the Gemini API to return parseable JSON.
4. **Structural diff** — post-translation, source and target are walked recursively. Keys must be byte-identical. Enums (`category`, `certainty`, `documentation_level`, `relation`, `type`) must be byte-identical. IDs (`id`, `from`, `to`) must be byte-identical. Numerics (`year`, `contemporary`) must be byte-identical. Array lengths must match. `cross_references` and `coordinates_approx` allow English parenthetical annotations to translate but require the ID/numeric prefix to match.
5. **Deterministic key-rename auto-repair** — for one specific class of mechanical model error (e.g. `"certain": "confirmed"` instead of `"certainty": "confirmed"`), the schema is authoritative. The rename is logged, the value is unchanged, and the file proceeds. If the model invented a new value or the wrong enum, the diff catches it.
6. **Ajv schema validator** — the translated file must pass the same strict ICCRA schema validator the English corpus does.

Atomic `.tmp → rename` write ensures no partial files ever land on disk.

If any guard trips, the file is **not written** and the failure is logged. The next run retries from scratch via the SHA256 manifest.

---

## Locked Icelandic system prompt

The full prompt is at [`scripts/translate/prompts/system.is.md`](scripts/translate/prompts/system.is.md) — verbatim from the mission brief, not auto-translated:

```
Þú ert sérfræðingur í íslenskri sagnfræði og yfirþýðandi fyrir sögulegt gagnasafn.
Þitt hlutverk er að þýða sagnfræðileg JSON-gögn úr ensku yfir á vandaða,
fræðilega íslensku.

STRANGAR REGLUR:
1. JSON HEILINDI: Þýddu AÐEINS gildi (values). Haltu öllum lyklum (keys) í ensku
   og nákvæmlega eins og þeir eru.
2. FRÆÐILEGT MÁLFAR: Notaðu viðurkennd íslensk hugtök yfir sögulega atburði og
   tímabil (t.d. notaðu "f.Kr." fyrir BCE og "e.Kr." fyrir CE). Málfarið skal
   vera hlutlægt, nákvæmt og ritmálstengt.
3. NÖFN OG STAÐIR: Ef hefðbundin íslensk þýðing er til á sögulegum nöfnum eða
   borgum (t.d. "Róm" í stað "Rome", "Júlíus Sesar" í stað "Julius Caesar"),
   notaðu hana. Annars skaltu halda upprunalega nafninu.
4. EKKERT RAPP: Skilaðu EINGÖNGU gildu JSON-skjali. Engar útskýringar, engin
   inngangsorð, og engar Markdown-merkingar (eins og ```json) utan um svarið.
```

The Icelandic-language prompt locks the model into the Icelandic latent space — measurably higher quality than prompting in English and asking for Icelandic output.

---

## Fixed Icelandic terminology glossary

Selected entries from [`scripts/translate/glossary.json`](scripts/translate/glossary.json):

| English | Icelandic |
|---|---|
| BCE | f.Kr. |
| CE | e.Kr. |
| Antiquities of the Jews | Fornsögur Gyðinga |
| Jewish War | Stríð Gyðinga |
| Proleptic Gregorian | fyrirframreiknað gregorískt tímatal |
| Augustus | Ágústus |
| Herod the Great | Heródes mikli |
| Parthian Empire | Parþaveldið |
| Silk Road | Silkivegurinn |
| Han Dynasty | Han-veldið |

Canonical Icelandic forms for historical names (Júlíus Sesar, Konstantínópel, Aquisgrana → Aquisgrana, …) are handled by the locked prompt's rule #3.

**Pull requests adding to this glossary are very welcome.** Especially:
- Pre-modern empire and dynasty names
- Historiographic technical terms
- Place names with established Icelandic forms

---

## Translation status

**Locale: Icelandic (is)** — pipeline shipped 2026-04-18. Backfill in progress.

| Metric | Value |
|---|---|
| Total years in corpus | 5,226 |
| Translated and committed | see [`outputs/translations/is/STATUS.json`](outputs/translations/is/STATUS.json) |
| Falls back to English | all remaining years |
| Schema-validation pass rate | 100% on translated set |
| Cost per file (Gemini 2.5 Flash batch) | ~$0.007 — total backfill ~$35 |
| Hallucinated content | 0 (six guards) |
| Pipeline correctness retries to date | logged in commits, surfaced via `[repair]` events |

A machine-readable list of every translated year, with source SHA + target SHA + translation timestamp, is at [`outputs/translations/is/STATUS.json`](outputs/translations/is/STATUS.json).

---

## How to add a new language

1. **Compose a system prompt in the target language** following the four-rule structure (JSON integrity, academic register, canonical names, no Markdown fencing). Save to `scripts/translate/prompts/system.<locale>.md`.
2. **Add the locale code to `frontend/src/i18n/index.ts`** (`SUPPORTED_LOCALES` array and the `dictionaries` map).
3. **Author `frontend/src/i18n/dictionaries/<locale>.json`** — the user-facing UI string dictionary. Native-speaker translation, not machine-translated.
4. **Optionally extend `scripts/translate/glossary.json`** with `fixed_translations_<locale>` entries for canonical terms in your language.
5. **Run `npm run batch:<locale>`** (or for sync: `npm run run:<locale>`) — single batch job for the whole corpus, ~24h SLA, 50% off sync pricing.

---

## Reviewing translated content (Icelandic native speakers)

Open the relevant year file under [`outputs/translations/is/`](outputs/translations/is/) and:

1. Compare against the English source under [`outputs/json/`](outputs/json/).
2. Check **register** — is it `ritmál`, the formal written register? Or has the model drifted into spoken/colloquial?
3. Check **canonical names** — does it use established Icelandic forms (Heródes, Ágústus, Þúkýdídes), or does it leave English forms where Icelandic exists?
4. Check **historiographic vocabulary** — does it use the established academic Icelandic for the period?
5. Check **case and inflection** — is the noun in the right case for its sentence position?

If you find a recurring issue, the cleanest fix is to add a fixed translation to [`scripts/translate/glossary.json`](scripts/translate/glossary.json) and re-translate. Open a PR.

---

## Tools used

- **[Google Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash)** — production-stable model, 50% off in batch mode (~$35 for the full Icelandic corpus).
- **[Ajv](https://ajv.js.org/)** — JSON schema validator (mirrors the Python `validate_corpus.py`).
- **[`@google/genai`](https://www.npmjs.com/package/@google/genai)** — official Google Generative AI SDK, batch + sync.
- **TypeScript** + **`tsx`** runner — no build step.
- **GitHub Actions** — auto-translates new English content on push to `main`, opens a bot PR.

---

## Get involved

- **🇮🇸 Icelandic native speakers** — review translations in [`outputs/translations/is/`](outputs/translations/is/), open issues / PRs for register or vocabulary corrections.
- **Want to add another language?** — open an issue with the language name and rough timeline; the pipeline is generic.
- **Found a methodology bug?** — open an issue. Especially welcome: edge cases the structural diff doesn't catch.
- **NLP / education researchers** — the corpus is CC BY 4.0, code MIT. Use it.

---

## License

- **Code** (pipeline, validators, scripts): MIT — see [LICENSE](LICENSE).
- **English corpus** + **all translations**: CC BY 4.0 — attribution to Magnús Smári Smárason / Chronograph required.

---

*Built by [Magnús Smári Smárason](https://smarason.is). Translation layer shipped 2026-04-18 with [Claude Code](https://claude.com/claude-code).*
