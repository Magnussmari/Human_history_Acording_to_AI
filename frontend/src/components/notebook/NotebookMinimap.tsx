/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * Vertical sticky minimap (VS-Code style) for the notebook timeline. Shows the
 * whole 5,000-year span as era bands, a live position marker, and jump-on-click.
 * UX audit docs/ux-audit-2026-07-16.md: spatial orientation over infinite scroll.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ERAS } from "@/lib/constants";
import type { YearData } from "@/types/history";

interface Props {
  years: YearData[];
  rowHeight: number;
  scrollMargin: number;
}

export function NotebookMinimap({ years, rowHeight, scrollMargin }: Props) {
  const [pos, setPos] = useState(0);
  const total = years.length * rowHeight;

  useEffect(() => {
    const onScroll = () => {
      const span = Math.max(1, total - window.innerHeight);
      setPos(Math.min(1, Math.max(0, (window.scrollY - scrollMargin) / span)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [total, scrollMargin]);

  const bands = useMemo(() => {
    const len = years.length;
    const out: { label: string; top: number; height: number; first: number }[] = [];
    for (const era of ERAS) {
      const first = years.findIndex((y) => y.year <= era.start && y.year >= era.end);
      if (first < 0) continue;
      let last = first;
      for (let i = first; i < years.length && years[i].year >= era.end; i++) last = i;
      out.push({
        label: era.label,
        top: (first / len) * 100,
        height: ((last - first + 1) / len) * 100,
        first,
      });
    }
    return out;
  }, [years]);

  if (years.length < 30) return null;

  const jumpToIndex = (idx: number) =>
    window.scrollTo({ top: scrollMargin + idx * rowHeight - 8, behavior: "smooth" });

  const jumpToY = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const f = (e.clientY - rect.top) / rect.height;
    const span = Math.max(1, total - window.innerHeight);
    window.scrollTo({ top: scrollMargin + f * span, behavior: "smooth" });
  };

  return (
    <nav className="notebook-minimap" aria-label="Timeline eras — jump to a period">
      <div className="notebook-minimap-track" onClick={jumpToY} role="presentation">
        {bands.map((b) => (
          <button
            key={b.label}
            type="button"
            className="notebook-minimap-band"
            style={{ top: `${b.top}%`, height: `${b.height}%` }}
            onClick={(e) => {
              e.stopPropagation();
              jumpToIndex(b.first);
            }}
            aria-label={`Jump to the ${b.label} era`}
          >
            {b.height > 3.5 && <span className="notebook-minimap-label">{b.label}</span>}
          </button>
        ))}
        <div className="notebook-minimap-thumb" style={{ top: `${pos * 100}%` }} />
      </div>
    </nav>
  );
}
