/**
 * CLI entrypoint — translate a batch of year JSONs into a target locale.
 * Usage: tsx run.ts --locale is [--files a.json,b.json | --all]
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, relative, basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import { GeminiTranslator } from "./gemini.js";
import { translateFile } from "./translate.js";
import { loadManifest, saveManifest, needsTranslation, recordTranslation, sha256, type Locale } from "./manifest.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const CORPUS_DIR = join(REPO_ROOT, "outputs", "json");
const MANIFEST_PATH = join(REPO_ROOT, ".translation-manifest.json");

loadEnv({ path: join(REPO_ROOT, ".env") });

interface Args {
  locale: Locale;
  files: string[] | "all";
  concurrency: number;
  model: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    locale: "is",
    files: "all",
    concurrency: Number(process.env.TRANSLATION_CONCURRENCY ?? 4),
    model: process.env.TRANSLATION_MODEL ?? "gemini-flash-latest",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--locale") {
      const val = argv[++i];
      if (val !== "is") throw new Error(`Only 'is' supported at this time. Got: ${val}`);
      args.locale = val;
    } else if (arg === "--files") {
      const list = argv[++i];
      args.files = list.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--all") {
      args.files = "all";
    } else if (arg === "--concurrency") {
      args.concurrency = Number(argv[++i]);
    } else if (arg === "--model") {
      args.model = argv[++i];
    }
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_AI_API_KEY not set. Copy .env.example to .env and fill in your key.");
    process.exit(2);
  }

  const systemPromptPath = join(HERE, "prompts", `system.${args.locale}.md`);
  const glossaryPath = join(HERE, "glossary.json");

  const [systemPrompt, glossaryRaw] = await Promise.all([
    readFile(systemPromptPath, "utf8"),
    readFile(glossaryPath, "utf8"),
  ]);
  const promptSha = sha256(systemPrompt);

  const translator = new GeminiTranslator({
    apiKey,
    model: args.model,
    systemInstruction: systemPrompt,
  });

  const files = await resolveFiles(args.files);
  if (files.length === 0) {
    console.error("No files matched.");
    process.exit(1);
  }

  console.log(`[translate] locale=${args.locale} model=${args.model} concurrency=${args.concurrency} files=${files.length}`);

  const manifest = await loadManifest(MANIFEST_PATH);
  const limit = pLimit(args.concurrency);

  let translated = 0;
  let skippedCached = 0;
  let failed = 0;
  const failures: Array<{ file: string; reason: string }> = [];

  const tasks = files.map((srcPath) => limit(async () => {
    const rel = relative(REPO_ROOT, srcPath).replace(/\\/g, "/");
    const targetPath = join(REPO_ROOT, "outputs", "translations", args.locale, basename(srcPath));

    const raw = await readFile(srcPath, "utf8");
    const srcSha = sha256(raw);

    if (!needsTranslation(manifest, rel, srcSha, args.locale, promptSha) && existsSync(targetPath)) {
      skippedCached++;
      return;
    }

    try {
      const STRUCTURAL_RETRIES = 5;
      let result = await translateFile({
        sourcePath: srcPath,
        targetPath,
        locale: args.locale,
        glossaryText: compactGlossary(glossaryRaw),
        translator,
        model: args.model,
        temperature: 0.2,
      });

      let attempt = 1;
      while (!result.written && (result.structuralIssues.length > 0 || result.schemaErrors.length > 0) && attempt <= STRUCTURAL_RETRIES) {
        console.warn(`[retry ${attempt}/${STRUCTURAL_RETRIES}] ${rel} — ${result.skippedReason}`);
        const bumpTemp = 0.2 + attempt * 0.15;
        result = await translateFile({
          sourcePath: srcPath,
          targetPath,
          locale: args.locale,
          glossaryText: compactGlossary(glossaryRaw),
          translator,
          model: args.model,
          temperature: Math.min(bumpTemp, 0.9),
        });
        attempt++;
      }

      if (!result.written) {
        failed++;
        failures.push({ file: rel, reason: result.skippedReason ?? "unknown" });
        console.error(`[fail] ${rel} — ${result.skippedReason}`);
        if (result.structuralIssues.length) {
          for (const issue of result.structuralIssues.slice(0, 5)) {
            console.error(`  ${issue.kind} at ${issue.path} — source=${JSON.stringify(issue.source)?.slice(0, 80)} target=${JSON.stringify(issue.target)?.slice(0, 80)}`);
          }
        }
        return;
      }

      recordTranslation(manifest, rel, result.sourceSha, args.locale, promptSha, result.targetSha, args.model);
      translated++;
      console.log(`[ok]   ${rel} → outputs/translations/${args.locale}/${basename(srcPath)}  (${result.bytesIn}→${result.bytesOut} bytes)`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ file: rel, reason: msg });
      console.error(`[fail] ${rel} — ${msg}`);
    }
  }));

  await Promise.all(tasks);
  await saveManifest(MANIFEST_PATH, manifest);

  console.log("");
  console.log(`Done. translated=${translated} cached=${skippedCached} failed=${failed}`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures.slice(0, 20)) console.log(`  ${f.file}: ${f.reason}`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

async function resolveFiles(files: string[] | "all"): Promise<string[]> {
  if (files === "all") {
    const { readdir } = await import("node:fs/promises");
    const names = await readdir(CORPUS_DIR);
    return names
      .filter((n) => n.endsWith(".json") && !n.endsWith(".tmp"))
      .map((n) => join(CORPUS_DIR, n))
      .sort(yearFileSort);
  }
  return files.map((f) => resolve(process.cwd(), f));
}

function yearFileSort(a: string, b: string): number {
  const ya = Number(basename(a, ".json"));
  const yb = Number(basename(b, ".json"));
  return yb - ya;
}

function compactGlossary(raw: string): string {
  const g = JSON.parse(raw);
  const lines: string[] = [];
  const preserve = g.preserve_values_at_paths as Record<string, string[]>;
  for (const [path, values] of Object.entries(preserve)) {
    lines.push(`- ${path}: ${values.join(", ")}`);
  }
  lines.push("");
  lines.push("Haltu einnig ID-strengjum, hnitum, krossvísunum og tölum óbreyttum.");
  const fixed = g.fixed_translations_is as Record<string, string> | undefined;
  if (fixed && Object.keys(fixed).length > 0) {
    lines.push("");
    lines.push("FÖSTU ÞÝÐINGAR (notaðu nákvæmlega þessar útgáfur þegar enska frumheitið kemur fyrir):");
    for (const [en, is] of Object.entries(fixed)) {
      lines.push(`  "${en}" → "${is}"`);
    }
  }
  return lines.join("\n");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
