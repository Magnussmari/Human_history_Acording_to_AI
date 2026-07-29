/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * Server-side per-page metadata for the dynamic /year/[id] and /era/[id]
 * routes. Reads the lite indexes from public/data via fs (never bundled to the
 * client) and builds rich, unique <title>/description/OpenGraph per page — the
 * "generateMetadata lever" the SEO audit flagged: 5,226 year pages and every
 * scholarly era previously shared the generic root card.
 */
import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

interface IndexEvent {
  title: string;
  category: string;
  region: string;
}
interface YearIndexEntry {
  year: number;
  year_label: string;
  documentation_level?: string;
  source_count?: number;
  events?: IndexEvent[];
}
interface EraRegistryEntry {
  id: string;
  label: string;
  start: number;
  end: number;
  primaryBroadEra?: string;
  phaseStatus?: string;
  focus?: string;
}

function readData<T>(rel: string): T {
  return JSON.parse(
    readFileSync(join(process.cwd(), "public", "data", rel), "utf8"),
  ) as T;
}

// Read once per server process — the index is ~7 MB, so cache the parse.
let yearIndexCache: Map<number, YearIndexEntry> | null = null;
function yearIndex(): Map<number, YearIndexEntry> {
  if (yearIndexCache) return yearIndexCache;
  const rows = readData<YearIndexEntry[]>("timeline-index.json");
  yearIndexCache = new Map(rows.map((r) => [r.year, r]));
  return yearIndexCache;
}

let eraIndexCache: Map<string, EraRegistryEntry> | null = null;
function eraIndex(): Map<string, EraRegistryEntry> {
  if (eraIndexCache) return eraIndexCache;
  const doc = readData<{ registry: EraRegistryEntry[] }>("eras/index.json");
  eraIndexCache = new Map(doc.registry.map((r) => [r.id, r]));
  return eraIndexCache;
}

function rangeLabel(start: number, end: number): string {
  const s = start < 0 ? `${Math.abs(start)} BCE` : `${start} CE`;
  const e = end < 0 ? `${Math.abs(end)} BCE` : `${end} CE`;
  return `${s} – ${e}`;
}

/** Metadata for /year/[id] — leads with the year's own headline events. */
export function yearMetadata(id: number): Metadata {
  if (Number.isNaN(id)) return {};
  const entry = yearIndex().get(id);
  const label = entry?.year_label ?? (id < 0 ? `${-id} BCE` : `${id} CE`);
  const canonical = `/year/${id}`;

  if (!entry || !entry.events?.length) {
    const title = `${label} — Chronograph`;
    const description = `${label} in the Chronograph, a source-checked chronicle of 5,226 years of human history researched by AI.`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: "article" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const events = entry.events;
  const lead = events
    .slice(0, 3)
    .map((e) => e.title)
    .join("; ");
  const cats = Array.from(new Set(events.map((e) => e.category)));
  const n = events.length;
  const title = `${label}: ${events[0].title.slice(0, 60)} — Chronograph`;
  const description = `${n} researched event${n === 1 ? "" : "s"} in ${label}${
    entry.source_count ? ` across ${entry.source_count} sources` : ""
  } (${cats.slice(0, 4).join(", ")}). ${lead}.`.slice(0, 300);

  return {
    title,
    description,
    keywords: [label, ...cats, "history", "timeline", "chronology"],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "Chronograph",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Metadata for /era/[id] — the scholarly-era dossier. */
export function eraMetadata(id: string): Metadata {
  const era = eraIndex().get(id);
  const canonical = `/era/${id}`;
  if (!era) {
    const title = "Era not found — Chronograph";
    return {
      title,
      robots: { index: false, follow: true },
      alternates: { canonical },
    };
  }
  const range = rangeLabel(era.start, era.end);
  const title = `${era.label} (${range}) — Chronograph`;
  const description = era.focus
    ? `${era.label}, ${range}: ${era.focus}`.slice(0, 300)
    : `${era.label}, ${range}${
        era.primaryBroadEra ? ` in the ${era.primaryBroadEra} span` : ""
      }: a scholarly-evidence dossier in the Chronograph — verdict, contested claims, appraised papers, and the years that fall within the era.`.slice(
        0,
        300,
      );
  return {
    title,
    description,
    keywords: [era.label, era.primaryBroadEra ?? "", "history", "scholarship"],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "Chronograph",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export { SITE_URL };
