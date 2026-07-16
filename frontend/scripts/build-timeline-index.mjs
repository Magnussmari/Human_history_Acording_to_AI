/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-16
 *
 * Builds public/data/timeline-index.json: a lightweight version of the corpus
 * for the home timeline (rows, filters, search). It keeps each event's title,
 * region, category, certainty, and key_figures but drops the heavy fields
 * (description, sources, era_context, graph_edges) which are only needed on the
 * per-year detail page. This cuts the client payload from ~6 MB gzipped to
 * ~0.7 MB, so the landing page no longer parses 34 MB of JSON on load.
 * Run from the frontend dir: node scripts/build-timeline-index.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";

const CHUNK_DIR = "public/data/chunks";
const OUT = "public/data/timeline-index.json";

const years = [];
for (const f of readdirSync(CHUNK_DIR)) {
  if (!f.endsWith(".json")) continue;
  const data = JSON.parse(readFileSync(`${CHUNK_DIR}/${f}`, "utf8"));
  const arr = Array.isArray(data) ? data : data.years ?? [];
  for (const y of arr) {
    years.push({
      year: y.year,
      year_label: y.year_label,
      era_context: "",
      documentation_level: y.documentation_level,
      geographic_coverage_gaps: [],
      disconfirming_evidence: "",
      historiographic_note: "",
      graph_edges: [],
      source_count: y.events.reduce((a, e) => a + (e.sources?.length ?? 0), 0),
      events: y.events.map((e) => ({
        id: e.id,
        title: e.title,
        region: e.region,
        coordinates_approx: null,
        category: e.category,
        description: "",
        key_figures: e.key_figures ?? [],
        sources: [],
        certainty: e.certainty,
        certainty_note: "",
        cross_references: [],
      })),
    });
  }
}
years.sort((a, b) => b.year - a.year);
const json = JSON.stringify(years);
writeFileSync(OUT, json);
console.log(
  `wrote ${OUT}: ${years.length} years, ${(json.length / 1024 / 1024).toFixed(1)} MB raw, ${(gzipSync(json).length / 1024 / 1024).toFixed(2)} MB gzipped`,
);
