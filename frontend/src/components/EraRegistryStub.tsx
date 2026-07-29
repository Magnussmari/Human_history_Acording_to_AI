/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-29
 */
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Info } from "lucide-react";
import type { EraRegistryEntry } from "@/types/evidence";
import {
  eraKindLabel,
  eraTimelineHref,
  formatEraRange,
} from "@/lib/evidence";

interface EraRegistryStubProps {
  entry: EraRegistryEntry;
}

export function EraRegistryStub({ entry }: EraRegistryStubProps) {
  const tone = entry.tone ?? "neutral";

  return (
    <motion.article
      className="notebook-folio notebook-folio-registry"
      data-tone={tone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/" className="notebook-folio-back">
        <ArrowLeft size={12} /> Back to timeline
      </Link>

      <header className="notebook-folio-hero">
        <div className="notebook-folio-hero-grid">
          <div className="notebook-folio-eyebrow">
            <span className="notebook-stamp">Era</span>
            {entry.kind && (
              <span className="notebook-folio-kind-badge">
                {eraKindLabel(entry.kind)}
              </span>
            )}
            <span className="notebook-folio-ordinal">
              {entry.primaryBroadEra} · {formatEraRange(entry)}
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px, 7vw, 72px)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: "0 0 18px",
              color: "var(--fg)",
            }}
          >
            {entry.label}
          </h1>

          <p className="notebook-folio-registry-status">
            <Clock size={13} aria-hidden="true" />
            Research in progress — no scholarly dossier filed yet.
          </p>
        </div>
      </header>

      {entry.focus && (
        <section className="notebook-folio-era">
          <div className="notebook-folio-era-rule" />
          <div className="notebook-folio-era-body">
            <div className="notebook-folio-era-label">Focus</div>
            <p className="notebook-folio-era-text">{entry.focus}</p>
          </div>
        </section>
      )}

      {entry.careNotes && (
        <section
          className="notebook-folio-care-note"
          aria-labelledby={`care-note-${entry.id}`}
        >
          <div className="notebook-folio-care-note-head">
            <Info size={13} aria-hidden="true" />
            <span id={`care-note-${entry.id}`}>Editorial note</span>
          </div>
          <p>{entry.careNotes}</p>
        </section>
      )}

      <section className="notebook-folio-section">
        <Link href={eraTimelineHref(entry)} className="notebook-folio-timeline-link">
          View years in this span on the timeline
        </Link>
      </section>
    </motion.article>
  );
}
