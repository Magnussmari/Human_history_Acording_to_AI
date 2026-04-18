/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * MarginNote — editorial margin note for caveats, sources, disconfirming
 * evidence, and footnotes.
 *
 * Desktop (≥768px): renders in a right-hand margin column, vertically
 * adjacent to the text it qualifies.
 * Mobile (<768px): collapses to an inline expandable footnote with a
 * left rule. Label becomes the toggle.
 *
 * Tone:
 *   "neutral"   — standard source / cross-ref
 *   "contested" — oxblood rule, used for disconfirming evidence
 *   "caveat"    — italic label, soft ink, used for schema / epistemology notes
 *
 * The component is purely presentational. Motion fires only on user
 * intent (mobile expand/collapse).
 */

"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { transition, useReducedMotion } from "@/design/motion";
import { useYearLayout } from "@/design/breakpoints";

export type MarginTone = "neutral" | "contested" | "caveat";

export interface MarginNoteProps {
  label: string;
  tone?: MarginTone;
  children: ReactNode;
}

export function MarginNote({ label, tone = "neutral", children }: MarginNoteProps) {
  const layout = useYearLayout();
  return layout === "two-column" ? (
    <DesktopMarginNote label={label} tone={tone}>
      {children}
    </DesktopMarginNote>
  ) : (
    <MobileMarginNote label={label} tone={tone}>
      {children}
    </MobileMarginNote>
  );
}

function toneStyles(tone: MarginTone) {
  switch (tone) {
    case "contested":
      return {
        ruleColor: "var(--atlas-oxblood)",
        labelColor: "var(--atlas-oxblood)",
        labelStyle: "normal" as const,
      };
    case "caveat":
      return {
        ruleColor: "var(--atlas-parchment-edge)",
        labelColor: "var(--atlas-ink-mute)",
        labelStyle: "italic" as const,
      };
    case "neutral":
    default:
      return {
        ruleColor: "var(--atlas-parchment-edge)",
        labelColor: "var(--atlas-ink-mute)",
        labelStyle: "normal" as const,
      };
  }
}

function DesktopMarginNote({ label, tone, children }: MarginNoteProps) {
  const { ruleColor, labelColor, labelStyle } = toneStyles(tone ?? "neutral");
  return (
    <aside
      style={{
        float: "right",
        clear: "right",
        width: "var(--atlas-col-margin)",
        marginRight: "calc(-1 * var(--atlas-col-margin) - var(--atlas-space-5))",
        marginLeft: "var(--atlas-space-5)",
        marginTop: "0.25em",
        paddingLeft: "var(--atlas-space-3)",
        borderLeft: `2px solid ${ruleColor}`,
        fontFamily: "var(--atlas-font-sans)",
        fontSize: "var(--atlas-text-small)",
        lineHeight: "var(--atlas-leading-normal)",
        color: "var(--atlas-ink-soft)",
      }}
    >
      <p
        className="atlas-eyebrow"
        style={{
          color: labelColor,
          fontStyle: labelStyle,
          marginBottom: "var(--atlas-space-2)",
        }}
      >
        {label}
      </p>
      <div>{children}</div>
    </aside>
  );
}

function MobileMarginNote({ label, tone, children }: MarginNoteProps) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const { ruleColor, labelColor, labelStyle } = toneStyles(tone ?? "neutral");

  return (
    <div
      style={{
        margin: "var(--atlas-space-4) 0",
        borderLeft: `2px solid ${ruleColor}`,
        paddingLeft: "var(--atlas-space-3)",
        fontFamily: "var(--atlas-font-sans)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "baseline",
          gap: "var(--atlas-space-2)",
          color: labelColor,
          fontStyle: labelStyle,
          fontSize: "var(--atlas-text-micro)",
          letterSpacing: "var(--atlas-tracking-eyebrow)",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--atlas-ink-ghost)" }}>{open ? "–" : "+"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={transition("short")}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                paddingTop: "var(--atlas-space-2)",
                fontSize: "var(--atlas-text-small)",
                lineHeight: "var(--atlas-leading-normal)",
                color: "var(--atlas-ink-soft)",
              }}
            >
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
