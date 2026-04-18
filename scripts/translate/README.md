# Eternal Codex Translation Pipeline (IS)

Isolated TypeScript pipeline that translates `outputs/json/*.json` into Icelandic under `outputs/translations/is/`.

## Setup

```bash
cd scripts/translate
npm install
```

Ensure repo-root `.env` has `GOOGLE_AI_API_KEY=...` (see `.env.example`).

## Usage

**Validate the Node schema against an English source file:**
```bash
cd scripts/translate
npm run validate -- ../../outputs/json/-1.json
```

**Dry-run IS translation (3 sample files):**
```bash
npm run dry-run:is
```

**Full IS run:**
```bash
npm run run:is
```

Re-running is idempotent via `.translation-manifest.json` at repo root. Only files whose source SHA or prompt SHA changed get re-translated.

## Files

- `prompts/system.is.md` — Icelandic system prompt (locked, verbatim from mission brief).
- `glossary.json` — DO_NOT_TRANSLATE paths + preservation rules.
- `schema.ts` — ICCRA Ajv schema (mirrors `scripts/validate_corpus.py`).
- `structural-diff.ts` — post-translation keys/enums/IDs/numerics diff; any mismatch aborts the file.
- `gemini.ts` — Gemini Flash 3 Preview client; `responseMimeType: "application/json"`; exponential backoff on 429/5xx.
- `translate.ts` — per-file translator: validate source → call Gemini → diff → validate target → atomic write.
- `manifest.ts` — idempotency via SHA256(source) + SHA256(prompt) per file per locale.
- `run.ts` — CLI entrypoint.

## Output layout

```
outputs/translations/is/<year>.json
.translation-manifest.json              # at repo root, committed
```

## Correctness guards (belt-and-suspenders-and-belt)

1. Locked verbatim Icelandic system prompt (rule #1: translate values only, keep keys in English).
2. Glossary preamble in user message lists every enum + identifier path that must not change.
3. `responseMimeType: "application/json"` forces strict JSON output at the API layer.
4. Structural diff rejects any file where keys, enums, IDs, numerics, or array lengths differ from source.
5. Ajv schema validator rejects any file that breaks ICCRA.
6. Atomic rename from `*.tmp` → final path ensures no partial writes.

If any guard trips, the file is **not written** and the failure is logged. The manifest only records successful writes, so failures are retried on next run.
