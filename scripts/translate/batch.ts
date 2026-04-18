/**
 * Gemini Batch API client.
 * Submit one batch job for up to thousands of translation requests.
 * 50% discount vs sync; ≤24h SLA (usually much faster); single JSONL upload.
 *
 * Workflow: build per-request JSONL → upload via File API → batches.create →
 * poll batches.get every 30s → retrieve responses → run repair + diff +
 * schema validate per response → atomic write per file.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { GoogleGenAI, type CreateBatchJobConfig } from "@google/genai";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, basename } from "node:path";
import { sha256 } from "./manifest.js";
import { validateYearDoc, type YearDoc } from "./schema.js";
import { diffStructure, type DiffIssue } from "./structural-diff.js";
import { repairKeys } from "./key-repair.js";

export interface BatchRequestUnit {
  /** Stable key — used to map response back to source file */
  key: string;
  sourcePath: string;
  targetPath: string;
  sourceRaw: string;
  sourceSha: string;
  userMessage: string;
}

export interface BatchSubmitOptions {
  apiKey: string;
  model: string;
  systemInstruction: string;
  units: BatchRequestUnit[];
  displayName: string;
  temperature?: number;
}

export interface BatchPollOptions {
  apiKey: string;
  jobName: string;
  intervalMs?: number;
  onTick?: (state: string, elapsedMs: number) => void;
}

export interface BatchPerFileResult {
  key: string;
  sourcePath: string;
  targetPath: string;
  sourceSha: string;
  written: boolean;
  bytesIn: number;
  bytesOut: number;
  targetSha: string;
  structuralIssues: DiffIssue[];
  schemaErrors: string[];
  repairs: number;
  rawError?: string;
  skippedReason?: string;
}

const TERMINAL_STATES = new Set([
  "JOB_STATE_SUCCEEDED",
  "JOB_STATE_FAILED",
  "JOB_STATE_CANCELLED",
  "JOB_STATE_EXPIRED",
]);

export async function submitBatch(opts: BatchSubmitOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });

  const requests = opts.units.map((u) => ({
    contents: [{ role: "user", parts: [{ text: u.userMessage }] }],
    config: {
      systemInstruction: opts.systemInstruction,
      responseMimeType: "application/json",
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: 65536,
    },
  }));

  const config: CreateBatchJobConfig = { displayName: opts.displayName };

  const job = await ai.batches.create({
    model: opts.model,
    src: requests as never,
    config,
  });

  const name = (job as { name?: string }).name;
  if (!name) throw new Error("Batch job missing name in response");
  return name;
}

export async function pollBatch(opts: BatchPollOptions): Promise<unknown> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const interval = opts.intervalMs ?? 30_000;
  const start = Date.now();
  let job = await ai.batches.get({ name: opts.jobName });
  let state = (job as { state?: string }).state ?? "JOB_STATE_UNSPECIFIED";
  opts.onTick?.(state, 0);
  while (!TERMINAL_STATES.has(state)) {
    await sleep(interval);
    job = await ai.batches.get({ name: opts.jobName });
    state = (job as { state?: string }).state ?? "JOB_STATE_UNSPECIFIED";
    opts.onTick?.(state, Date.now() - start);
  }
  return job;
}

export interface ResponseExtraction {
  key: string;
  text?: string;
  error?: string;
}

/** Pull text and any per-request errors out of an inlinedResponses payload. */
export function extractInlinedResponses(
  job: unknown,
  units: BatchRequestUnit[],
): ResponseExtraction[] {
  const j = job as Record<string, unknown>;
  const dest = (j.dest ?? {}) as Record<string, unknown>;
  const inlined = (dest.inlinedResponses ?? []) as Array<Record<string, unknown>>;
  if (!Array.isArray(inlined) || inlined.length === 0) {
    throw new Error("Batch job has no inlinedResponses; check job.state and job.error");
  }
  if (inlined.length !== units.length) {
    throw new Error(`Response count ${inlined.length} != request count ${units.length}`);
  }
  const out: ResponseExtraction[] = [];
  for (let i = 0; i < inlined.length; i++) {
    const item = inlined[i];
    const errObj = item.error as { message?: string } | undefined;
    if (errObj && errObj.message) {
      out.push({ key: units[i].key, error: errObj.message });
      continue;
    }
    const response = item.response as Record<string, unknown> | undefined;
    const text = pickText(response);
    if (!text) {
      out.push({ key: units[i].key, error: "empty response text" });
      continue;
    }
    out.push({ key: units[i].key, text });
  }
  return out;
}

function pickText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const r = response as Record<string, unknown>;
  if (typeof r.text === "string") return r.text;
  const candidates = r.candidates as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(candidates) && candidates.length > 0) {
    const first = candidates[0];
    const content = first?.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<Record<string, unknown>> | undefined;
    if (parts && parts.length > 0) {
      return parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("");
    }
  }
  return "";
}

export async function processBatchResponse(
  unit: BatchRequestUnit,
  text: string,
): Promise<BatchPerFileResult> {
  const result: BatchPerFileResult = {
    key: unit.key,
    sourcePath: unit.sourcePath,
    targetPath: unit.targetPath,
    sourceSha: unit.sourceSha,
    written: false,
    bytesIn: Buffer.byteLength(unit.sourceRaw, "utf8"),
    bytesOut: 0,
    targetSha: "",
    structuralIssues: [],
    schemaErrors: [],
    repairs: 0,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const stripped = text
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    try {
      parsed = JSON.parse(stripped);
    } catch (err) {
      result.skippedReason = `JSON parse failed: ${(err as Error).message}`;
      return result;
    }
  }

  if (!parsed || typeof parsed !== "object") {
    result.skippedReason = "Response is not a JSON object";
    return result;
  }

  const source = JSON.parse(unit.sourceRaw) as YearDoc;
  const target = parsed as YearDoc;

  const repairs = repairKeys(source, target);
  result.repairs = repairs.length;

  const structural = diffStructure(source, target);
  if (structural.length > 0) {
    result.structuralIssues = structural;
    result.skippedReason = `Structural diff: ${structural.length} issue(s)`;
    return result;
  }

  const schema = validateYearDoc(target);
  if (!schema.valid) {
    result.schemaErrors = schema.errors;
    result.skippedReason = `Schema invalid: ${schema.errors.slice(0, 3).join("; ")}`;
    return result;
  }

  const outText = JSON.stringify(target, null, 2) + "\n";
  await mkdir(dirname(unit.targetPath), { recursive: true });
  const tmp = `${unit.targetPath}.tmp`;
  await writeFile(tmp, outText, "utf8");
  await rename(tmp, unit.targetPath);

  result.written = true;
  result.bytesOut = Buffer.byteLength(outText, "utf8");
  result.targetSha = sha256(outText);
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function unitsFromFiles(args: {
  files: Array<{ sourcePath: string; targetPath: string }>;
  buildUserMessage: (sourceRaw: string) => string;
}): Promise<BatchRequestUnit[]> {
  return Promise.all(
    args.files.map(async (f) => {
      const raw = await readFile(f.sourcePath, "utf8");
      return {
        key: basename(f.sourcePath),
        sourcePath: f.sourcePath,
        targetPath: f.targetPath,
        sourceRaw: raw,
        sourceSha: sha256(raw),
        userMessage: args.buildUserMessage(raw),
      };
    }),
  );
}
