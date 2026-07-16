/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-16
 *
 * Overlay: converts the classical-music Layer 1/2 dataset into timeline events
 * tagged "musical", so they merge INTO the major year-by-year timeline and are
 * filterable like any other category. Frontend-only; the canonical corpus in
 * outputs/json is never touched. Remove the mergeMusicEvents() call to revert.
 */
import type { HistoryEvent, YearData } from "@/types/history";
import { MUSIC_ERAS } from "@/data/music-timeline";

function buildMusicEvents(): Map<number, HistoryEvent[]> {
  const byYear = new Map<number, HistoryEvent[]>();
  for (const era of MUSIC_ERAS) {
    // Era-level scholarly evidence, shared across the era's events (labelled as
    // such so it does not read as documenting one specific event). Full panel: /music.
    const eraSources = (era.evidence?.sources ?? []).slice(0, 4).map((s) => ({
      name: `Era evidence: ${s.title}${s.authors ? `, ${s.authors}` : ""}${s.doi ? ` (doi:${s.doi})` : ""}`,
      type: "scholarly",
      contemporary: false,
    }));
    era.entries.forEach((en, i) => {
      const namedComposer =
        en.composer && en.composer !== "Various" && en.composer !== "Anonymous";
      byYear.set(en.year, [
        ...(byYear.get(en.year) ?? []),
        {
          id: `music-${era.id}-${i}`,
          title: en.title,
          region: en.region,
          coordinates_approx: null,
          category: "musical",
          description: `${en.description} (${en.composer}, ${era.name}).`,
          key_figures: namedComposer ? [en.composer] : [],
          sources: eraSources,
          certainty: en.certainty,
          certainty_note: `Classical music & opera timeline; era scholarly coverage: ${era.evidence?.coverage ?? "none"}.`,
          cross_references: [],
        },
      ]);
    });
  }
  return byYear;
}

const MUSIC_EVENTS = buildMusicEvents();

/** Total number of music events overlaid onto the timeline. */
export const MUSIC_EVENT_COUNT = [...MUSIC_EVENTS.values()].reduce((n, a) => n + a.length, 0);

/** Music events for a single year (for the per-year detail page). */
export function musicEventsForYear(year: number): HistoryEvent[] {
  return MUSIC_EVENTS.get(year) ?? [];
}

const sourcesOf = (evs: HistoryEvent[]) => evs.reduce((n, e) => n + e.sources.length, 0);

/** Merge music events into the corpus years, tagged "musical" and filterable. */
export function mergeMusicEvents(years: YearData[]): YearData[] {
  if (MUSIC_EVENTS.size === 0) return years;
  const present = new Set(years.map((y) => y.year));
  const out = years.map((y) => {
    const add = MUSIC_EVENTS.get(y.year);
    return add
      ? { ...y, events: [...y.events, ...add], source_count: (y.source_count ?? 0) + sourcesOf(add) }
      : y;
  });
  for (const [year, evs] of MUSIC_EVENTS) {
    if (!present.has(year)) {
      out.push({
        year,
        year_label: year < 0 ? `${-year} BCE` : `${year} CE`,
        era_context: "",
        documentation_level: "sparse",
        geographic_coverage_gaps: [],
        events: evs,
        disconfirming_evidence: "none identified",
        historiographic_note: "",
        graph_edges: [],
      });
    }
  }
  return out.sort((a, b) => b.year - a.year);
}
