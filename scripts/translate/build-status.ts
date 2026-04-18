/**
 * Build outputs/translations/<locale>/STATUS.json — public-facing list of
 * translated years with source/target SHAs and timestamps. Read by the
 * TRANSLATION.md docs page and surfaceable in the frontend.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { readFile, readdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadManifest, type Locale } from "./manifest.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const TRANSLATIONS_DIR = join(REPO_ROOT, "outputs", "translations");
const MANIFEST_PATH = join(REPO_ROOT, ".translation-manifest.json");

async function main(): Promise<void> {
  const manifest = await loadManifest(MANIFEST_PATH);
  if (!existsSync(TRANSLATIONS_DIR)) {
    console.log("No translations dir; skipping STATUS.json builds.");
    return;
  }
  const locales: string[] = [];
  for (const name of await readdir(TRANSLATIONS_DIR)) {
    const s = await stat(join(TRANSLATIONS_DIR, name));
    if (s.isDirectory()) locales.push(name);
  }

  for (const locale of locales as Locale[]) {
    const localeDir = join(TRANSLATIONS_DIR, locale);
    const files = (await readdir(localeDir))
      .filter((n) => n.endsWith(".json") && !n.endsWith(".tmp") && n !== "STATUS.json")
      .sort((a, b) => Number(basename(a, ".json")) - Number(basename(b, ".json")));

    const entries = await Promise.all(files.map(async (file) => {
      const year = Number(basename(file, ".json"));
      const sourceRel = `outputs/json/${file}`;
      const m = manifest.entries[sourceRel];
      const localeMeta = m?.locales?.[locale];
      const fileStat = await stat(join(localeDir, file));
      return {
        year,
        year_label: year < 0 ? `${Math.abs(year)} f.Kr.` : `${year} e.Kr.`,
        file,
        bytes: fileStat.size,
        source_sha: m?.source_sha ?? null,
        target_sha: localeMeta?.target_sha ?? null,
        translated_at: localeMeta?.translated_at ?? null,
        model: localeMeta?.model ?? null,
      };
    }));

    const status = {
      locale,
      total_years_in_corpus: 5226,
      translated_count: entries.length,
      pending_count: 5226 - entries.length,
      coverage_pct: Number(((entries.length / 5226) * 100).toFixed(2)),
      year_range_translated: entries.length > 0
        ? { min: entries[0].year, max: entries[entries.length - 1].year }
        : null,
      models_used: [...new Set(entries.map((e) => e.model).filter(Boolean))],
      generated_at: new Date().toISOString(),
      entries,
    };

    const out = join(localeDir, "STATUS.json");
    await writeFile(out, JSON.stringify(status, null, 2) + "\n", "utf8");
    console.log(`[${locale}] STATUS.json — ${entries.length} translated / ${status.pending_count} pending (${status.coverage_pct}%)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
