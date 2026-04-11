"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchManifest, fetchAllYears, filterYears, DEFAULT_FILTERS } from "@/lib/data";
import type { FilterState } from "@/lib/data";
import { ERAS } from "@/lib/constants";
import { ProgressBanner } from "@/components/ProgressBanner";
import { EraNav } from "@/components/EraNav";
import { YearCard } from "@/components/YearCard";
import { SearchCommand } from "@/components/SearchCommand";
import { Filters } from "@/components/Filters";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeEra, setActiveEra] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: years, isLoading } = useQuery({
    queryKey: ["years", manifest?.generated_at],
    queryFn: () => fetchAllYears(manifest!),
    enabled: !!manifest,
  });

  const filteredYears = useMemo(() => {
    if (!years) return [];
    let result = filterYears(years, filters);
    if (activeEra) {
      const era = ERAS.find((e) => e.label === activeEra);
      if (era) {
        result = result.filter((y) => y.year <= era.start && y.year >= era.end);
      }
    }
    return result;
  }, [years, filters, activeEra]);

  const virtualizer = useVirtualizer({
    count: filteredYears.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 10,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter glow-title text-primary mb-4">
          Human History
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every year of recorded civilization. Structured, sourced, machine-readable.
          Researched by Claude Sonnet 4.6 using the ICCRA schema.
        </p>
      </div>

      <div className="mb-8">
        <ProgressBanner />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <SearchCommand years={years ?? []} />
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Filters
          {(filters.categories.length > 0 || filters.certainties.length > 0) && (
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {filters.categories.length + filters.certainties.length}
            </span>
          )}
        </button>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filteredYears.length.toLocaleString()} years
        </span>
      </div>

      {showFilters && (
        <div className="mb-4 rounded-lg border border-border/50 bg-card/50 p-4">
          <Filters filters={filters} onChange={setFilters} />
        </div>
      )}

      <div className="mb-6">
        <EraNav activeEra={activeEra} onSelect={setActiveEra} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : filteredYears.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">No years match your filters.</p>
          <p className="text-sm mt-1">Try broadening your search or clearing filters.</p>
        </div>
      ) : (
        <div ref={parentRef} className="h-[70vh] overflow-auto scrollbar-hide">
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const year = filteredYears[virtualRow.index];
              return (
                <div
                  key={year.year}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-2"
                >
                  <YearCard year={year} index={virtualRow.index} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
