/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * Atlas responsive model.
 *
 * Aligned to Tailwind v4 defaults, plus two atlas-specific semantic
 * breakpoints that drive the mobile collapse.
 *
 *   atlas-collapse (768px)       — above: multi-lane grid; below: single-lane scroll
 *   year-single-column (768px)   — above: two-column with margin notes;
 *                                  below: single column, inline expandable footnotes
 */

export const BP = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
  atlasCollapse: 768,
  yearSingleColumn: 768,
} as const;

export const MQ = {
  atlasMulti: `(min-width: ${BP.atlasCollapse}px)`,
  atlasSingle: `(max-width: ${BP.atlasCollapse - 1}px)`,
  yearTwoColumn: `(min-width: ${BP.yearSingleColumn}px)`,
  yearOneColumn: `(max-width: ${BP.yearSingleColumn - 1}px)`,
} as const;

import { useEffect, useState } from "react";

/**
 * SSR-safe matchMedia hook. Returns false on server; updates on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export function useAtlasLayout(): "multi-lane" | "single-lane" {
  return useMediaQuery(MQ.atlasMulti) ? "multi-lane" : "single-lane";
}

export function useYearLayout(): "two-column" | "one-column" {
  return useMediaQuery(MQ.yearTwoColumn) ? "two-column" : "one-column";
}
