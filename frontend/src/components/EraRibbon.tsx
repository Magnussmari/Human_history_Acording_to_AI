/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * Proportional era ribbon: the 10 broad eras as a single horizontal band whose
 * segment widths follow their real time-span across the 5,226-year record.
 * Click a band to filter the timeline (click the active one to clear). It reads
 * as a map of deep time — the recent eras are slivers, the Bronze Age vast —
 * and doubles as spatial orientation. Replaces the old wrapping pill row.
 *
 * a11y: a role="toolbar" with roving tabindex (arrow keys move between eras),
 * aria-pressed per segment, and a live caption so touch/SR users get feedback.
 */
"use client";

import { useMemo, useRef, useState } from "react";
import { ERAS, formatYear } from "@/lib/constants";
import type { YearData } from "@/types/history";
import "./era-ribbon.css";

const TOTAL_START = 2025;
const TOTAL_END = -3200;
const TOTAL_SPAN = TOTAL_START - TOTAL_END; // 5225

interface Props {
  activeEra: string | null;
  onSelect: (era: string | null) => void;
  years?: YearData[];
}

export function EraRibbon({ activeEra, onSelect, years }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const segments = useMemo(() => {
    const counts = new Map<string, number>();
    if (years) {
      for (const era of ERAS) {
        let n = 0;
        for (const y of years) {
          if (y.year <= era.start && y.year >= era.end) n += y.events?.length ?? 0;
        }
        counts.set(era.label, n);
      }
    }
    return ERAS.map((era) => ({
      ...era,
      pct: ((era.start - era.end) / TOTAL_SPAN) * 100,
      count: counts.get(era.label),
      range: `${formatYear(era.end)} – ${formatYear(era.start)}`,
    }));
  }, [years]);

  const focusIdx = activeEra
    ? Math.max(0, segments.findIndex((s) => s.label === activeEra))
    : 0;

  const onKeyDown = (i: number) => (e: React.KeyboardEvent) => {
    let next = i;
    if (e.key === "ArrowRight") next = Math.min(segments.length - 1, i + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = segments.length - 1;
    else return;
    e.preventDefault();
    btnRefs.current[next]?.focus();
  };

  const shown = segments.find((s) => s.label === (hovered ?? activeEra));

  return (
    <div className="era-ribbon-wrap">
      <div className="era-ribbon-scale" aria-hidden="true">
        <span>{formatYear(TOTAL_END)}</span>
        <span className="era-ribbon-scale-mid">
          {TOTAL_SPAN.toLocaleString()} years · band width follows time span
        </span>
        <span>{formatYear(TOTAL_START)}</span>
      </div>

      <div
        className="era-ribbon"
        role="toolbar"
        aria-label="Filter the timeline by era"
        aria-orientation="horizontal"
      >
        {segments.map((s, i) => {
          const active = activeEra === s.label;
          const label =
            `${s.label} · ${s.range}` +
            (s.count ? ` · ${s.count.toLocaleString()} events` : "");
          return (
            <button
              key={s.label}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              className={
                "era-ribbon-seg" +
                (active ? " active" : "") +
                (activeEra && !active ? " dim" : "")
              }
              style={{ flexGrow: s.pct }}
              onClick={() => onSelect(active ? null : s.label)}
              onMouseEnter={() => setHovered(s.label)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.label)}
              onBlur={() => setHovered(null)}
              onKeyDown={onKeyDown(i)}
              aria-pressed={active}
              aria-label={label}
              tabIndex={i === focusIdx ? 0 : -1}
            >
              {/* Only the segments wide enough to hold a word get an inline
                  label; the compressed recent eras stay clean bands and reveal
                  their name in the caption on hover / tap. */}
              {s.pct >= 6 && (
                <span className="era-ribbon-seg-label">{s.label}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="era-ribbon-caption" aria-live="polite">
        {shown ? (
          <>
            <span className="era-ribbon-caption-name">{shown.label}</span>
            <span className="era-ribbon-caption-range">{shown.range}</span>
            {shown.count ? (
              <span className="era-ribbon-caption-count">
                {shown.count.toLocaleString()} events
              </span>
            ) : null}
            {activeEra ? (
              <button
                type="button"
                className="era-ribbon-clear"
                onClick={() => onSelect(null)}
              >
                Clear ✕
              </button>
            ) : null}
          </>
        ) : (
          <span className="era-ribbon-hint">
            Click an era to filter · all {TOTAL_SPAN.toLocaleString()} years shown
          </span>
        )}
      </div>
    </div>
  );
}
