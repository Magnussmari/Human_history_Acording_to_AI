/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-07-29
 *
 * Era-index v2 validator.
 *
 * Gate for frontend/public/data/eras/index.json. Exits non-zero and prints
 * every violation found. Checks identity, number bands, date sanity, and
 * the v2 editorial fields (kind / tone / careLevel).
 *
 * Overlapping date ranges are LEGAL BY DESIGN — the expansion eras exist
 * precisely to overlap the chronological sweep and each other — so this
 * validator never rejects overlap.
 */

import { readFile } from "node:fs/promises";

const INDEX_PATH = new URL("../../frontend/public/data/eras/index.json", import.meta.url);

const KINDS = new Set(["chronological", "thematic", "crisis", "regional"]);
const TONES = new Set(["golden", "sombre", "neutral"]);
const CARE_LEVELS = new Set(["standard", "high"]);

const NUMBER_BANDS = {
  chronological: [1, 50],
  thematic: [100, 119],
  crisis: [120, 139],
  regional: [140, 159],
};

const index = JSON.parse(await readFile(INDEX_PATH, "utf8"));
const registry = index.registry ?? [];

const errors = [];
const seenIds = new Map();
const seenNumbers = new Map();

for (const era of registry) {
  const at = era.id ?? `(number ${era.number})`;

  if (seenIds.has(era.id)) {
    errors.push(`duplicate era id "${era.id}" (also ${seenIds.get(era.id)})`);
  } else {
    seenIds.set(era.id, at);
  }
  if (seenNumbers.has(era.number)) {
    errors.push(`duplicate era number ${era.number} (${at} and ${seenNumbers.get(era.number)})`);
  } else {
    seenNumbers.set(era.number, at);
  }

  for (const field of ["kind", "tone", "careLevel"]) {
    if (era[field] === undefined || era[field] === null) {
      errors.push(`${at}: missing ${field}`);
    }
  }

  if (era.kind !== undefined && !KINDS.has(era.kind)) {
    errors.push(`${at}: kind "${era.kind}" not in {${[...KINDS].join(",")}}`);
  }
  if (era.tone !== undefined && !TONES.has(era.tone)) {
    errors.push(`${at}: tone "${era.tone}" not in {${[...TONES].join(",")}}`);
  }
  if (era.careLevel !== undefined && !CARE_LEVELS.has(era.careLevel)) {
    errors.push(`${at}: careLevel "${era.careLevel}" not in {${[...CARE_LEVELS].join(",")}}`);
  }

  if (KINDS.has(era.kind) && typeof era.number === "number") {
    const [lo, hi] = NUMBER_BANDS[era.kind];
    if (era.number < lo || era.number > hi) {
      errors.push(`${at}: ${era.kind} era number ${era.number} outside band ${lo}-${hi}`);
    }
  }

  if (typeof era.start === "number" && typeof era.end === "number" && era.start >= era.end) {
    errors.push(`${at}: start (${era.start}) >= end (${era.end})`);
  }
}

if (errors.length > 0) {
  console.error(`era index INVALID — ${errors.length} violation(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`era index valid: ${registry.length} eras, ${seenIds.size} unique ids, ${seenNumbers.size} unique numbers`);
