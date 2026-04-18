/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * Monument — a single large figure, rendered in Fraunces display with
 * a Plex Mono small-caps label. Used for the methodology hero and
 * anywhere we want a number to carry editorial weight.
 *
 *   <MonumentRow>
 *     <Monument value="5,226" label="Years" note="2025 CE → 3200 BCE" />
 *     <Monument value="17,991" label="Events" />
 *     <Monument value="$15.68" label="Total cost" tone="mute" />
 *   </MonumentRow>
 *
 * Tone: default | mute (soft ink) | oxblood (exception)
 */

import type { ReactNode } from "react";

export type MonumentTone = "default" | "mute" | "oxblood";

export interface MonumentProps {
  value: ReactNode;
  label: string;
  note?: string;
  tone?: MonumentTone;
}

function toneColor(tone: MonumentTone): string {
  switch (tone) {
    case "mute":
      return "var(--atlas-ink-soft)";
    case "oxblood":
      return "var(--atlas-oxblood)";
    case "default":
    default:
      return "var(--atlas-ink)";
  }
}

export function Monument({ value, label, note, tone = "default" }: MonumentProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--atlas-space-2)",
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--atlas-font-display)",
          fontSize: "clamp(2.5rem, 5.5vw, var(--atlas-text-monument))",
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: "var(--atlas-tracking-display)",
          color: toneColor(tone),
          fontVariantNumeric: "tabular-nums",
          fontVariationSettings: "'SOFT' 20, 'WONK' 0",
        }}
      >
        {value}
      </span>
      <span
        className="atlas-eyebrow"
        style={{ color: "var(--atlas-ink-mute)" }}
      >
        {label}
      </span>
      {note ? (
        <span
          style={{
            fontFamily: "var(--atlas-font-mono)",
            fontSize: "var(--atlas-text-micro)",
            color: "var(--atlas-ink-ghost)",
            letterSpacing: "var(--atlas-tracking-mono)",
          }}
        >
          {note}
        </span>
      ) : null}
    </div>
  );
}

export function MonumentRow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
        gap: "var(--atlas-space-6)",
        margin: "var(--atlas-space-6) 0 var(--atlas-space-7)",
      }}
    >
      {children}
    </div>
  );
}
