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
      // Skip works the corpus already covers, so the main timeline never shows a
      // duplicate. They still appear in the dedicated /music folio.
      if (en.suppressed) return;
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

/** One work in the chronological Music & Opera thread. */
export interface MusicThreadLink {
  id: string;
  year: number;
  title: string;
}

// The full, chronologically ordered thread of non-suppressed music works, so a
// folio entry can offer "earlier / later in Music & Opera" — the audit's core
// "filter-and-thread" move: the overlay becomes a guided narrative, not just a
// filter. Derived directly from MUSIC_EVENTS (the same map the timeline renders
// from) so it CANNOT desync: same ids, same titles, same suppression. A pinned
// locale on the tie-break keeps SSR/client ordering identical (no hydration mismatch).
const MUSIC_THREAD: MusicThreadLink[] = (() => {
  const items: MusicThreadLink[] = [];
  for (const [year, evs] of MUSIC_EVENTS) {
    for (const e of evs) items.push({ id: e.id, year, title: e.title });
  }
  return items.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, "en"));
})();

/**
 * The works immediately before and after a given music event in the thread,
 * keyed by the event's stable id. A miss (id not in the thread — e.g. a
 * suppressed work, or a non-music event) returns position -1 and no neighbours,
 * so the UI shows nothing rather than a confidently-wrong link.
 */
export function musicThreadNeighbours(id: string): {
  prev: MusicThreadLink | null;
  next: MusicThreadLink | null;
  position: number;
  total: number;
} {
  const total = MUSIC_THREAD.length;
  const idx = MUSIC_THREAD.findIndex((m) => m.id === id);
  if (idx < 0) return { prev: null, next: null, position: -1, total };
  return {
    prev: MUSIC_THREAD[idx - 1] ?? null,
    next: MUSIC_THREAD[idx + 1] ?? null,
    position: idx,
    total,
  };
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
