/**
 * Reconcile .translation-manifest.json against on-disk translations.
 * For every translated file in outputs/translations/<locale>/, compute the
 * source SHA + target SHA + (current) prompt SHA and add to the manifest if
 * missing. Lets you resume after a crash that wrote files but lost the
 * manifest update.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, relative, basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadManifest, saveManifest, recordTranslation, sha256, type Locale } from "./manifest.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const CORPUS_DIR = join(REPO_ROOT, "outputs", "json");
const TRANSLATIONS_DIR = join(REPO_ROOT, "outputs", "translations");
const MANIFEST_PATH = join(REPO_ROOT, ".translation-manifest.json");

async function main(): Promise<void> {
  const locales = (await readdir(TRANSLATIONS_DIR)).filter(async (n) => {
    const s = await stat(join(TRANSLATIONS_DIR, n));
    return s.isDirectory();
  });

  const manifest = await loadManifest(MANIFEST_PATH);
  const model = process.env.TRANSLATION_MODEL ?? "gemini-2.5-flash";
  let added = 0;

  for (const locale of locales as Locale[]) {
    const promptPath = join(HERE, "prompts", `system.${locale}.md`);
    if (!existsSync(promptPath)) continue;
    const promptSha = sha256(await readFile(promptPath, "utf8"));
    const localeDir = join(TRANSLATIONS_DIR, locale);
    const files = (await readdir(localeDir)).filter((n) => n.endsWith(".json") && !n.endsWith(".tmp"));

    for (const file of files) {
      const sourcePath = join(CORPUS_DIR, file);
      const targetPath = join(localeDir, file);
      if (!existsSync(sourcePath)) continue;

      const [srcRaw, tgtRaw] = await Promise.all([
        readFile(sourcePath, "utf8"),
        readFile(targetPath, "utf8"),
      ]);
      const srcSha = sha256(srcRaw);
      const tgtSha = sha256(tgtRaw);
      const rel = relative(REPO_ROOT, sourcePath).replace(/\\/g, "/");

      const existing = manifest.entries[rel]?.locales?.[locale];
      if (existing && existing.target_sha === tgtSha) continue;

      recordTranslation(manifest, rel, srcSha, locale, promptSha, tgtSha, model);
      added++;
      console.log(`[+] ${locale}/${basename(file)}`);
    }
  }

  await saveManifest(MANIFEST_PATH, manifest);
  console.log(`\nManifest reconciled. ${added} new entries.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
