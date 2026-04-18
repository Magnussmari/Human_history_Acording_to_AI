/**
 * Idempotency manifest — tracks SHA256(source) + SHA256(prompt) per file per locale.
 * Re-running with unchanged inputs yields zero API calls.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export type Locale = "is" | "it";

export interface LocaleEntry {
  target_sha: string;
  translated_at: string;
  model: string;
}

export interface ManifestEntry {
  source_sha: string;
  prompts: Partial<Record<Locale, string>>;
  locales: Partial<Record<Locale, LocaleEntry>>;
}

export interface Manifest {
  version: 1;
  generated_at: string;
  entries: Record<string, ManifestEntry>;
}

export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function loadManifest(path: string): Promise<Manifest> {
  if (!existsSync(path)) {
    return { version: 1, generated_at: new Date().toISOString(), entries: {} };
  }
  const text = await readFile(path, "utf8");
  const parsed = JSON.parse(text) as Manifest;
  if (parsed.version !== 1) throw new Error(`Unsupported manifest version: ${parsed.version}`);
  return parsed;
}

export async function saveManifest(path: string, manifest: Manifest): Promise<void> {
  manifest.generated_at = new Date().toISOString();
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(manifest, null, 2), "utf8");
  const { rename } = await import("node:fs/promises");
  await rename(tmp, path);
}

export function needsTranslation(
  manifest: Manifest,
  relSourcePath: string,
  sourceSha: string,
  locale: Locale,
  promptSha: string,
): boolean {
  const entry = manifest.entries[relSourcePath];
  if (!entry) return true;
  if (entry.source_sha !== sourceSha) return true;
  if (entry.prompts[locale] !== promptSha) return true;
  if (!entry.locales[locale]) return true;
  return false;
}

export function recordTranslation(
  manifest: Manifest,
  relSourcePath: string,
  sourceSha: string,
  locale: Locale,
  promptSha: string,
  targetSha: string,
  model: string,
): void {
  const entry = manifest.entries[relSourcePath] ?? {
    source_sha: sourceSha,
    prompts: {},
    locales: {},
  };
  entry.source_sha = sourceSha;
  entry.prompts[locale] = promptSha;
  entry.locales[locale] = {
    target_sha: targetSha,
    translated_at: new Date().toISOString(),
    model,
  };
  manifest.entries[relSourcePath] = entry;
}
