/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * Atlas motion policy — transparency beats spectacle.
 *
 *   1. Motion fires ONLY on user intent (click, key, hover).
 *   2. No autoplay. No scroll-triggered reveals. No parallax. No shimmer.
 *   3. Reduced-motion users get instant state changes.
 *   4. Four durations, one easing. Use tokens; never inline numbers.
 *
 * Consumers: import {DURATION, EASING, transition} from "@/design/motion"
 */

export const DURATION = {
  micro: 0.12,    // hover, focus ring, tooltip reveal
  short: 0.2,     // drawer open/close, inline expand, chevron rotate
  medium: 0.32,   // page → page, pinned era slide-in
} as const;

export const EASING = {
  editorial: [0.22, 1, 0.36, 1] as const, // soft ease-out, newspaper feel
  linear: "linear" as const,
} as const;

/**
 * Canonical Motion transition. Use this rather than hand-rolling.
 *   transition={transition("short")}
 */
export function transition(speed: keyof typeof DURATION = "short") {
  return {
    duration: DURATION[speed],
    ease: EASING.editorial,
  };
}

/**
 * Intent types — a component calling Motion must name its intent.
 * This enforces discipline: if you can't name the user action that
 * triggered the motion, the motion shouldn't exist.
 */
export type MotionIntent =
  | "open-drawer"
  | "close-drawer"
  | "pin"
  | "unpin"
  | "expand-inline"
  | "collapse-inline"
  | "reveal-filter"
  | "reveal-search"
  | "navigate"
  | "focus";

/**
 * Hook to respect prefers-reduced-motion. Components with motion
 * should branch on this and return the final state directly when true.
 */
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Variants library — the only variants in the codebase. Anything else
 * should be reviewed as a motion-policy exception.
 */
export const variants = {
  drawer: {
    closed: { x: "100%" },
    open: { x: 0, transition: { duration: DURATION.medium, ease: EASING.editorial } },
  },
  inlineExpand: {
    collapsed: { height: 0, opacity: 0 },
    expanded: {
      height: "auto",
      opacity: 1,
      transition: { duration: DURATION.short, ease: EASING.editorial },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: DURATION.short, ease: EASING.editorial },
    },
  },
} as const;
