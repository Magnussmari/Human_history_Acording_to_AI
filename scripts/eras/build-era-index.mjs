/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-07-29
 *
 * Era-index v2 builder.
 *
 * Merges the 22-entry chronological registry (v1) with the 21 expansion
 * eras from scripts/eras/registry-expansion-2026-07.json into a
 * single v2 index at frontend/public/data/eras/index.json.
 *
 * Idempotent: entries in the non-chronological number bands (>= 100) found
 * in the existing index are treated as previously-merged expansion eras,
 * dropped, and rebuilt from the expansion source file. Chronological
 * entries are normalised deterministically, so re-running on an
 * already-merged index reproduces the same registry byte-for-byte
 * (generated_at excepted).
 */

import { readFile, writeFile } from "node:fs/promises";

const INDEX_PATH = new URL("../../frontend/public/data/eras/index.json", import.meta.url);
const EXPANSION_PATH = new URL("./registry-expansion-2026-07.json", import.meta.url);

const SCHEMA_VERSION = "2.0.0";

/** Numbers < 100 belong to the chronological sweep (1-50; 21-49 reserved). */
const CHRONOLOGICAL_BAND_MAX = 99;

/** era-25 (Islamic Golden Age) is the one legacy entry with a golden tone. */
const GOLDEN_LEGACY_IDS = new Set(["era-25"]);

function normaliseChronological(entry) {
  return {
    id: entry.id,
    number: entry.number,
    label: entry.label,
    start: entry.start,
    end: entry.end,
    primaryBroadEra: entry.primaryBroadEra,
    kind: "chronological",
    tone: GOLDEN_LEGACY_IDS.has(entry.id) ? "golden" : "neutral",
    careLevel: "standard",
    overlaps: false,
    phaseStatus: entry.phaseStatus,
    educationStatus: entry.educationStatus,
  };
}

function normaliseExpansion(entry) {
  const out = {
    id: entry.id,
    number: entry.number,
    label: entry.label,
    start: entry.start,
    end: entry.end,
    kind: entry.kind,
    tone: entry.tone,
    primaryBroadEra: entry.primaryBroadEra,
    careLevel: entry.careLevel,
    overlaps: true,
    valorSource: entry.valorSource ?? null,
    focus: entry.focus,
  };
  if (entry.careNotes) out.careNotes = entry.careNotes;
  return out;
}

function computeTotals(registry) {
  const totals = {
    registered: registry.length,
    phase3Complete: 0,
    phase2Pending: 0,
    unresearched: 0,
    educationPilots: 0,
    byKind: {},
    byCareLevel: {},
  };
  for (const era of registry) {
    if (era.phaseStatus === "phase3-complete") totals.phase3Complete += 1;
    if (era.phaseStatus === "phase2-migration-pending") totals.phase2Pending += 1;
    if (era.phaseStatus === "unresearched") totals.unresearched += 1;
    if (era.educationStatus === "pilot-complete") totals.educationPilots += 1;
    totals.byKind[era.kind] = (totals.byKind[era.kind] ?? 0) + 1;
    totals.byCareLevel[era.careLevel] = (totals.byCareLevel[era.careLevel] ?? 0) + 1;
  }
  return totals;
}

const index = JSON.parse(await readFile(INDEX_PATH, "utf8"));
const expansion = JSON.parse(await readFile(EXPANSION_PATH, "utf8"));

// Base registry: chronological entries only. Anything in the expansion
// bands is a previously-merged expansion era and is rebuilt from source.
const chronological = (index.registry ?? [])
  .filter((entry) => entry.number <= CHRONOLOGICAL_BAND_MAX)
  .map(normaliseChronological);

const expansionEntries = [
  ...(expansion.thematic ?? []),
  ...(expansion.crisis ?? []),
  ...(expansion.regional ?? []),
].map(normaliseExpansion);

const registry = [...chronological, ...expansionEntries].sort((a, b) => a.number - b.number);

const v2 = {
  schema_version: SCHEMA_VERSION,
  generated_at: new Date().toISOString(),
  totals: computeTotals(registry),
  registry,
  futureBuckets: index.futureBuckets ?? [],
};

await writeFile(INDEX_PATH, JSON.stringify(v2, null, 2) + "\n");

console.log(`era index v2 written: ${registry.length} eras (${chronological.length} chronological + ${expansionEntries.length} expansion)`);
console.log(`byKind: ${JSON.stringify(v2.totals.byKind)}`);
console.log(`byCareLevel: ${JSON.stringify(v2.totals.byCareLevel)}`);
