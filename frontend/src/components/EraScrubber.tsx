/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-29
 *
 * Era scrubber — the temporal minimap the UX brainstorm asked for
 * (docs/ux-brainstorm-parallel-timelines-2026-07-29.md, recommendation 1).
 *
 * Three things in one strip, all sharing a single time axis:
 *   1. a density histogram of events across the whole 5,225-year record, so you
 *      can see at a glance where the corpus is thick and where it is thin
 *   2. the scholarly eras plotted ON that axis, greedily packed into lanes.
 *      Because thematic/crisis/regional eras overlap by design, the packing is
 *      what makes the overlap legible — and it is the first taste of the
 *      swimlane layout (recommendation 2) without committing to it.
 *   3. drag-to-select a year span, which drives the same yearRange filter the
 *      scholarly-era pills already use
 *
 * Colour comes from the registry `tone` field, never a hardcoded id list, so a
 * sombre era (atrocity, plague, war) is muted by data.
 *
 * a11y: every era band is a real keyboard-reachable button with an aria-label,
 * the histogram is aria-hidden decoration, and a live region announces the
 * COMMITTED span (not the in-progress drag, which would fire on every
 * pointermove). Note the honest limit: keyboard users can select any of the 43
 * era presets but cannot yet drag an arbitrary span — a numeric from/to control
 * is the outstanding gap, tracked in upgrade-plan-july26.md.
 */
"use client";

import { useMemo, useRef, useState } from "react";
import { formatYear } from "@/lib/constants";
import type { EraIndex, EraRegistryEntry } from "@/types/evidence";
import type { YearData } from "@/types/history";
import "./era-scrubber.css";

const AXIS_START = -3200; // left edge
const AXIS_END = 2025; // right edge
const AXIS_SPAN = AXIS_END - AXIS_START;
const BUCKETS = 180;
// Must be >= the registry's true maximum concurrency or bands stack invisibly.
// At 43 eras that peak is 6 (around the 1780–1888 abolition window); a cap of 4
// silently painted 5 eras on top of already-occupied lanes and corrupted the
// packing for everything after them. 8 leaves headroom for the next expansion.
const MAX_LANES = 8;

interface Props {
  index: EraIndex | null | undefined;
  years?: YearData[];
  yearRange: { min: number; max: number } | null;
  onRangeSelect: (range: { min: number; max: number } | null) => void;
}

const pctOf = (year: number) => ((year - AXIS_START) / AXIS_SPAN) * 100;
const yearAt = (frac: number) =>
  Math.round(AXIS_START + Math.min(1, Math.max(0, frac)) * AXIS_SPAN);

/** Greedy lane packing so overlapping eras stay individually visible. */
function packLanes(eras: EraRegistryEntry[]) {
  const laneEnds: number[] = [];
  return eras
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((era) => {
      let lane = laneEnds.findIndex((end) => era.start > end);
      if (lane === -1) {
        if (laneEnds.length < MAX_LANES) {
          lane = laneEnds.length;
        } else {
          // Past the cap, drop into the lane that frees up soonest so the
          // unavoidable overlap is as small as possible — never blindly lane 0.
          lane = laneEnds.indexOf(Math.min(...laneEnds));
        }
      }
      laneEnds[lane] = era.end;
      return { era, lane };
    });
}

