/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, Info } from "lucide-react";
import {
  fetchManifest,
  fetchTimelineIndex,
  filterYears,
  DEFAULT_FILTERS,
} from "@/lib/data";
import { fetchEraIndex } from "@/lib/evidence";
import { mergeMusicEvents } from "@/lib/music-events";
import type { FilterState } from "@/lib/data";
import { ERAS } from "@/lib/constants";
import { IntroCard } from "@/components/IntroCard";
import { NotebookTimeline } from "@/components/notebook/NotebookTimeline";
import { SearchCommand } from "@/components/SearchCommand";
import { FilterPanel } from "@/components/FilterPanel";
import { ScholarlyEraPillRow } from "@/components/ScholarlyEraPillRow";
import { EraRibbon } from "@/components/EraRibbon";

const INTRO_STORAGE_KEY = "chronograph-intro-dismissed";

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeEra, setActiveEra] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);

  useEffect(() => {
    // Restore dismissed-intro state from localStorage after mount. Hydration-safe
    // (localStorage is unavailable during SSR), so this external sync belongs in
    // an effect, not a useState initializer.
    try {
      if (localStorage.getItem(INTRO_STORAGE_KEY) === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional localStorage restore, see above
        setIntroOpen(false);
      }
    } catch {
      /* noop */
    }
  }, []);

  const dismissIntro = () => {
    setIntroOpen(false);
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
  };

  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: years, isLoading } = useQuery({
    queryKey: ["timeline-index"],
    queryFn: fetchTimelineIndex,
    select: mergeMusicEvents,
    staleTime: Infinity,
  });

  const { data: eraIndex } = useQuery({
    queryKey: ["era-index"],
    queryFn: fetchEraIndex,
  });

  const filteredYears = useMemo(() => {
    if (!years) return [];
    let result = filterYears(years, filters);
    if (activeEra) {
      const era = ERAS.find((e) => e.label === activeEra);
      if (era) {
        result = result.filter(
          (y) => y.year <= era.start && y.year >= era.end,
        );
      }
    }
    // When a category filter is active, promote a matching event to the headline
    // slot so the row reflects the filter (e.g. Music & Opera surfaces the music
    // event, not the year's top political headline). All events still render.
    if (filters.categories.length > 0) {
      const cats = new Set(filters.categories);
      result = result.map((y) => {
        const idx = y.events.findIndex((e) => cats.has(e.category));
        if (idx <= 0) return y;
        const events = [...y.events];
        const [match] = events.splice(idx, 1);
        events.unshift(match);
        return { ...y, events };
      });
    }
    return result;
  }, [years, filters, activeEra]);

  const activeFilterCount =
    filters.categories.length +
    filters.certainties.length +
    (filters.region ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-10">
        {introOpen && manifest && (
          <IntroCard
            manifest={manifest}
            onDismiss={dismissIntro}
          />
        )}

        {!introOpen && (
          <button
            type="button"
            onClick={() => setIntroOpen(true)}
            className="inline-flex items-center gap-2 text-sm mb-6"
            style={{
              color: "var(--fg-mute)",
              fontFamily: "var(--font-sans)",
              border: "1px solid var(--rule)",
              background: "transparent",
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            <Info size={13} /> What is this?
          </button>
        )}

        <header className="notebook-section-head mb-6">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--notebook-text-meta)",
              color: "var(--stamp)",
              letterSpacing: "0.14em",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            § Timeline
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "var(--fg)",
              margin: "4px 0 6px",
            }}
          >
            The folio, chronologically
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: "var(--fg-mute)",
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            {filteredYears.length.toLocaleString()} entr
            {filteredYears.length === 1 ? "y" : "ies"} displayed
            {activeEra && ` · ${activeEra} era`}
            {filters.search && ` · matching "${filters.search}"`}
          </p>
          <span
            style={{
              display: "block",
              height: 1,
              background: "var(--rule)",
              marginTop: 18,
            }}
          />
        </header>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <SearchCommand years={years ?? []} />

          <motion.button
            onClick={() => setShowFilters(true)}
            type="button"
            className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm relative"
            style={{
              background: "var(--card)",
              border: "1px solid var(--rule)",
              color: "var(--fg-mute)",
              fontFamily: "var(--font-sans)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="inline-flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: "var(--stamp)",
                  color: "var(--bg)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </motion.button>
        </div>

        <EraRibbon
          activeEra={activeEra}
          onSelect={setActiveEra}
          years={years}
        />

        {eraIndex && (
          <ScholarlyEraPillRow index={eraIndex} activeBroadEra={activeEra} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <NotebookTimeline
              years={filteredYears}
              isLoading={isLoading}
            />
          </motion.div>
        </AnimatePresence>
      </section>

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={setFilters}
      />
    </motion.div>
  );
}

