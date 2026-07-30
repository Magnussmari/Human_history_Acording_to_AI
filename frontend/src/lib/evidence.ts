import type {
  EraBundle,
  EraIndex,
  EraRegistryEntry,
  Bibliography,
  BibliographyEntry,
  ValorMap,
} from "@/types/evidence";
import { DATA_BASE_URL } from "./constants";

const ERAS_BASE = `${DATA_BASE_URL}/eras`;

export async function fetchEraIndex(): Promise<EraIndex> {
  const res = await fetch(`${ERAS_BASE}/index.json`);
  if (!res.ok) throw new Error("Failed to load era index");
  return res.json();
}

export async function fetchEra(id: string): Promise<EraBundle | null> {
  const res = await fetch(`${ERAS_BASE}/${id}.json`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * True when a per-era dossier JSON is expected to exist under /data/eras/.
 *
 * Gates the fetch. Phase-4 expansion eras are registered before their research
 * lands, so fetching their dossier guarantees a 404 — which the page handles,
 * but which the browser still logs as a console error (a network 404 cannot be
 * suppressed from JS), breaking the zero-console-errors gate. So: don't ask.
 */
export function expectsDossierFile(entry: EraRegistryEntry): boolean {
  return (
    entry.phaseStatus != null &&
    entry.phaseStatus !== "phase4-research-pending"
  );
}

/**
 * True when a per-era dossier JSON actually exists under /data/eras/.
 *
 * The 22 chronological eras all ship a dossier. The phase-4 expansion eras are
 * registered before their research lands, so they resolve to the registry-stub
 * page instead. Keyed on phaseStatus rather than "phaseStatus == null" because
 * expansion entries DO carry a status ("phase4-research-pending") — without it
 * they drop out of the home-page era-pill filter entirely.
 */
export function isDossierFiled(entry: EraRegistryEntry): boolean {
  return expectsDossierFile(entry);
}

export function eraKindLabel(kind: EraRegistryEntry["kind"]): string {
  if (!kind) return "Era";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

/** Home timeline deep-link: year-range filter matching the dossier page convention. */
export function eraTimelineHref(
  entry: Pick<EraRegistryEntry, "start" | "end">,
): string {
  // start is always the earlier year (negative for BCE), end the later one.
  return `/?yearMin=${entry.start}&yearMax=${entry.end}`;
}

export async function fetchBibliography(): Promise<Bibliography> {
  const res = await fetch(`${ERAS_BASE}/bibliography.json`);
  if (!res.ok) return {};
  return res.json();
}

export async function fetchValorMap(): Promise<ValorMap> {
  const res = await fetch(`${ERAS_BASE}/valor-map.json`);
  if (!res.ok) return { sources: [], generated_at: "" };
  return res.json();
}

/**
 * Resolve the primary scholarly era a given year belongs to.
 * For overlapping eras (e.g. Han 206 BCE–220 CE overlaps Maurya 322–185 BCE),
 * pick the era whose midpoint is closest to the target year.
 */
/**
 * The scholarly era covering a given year, or null.
 *
 * The comparison used to read `year <= e.start && year >= e.end`, which is
 * unsatisfiable: the registry always stores start < end (validate-era-index.mjs
 * enforces it). So this returned null for EVERY year, and every /year/[id] page
 * showed "No scholarly-era deep-dive covers this year yet" — the placeholder the
 * 2026-07-16 UX audit reported as missing content. It was a bug, not a gap.
 *
 * With 43 overlapping eras a year can now have several candidates, so the
 * tie-break matters: prefer an era whose dossier is actually filed (never send a
 * reader to a phase-4 stub when a real dossier covers the year), then prefer the
 * narrowest span, which is the most specific claim about that year.
 */
export function findEraForYear(year: number, index: EraIndex): EraRegistryEntry | null {
  const candidates = index.registry.filter((e) => year >= e.start && year <= e.end);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const rank = (e: EraRegistryEntry) => [
    isDossierFiled(e) ? 0 : 1,
    e.end - e.start,
  ];
  return candidates.slice(1).reduce((best, c) => {
    const [bf, bs] = rank(best);
    const [cf, cs] = rank(c);
    if (cf !== bf) return cf < bf ? c : best;
    return cs < bs ? c : best;
  }, candidates[0]);
}

export function findErasForBroadEra(broadEraLabel: string, index: EraIndex): EraRegistryEntry[] {
  return index.registry.filter(e => e.primaryBroadEra === broadEraLabel);
}

export function resolveBibkey(key: string, bib: Bibliography): BibliographyEntry | null {
  return bib[key] ?? null;
}

export function formatEraRange(entry: Pick<EraRegistryEntry, "start" | "end">): string {
  const fmt = (y: number) => (y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`);
  return `${fmt(entry.start)} – ${fmt(entry.end)}`;
}
