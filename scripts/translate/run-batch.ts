/**
 * Batch CLI — single Gemini batch job for all uncached files.
 * Usage: tsx run-batch.ts --locale is [--limit N]
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { config as loadEnv } from "dotenv";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, relative, basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  submitBatch,
  pollBatch,
  extractInlinedResponses,
  processBatchResponse,
  unitsFromFiles,
  type BatchRequestUnit,
  type BatchPerFileResult,
} from "./batch.js";
import {
  loadManifest,
  saveManifest,
  needsTranslation,
  recordTranslation,
  sha256,
  type Locale,
} from "./manifest.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const CORPUS_DIR = join(REPO_ROOT, "outputs", "json");
const MANIFEST_PATH = join(REPO_ROOT, ".translation-manifest.json");
const STATE_DIR = join(HERE, ".batch-state");

loadEnv({ path: join(REPO_ROOT, ".env") });

interface Args {
  locale: Locale;
  limit?: number;
  resume?: string;
  model: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    locale: "is",
    model: process.env.TRANSLATION_MODEL ?? "gemini-2.5-flash",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--locale") args.locale = argv[++i] as Locale;
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--resume") args.resume = argv[++i];
    else if (arg === "--model") args.model = argv[++i];
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_AI_API_KEY not set.");
    process.exit(2);
  }

  const systemPromptPath = join(HERE, "prompts", `system.${args.locale}.md`);
  const glossaryPath = join(HERE, "glossary.json");
  const [systemPrompt, glossaryRaw] = await Promise.all([
    readFile(systemPromptPath, "utf8"),
    readFile(glossaryPath, "utf8"),
  ]);
  const promptSha = sha256(systemPrompt);

  const buildUserMessage = makeUserMessageBuilder(glossaryRaw);

  const manifest = await loadManifest(MANIFEST_PATH);
  const allFiles = (await readdir(CORPUS_DIR))
    .filter((n) => n.endsWith(".json") && !n.endsWith(".tmp"))
    .map((n) => join(CORPUS_DIR, n))
    .sort(yearFileSort);

  const pending: Array<{ sourcePath: string; targetPath: string; rel: string; raw: string; sha: string }> = [];
  for (const sourcePath of allFiles) {
    const rel = relative(REPO_ROOT, sourcePath).replace(/\\/g, "/");
    const targetPath = join(REPO_ROOT, "outputs", "translations", args.locale, basename(sourcePath));
    const raw = await readFile(sourcePath, "utf8");
    const sha = sha256(raw);
    if (!needsTranslation(manifest, rel, sha, args.locale, promptSha) && existsSync(targetPath)) continue;
    pending.push({ sourcePath, targetPath, rel, raw, sha });
    if (args.limit && pending.length >= args.limit) break;
  }

  console.log(`[batch] locale=${args.locale} model=${args.model} pending=${pending.length} (cached=${allFiles.length - pending.length})`);
  if (pending.length === 0) {
    console.log("Nothing to translate.");
    return;
  }

  const units: BatchRequestUnit[] = await unitsFromFiles({
    files: pending.map((p) => ({ sourcePath: p.sourcePath, targetPath: p.targetPath })),
    buildUserMessage,
  });

  let jobName = args.resume;
  if (!jobName) {
    const displayName = `hhai-translate-${args.locale}-${Date.now()}`;
    console.log(`[batch] submitting job displayName=${displayName} requests=${units.length}`);
    jobName = await submitBatch({
      apiKey,
      model: args.model,
      systemInstruction: systemPrompt,
      units,
      displayName,
    });
    await persistJobState(jobName, args.locale, args.model, units);
    console.log(`[batch] submitted: ${jobName}`);
  } else {
    console.log(`[batch] resuming: ${jobName}`);
  }

  const job = await pollBatch({
    apiKey,
    jobName,
    intervalMs: 30_000,
    onTick: (state, elapsedMs) => {
      console.log(`[batch] state=${state} elapsed=${Math.round(elapsedMs / 1000)}s`);
    },
  });

  const finalState = (job as { state?: string }).state ?? "UNKNOWN";
  if (finalState !== "JOB_STATE_SUCCEEDED") {
    console.error(`[batch] job ended in non-success state: ${finalState}`);
    console.error(JSON.stringify(job, null, 2).slice(0, 2000));
    process.exit(1);
  }

  const responses = extractInlinedResponses(job, units);

  let written = 0;
  let failed = 0;
  let repaired = 0;
  const failures: Array<{ key: string; reason: string }> = [];

  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    const unit = units[i];
    if (r.error) {
      failed++;
      failures.push({ key: r.key, reason: r.error });
      console.error(`[fail] ${unit.sourcePath} — ${r.error}`);
      continue;
    }
    const result = await processBatchResponse(unit, r.text!);
    if (!result.written) {
      failed++;
      failures.push({ key: r.key, reason: result.skippedReason ?? "unknown" });
      console.error(`[fail] ${unit.sourcePath} — ${result.skippedReason}`);
      if (result.structuralIssues.length) {
        for (const issue of result.structuralIssues.slice(0, 3)) {
          console.error(`  ${issue.kind} at ${issue.path}`);
        }
      }
      continue;
    }
    if (result.repairs > 0) {
      repaired++;
      console.log(`[repair] ${unit.sourcePath} (${result.repairs} key(s))`);
    }
    const rel = relative(REPO_ROOT, unit.sourcePath).replace(/\\/g, "/");
    recordTranslation(manifest, rel, result.sourceSha, args.locale, promptSha, result.targetSha, args.model);
    written++;
    if (written % 100 === 0) {
      await saveManifest(MANIFEST_PATH, manifest);
      console.log(`[ok] checkpoint manifest saved (${written}/${responses.length})`);
    }
  }

  await saveManifest(MANIFEST_PATH, manifest);
  console.log(`\nDone. written=${written} failed=${failed} repaired=${repaired}`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures.slice(0, 30)) console.log(`  ${f.key}: ${f.reason}`);
    if (failures.length > 30) console.log(`  …and ${failures.length - 30} more`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

function yearFileSort(a: string, b: string): number {
  return Number(basename(b, ".json")) - Number(basename(a, ".json"));
}

function makeUserMessageBuilder(glossaryRaw: string): (sourceRaw: string) => string {
  const g = JSON.parse(glossaryRaw);
  const preserve = g.preserve_values_at_paths as Record<string, string[]>;
  const fixed = (g.fixed_translations_is ?? {}) as Record<string, string>;
  const glossaryLines: string[] = [];
  for (const [path, values] of Object.entries(preserve)) {
    glossaryLines.push(`- ${path}: ${values.join(", ")}`);
  }
  glossaryLines.push("");
  glossaryLines.push("Haltu einnig ID-strengjum, hnitum, krossvísunum og tölum óbreyttum.");
  if (Object.keys(fixed).length > 0) {
    glossaryLines.push("");
    glossaryLines.push("FÖSTU ÞÝÐINGAR (notaðu nákvæmlega þessar útgáfur þegar enska frumheitið kemur fyrir):");
    for (const [en, is] of Object.entries(fixed)) glossaryLines.push(`  "${en}" → "${is}"`);
  }
  const glossaryText = glossaryLines.join("\n");

  return (sourceRaw: string): string => {
    const source = JSON.parse(sourceRaw);
    const keys = collectAllKeys(source);
    return [
      "ATHUGIÐ — JSON-LYKLAR MEGA EKKI BREYTAST. Eftirfarandi enska heiti eru lyklar (ekki gildi) og verða að standa nákvæmlega eins og þau eru í frumtextanum:",
      keys.map((k) => `  "${k}"`).join("\n"),
      "",
      "Verndaðu einnig eftirfarandi enum-gildi og auðkenni nákvæmlega eins og í frumtexta (EKKI þýða þau, EKKI breyta stafsetningu):",
      glossaryText,
      "",
      "Hér er JSON-skjalið sem á að þýða (skilaðu fullu JSON-skjali á íslensku, sama uppbygging, sömu lyklar, sömu enum-gildi, sömu auðkenni, sömu tölugildi):",
      sourceRaw,
    ].join("\n");
  };
}

function collectAllKeys(value: unknown, acc: Set<string> = new Set()): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectAllKeys(item, acc);
  } else if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      acc.add(k);
      collectAllKeys(v, acc);
    }
  }
  return [...acc].sort();
}

async function persistJobState(
  jobName: string,
  locale: string,
  model: string,
  units: BatchRequestUnit[],
): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(STATE_DIR, { recursive: true });
  const file = join(STATE_DIR, `${locale}-${Date.now()}.json`);
  const payload = {
    jobName,
    locale,
    model,
    submittedAt: new Date().toISOString(),
    requestCount: units.length,
    keys: units.map((u) => u.key),
  };
  await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  console.log(`[batch] state saved: ${relative(REPO_ROOT, file)}`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
