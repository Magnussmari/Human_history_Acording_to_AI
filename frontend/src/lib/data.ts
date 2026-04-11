import type { YearData, ChunkManifest, ProgressData, EventCategory, CertaintyLevel } from "@/types/history";
import { DATA_BASE_URL } from "./constants";

export async function fetchManifest(): Promise<ChunkManifest> {
  const res = await fetch(`${DATA_BASE_URL}/manifest.json`);
  if (!res.ok) throw new Error("Failed to load manifest");
  return res.json();
}

export async function fetchProgress(): Promise<ProgressData> {
  const res = await fetch(`${DATA_BASE_URL}/progress.json`);
  if (!res.ok) return { completed: [], failed: [], in_progress: [] };
  return res.json();
}

export async function fetchChunk(filename: string): Promise<YearData[]> {
  const res = await fetch(`${DATA_BASE_URL}/chunks/${filename}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAllYears(manifest: ChunkManifest): Promise<YearData[]> {
  const chunks = await Promise.all(
    manifest.chunks.map(c => fetchChunk(c.file))
  );
  return chunks.flat().sort((a, b) => b.year - a.year);
}

export interface FilterState {
  categories: EventCategory[];
  certainties: CertaintyLevel[];
  search: string;
  region: string;
}

export const DEFAULT_FILTERS: FilterState = {
  categories: [],
  certainties: [],
  search: "",
  region: "",
};

export function filterYears(years: YearData[], filters: FilterState): YearData[] {
  return years.filter(year => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches =
        year.year_label.toLowerCase().includes(q) ||
        year.era_context.toLowerCase().includes(q) ||
        year.events.some(e =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.key_figures.some(f => f.toLowerCase().includes(q))
        );
      if (!matches) return false;
    }

    if (filters.categories.length > 0) {
      const hasCategory = year.events.some(e => filters.categories.includes(e.category));
      if (!hasCategory) return false;
    }

    if (filters.certainties.length > 0) {
      const hasCertainty = year.events.some(e => filters.certainties.includes(e.certainty));
      if (!hasCertainty) return false;
    }

    if (filters.region) {
      const q = filters.region.toLowerCase();
      const hasRegion = year.events.some(e => e.region.toLowerCase().includes(q));
      if (!hasRegion) return false;
    }

    return true;
  });
}

export function searchEvents(years: YearData[], query: string) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: { year: number; yearLabel: string; event: YearData["events"][0] }[] = [];

  for (const year of years) {
    for (const event of year.events) {
      if (
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.key_figures.some(f => f.toLowerCase().includes(q))
      ) {
        results.push({ year: year.year, yearLabel: year.year_label, event });
        if (results.length >= 50) return results;
      }
    }
  }
  return results;
}
