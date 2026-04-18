/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { YearData } from "@/types/history";
import { getEraForYear } from "@/lib/constants";
import { NotebookYearRow } from "./NotebookYearRow";
import "./notebook-timeline.css";

interface NotebookTimelineProps {
  years: YearData[];
  isLoading: boolean;
}

function groupKeyForYear(y: number): string {
  const chunk = Math.floor(y / 100) * 100;
  return `${getEraForYear(y).label}::${chunk}`;
}

function groupLabelForYear(y: number): string {
  const era = getEraForYear(y);
  const chunk = Math.floor(y / 100) * 100;
  const sign = chunk < 0 ? "BCE" : "CE";
  return `${era.label} · ${Math.abs(chunk)} ${sign}`;
}

// Uniform row height. The group-rule label renders inside a reserved
// 40px "bookmark" lane at the top of every row — blank when the group
// didn't change, labelled when it did — so every wrapper is the same
// height and the virtualizer's math stays simple.
const ROW_HEIGHT = 168;

export function NotebookTimeline({ years, isLoading }: NotebookTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setScrollMargin(rect.top + window.scrollY);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: years.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    scrollMargin,
  });

  if (isLoading) {
    return (
      <div className="notebook-timeline-skeleton">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="notebook-timeline-skeleton-row"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="notebook-timeline-empty">
        <p className="notebook-timeline-empty-head">No entries match.</p>
        <p className="notebook-timeline-empty-body">
          Broaden the search or clear the filter chips to bring more years
          back into view.
        </p>
      </div>
    );
  }

  return (
    <div className="notebook-timeline">
      <div ref={containerRef}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((vr) => {
            const year = years[vr.index];
            const prev = years[vr.index - 1];
            const groupChanged =
              !prev || groupKeyForYear(prev.year) !== groupKeyForYear(year.year);

            return (
              <div
                key={year.year}
                data-index={vr.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: ROW_HEIGHT,
                  transform: `translateY(${
                    vr.start - virtualizer.options.scrollMargin
                  }px)`,
                }}
              >
                <div className="notebook-timeline-bookmark">
                  {groupChanged && (
                    <>
                      <span className="notebook-timeline-rule-label">
                        {groupLabelForYear(year.year)}
                      </span>
                      <span className="notebook-timeline-rule-line" />
                    </>
                  )}
                </div>
                <NotebookYearRow year={year} index={vr.index} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
