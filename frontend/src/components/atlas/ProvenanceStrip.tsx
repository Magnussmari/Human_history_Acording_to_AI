/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * ProvenanceStrip — transparency made ambient.
 *
 * Every page carries its own receipts. Events, sources, contested claims,
 * and last-researched date render as a flat editorial strip. Tabular
 * figures, small caps, Plex Mono. No icons, no decoration.
 *
 * Not yet mounted in the layout — Phase 1 only establishes the component.
 * Mounts in Phase 2 (Methodology) as the first live surface that tests
 * the voice + typography decisions.
 */

"use client";

import type { CSSProperties } from "react";

export interface ProvenanceStripProps {
  events?: number;
  sources?: number;
  contested?: number;
  /** ISO date string — when the underlying research was produced. */
  researchedAt?: string;
  /** Optional page label, e.g. "Classical Era · 500 BCE – 476 CE". */
  scope?: string;
  /** Position variant. "inline" for editorial footer, "fixed" for sticky bottom. */
  position?: "inline" | "fixed";
  className?: string;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNumber(n?: number): string {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("en-GB");
}

export function ProvenanceStrip({
  events,
  sources,
  contested,
  researchedAt,
  scope,
  position = "inline",
  className,
}: ProvenanceStripProps) {
  const style: CSSProperties =
    position === "fixed"
      ? {
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          background: "color-mix(in oklab, var(--atlas-parchment) 94%, transparent)",
          borderTop: "1px solid var(--atlas-parchment-edge)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }
      : {
          borderTop: "1px solid var(--atlas-parchment-edge)",
        };

  return (
    <aside
      role="contentinfo"
      aria-label="Page provenance"
      className={className}
      style={{
        ...style,
        color: "var(--atlas-ink-mute)",
        fontFamily: "var(--atlas-font-mono)",
        fontSize: "var(--atlas-text-micro)",
        letterSpacing: "var(--atlas-tracking-mono)",
        padding: "var(--atlas-space-3) var(--atlas-space-5)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--atlas-col-reading)",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: "var(--atlas-space-4)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {scope ? (
          <span
            className="atlas-eyebrow"
            style={{ color: "var(--atlas-ink-soft)" }}
          >
            {scope}
          </span>
        ) : null}

        <Figure label="events" value={formatNumber(events)} />
        <Figure label="sources" value={formatNumber(sources)} />
        <Figure
          label="contested"
          value={formatNumber(contested)}
          tone={contested && contested > 0 ? "oxblood" : undefined}
        />
        <Figure label="researched" value={formatDate(researchedAt)} />
      </div>
    </aside>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "oxblood";
}) {
  return (
    <span style={{ display: "inline-flex", gap: "var(--atlas-space-2)", alignItems: "baseline" }}>
      <span
        style={{
          color: tone === "oxblood" ? "var(--atlas-oxblood)" : "var(--atlas-ink)",
          fontWeight: 500,
        }}
      >
        {value}
      </span>
      <span style={{ color: "var(--atlas-ink-ghost)" }}>{label}</span>
    </span>
  );
}