export function EraScrubber({ index, years, yearRange, onRangeSelect }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);

  const density = useMemo(() => {
    const buckets = new Array(BUCKETS).fill(0);
    if (years) {
      for (const y of years) {
        const i = Math.min(
          BUCKETS - 1,
          Math.max(0, Math.floor(((y.year - AXIS_START) / AXIS_SPAN) * BUCKETS)),
        );
        buckets[i] += y.events?.length ?? 0;
      }
    }
    const peak = Math.max(1, ...buckets);
    // Linear normalisation makes this useless: the modern buckets hold an order
    // of magnitude more events than antiquity, so 90% of the record renders as a
    // flat line. sqrt keeps the modern peak dominant while letting Bronze-Age
    // structure actually read — the point of the strip is comparing density.
    return buckets.map((n) => ({ n, h: Math.sqrt(n / peak) * 100 }));
  }, [years]);

  const packed = useMemo(
    () => (index ? packLanes(index.registry) : []),
    [index],
  );
  const laneCount = Math.min(
    MAX_LANES,
    Math.max(1, ...packed.map((p) => p.lane + 1)),
  );

  const fracFromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return (clientX - r.left) / r.width;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const f = fracFromEvent(e.clientX);
    setDrag({ from: f, to: f });
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, to: fracFromEvent(e.clientX) });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag) return;
    trackRef.current?.releasePointerCapture?.(e.pointerId);
    const { from, to } = drag;
    setDrag(null);
    // A tap (rather than a drag) clears the span — cheaper than hunting for the
    // clear button, and matches the ribbon's click-active-to-clear behaviour.
    if (Math.abs(to - from) < 0.008) {
      onRangeSelect(null);
      return;
    }
    const a = yearAt(Math.min(from, to));
    const b = yearAt(Math.max(from, to));
    onRangeSelect({ min: a, max: b });
  };

  // Live window: the in-progress drag if any, else the committed range.
  const window_ = drag
    ? { min: yearAt(Math.min(drag.from, drag.to)), max: yearAt(Math.max(drag.from, drag.to)) }
    : yearRange;

  const caption = window_
    ? `${formatYear(window_.min)} – ${formatYear(window_.max)}`
    : null;

  return (
    <div className="era-scrubber-wrap">
      <div className="era-scrubber-scale">
        <span>{formatYear(AXIS_START)}</span>
        <span className="era-scrubber-scale-mid">
          event density · drag to select a span
        </span>
        <span>{formatYear(AXIS_END)}</span>
      </div>

      <div
        ref={trackRef}
        className="era-scrubber-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="era-scrubber-density" aria-hidden="true">
          {density.map((b, i) => (
            <span
              key={i}
              className="era-scrubber-bar"
              style={{ height: `${Math.max(b.h, b.n > 0 ? 3 : 0)}%` }}
            />
          ))}
        </div>

        {window_ && (
          <div
            className="era-scrubber-window"
            aria-hidden="true"
            style={{
              left: `${pctOf(window_.min)}%`,
              width: `${Math.max(0.4, pctOf(window_.max) - pctOf(window_.min))}%`,
            }}
          />
        )}

        <div
          className="era-scrubber-lanes"
          style={{ height: laneCount * 9 + (laneCount - 1) * 2 }}
        >
          {packed.map(({ era, lane }) => {
            const left = pctOf(era.start);
            const width = Math.max(0.5, pctOf(era.end) - left);
            const active =
              yearRange != null &&
              yearRange.min === era.start &&
              yearRange.max === era.end;
            return (
              <button
                key={era.id}
                type="button"
                className="era-scrubber-band"
                data-tone={era.tone ?? "neutral"}
                data-active={active || undefined}
                style={{ left: `${left}%`, width: `${width}%`, top: lane * 11 }}
                aria-label={`${era.label}, ${formatYear(era.start)} to ${formatYear(era.end)}${
                  active ? ", selected" : ""
                }`}
                aria-pressed={active}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRangeSelect(
                    active ? null : { min: era.start, max: era.end },
                  );
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="era-scrubber-foot">
        {/* The visible caption tracks the in-progress drag, but announcing that
            would fire on every pointermove. The live region below announces the
            COMMITTED span only. */}
        <span className="era-scrubber-caption">
          {caption ? `Span: ${caption}` : "Full record · no span selected"}
        </span>
        <span className="sr-only" aria-live="polite">
          {yearRange
            ? `Span selected: ${formatYear(yearRange.min)} to ${formatYear(yearRange.max)}`
            : "No span selected. Showing the full record."}
        </span>
        {yearRange && (
          <button
            type="button"
            className="era-scrubber-clear"
            onClick={() => onRangeSelect(null)}
          >
            Clear span
          </button>
        )}
      </div>
    </div>
  );
}
