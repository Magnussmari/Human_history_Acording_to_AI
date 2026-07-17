/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { YearData, HistoryEvent } from "@/types/history";
import { getEraForYear, safeCategoryConfig, formatYear } from "@/lib/constants";
import { musicThreadNeighbours } from "@/lib/music-events";
import { ScholarlyEraCard } from "@/components/ScholarlyEraCard";
import { GlassMarginalia } from "./GlassMarginalia";
import "./notebook-folio.css";

interface NotebookYearFolioProps {
  year: YearData;
}

const CERTAINTY_RANK: Record<string, number> = {
  legendary: 1,
  traditional: 2,
  approximate: 2,
  probable: 3,
  confirmed: 4,
};

const RELATION_LABELS: Record<string, string> = {
  caused_by: "caused by",
  led_to: "led to",
  contemporary_with: "contemporary with",
  contradicts: "contradicts",
  part_of: "part of",
};

function yearOrdinal(y: number, total: number): string {
  const ordinal = y + 3201; // corpus oldest year is ~-3200
  return `${String(ordinal).padStart(4, "0")} / ${total.toLocaleString()}`;
}

/** Centre a folio entry in view and flash it — the "you landed here" cue for a
 *  followed thread. Honours prefers-reduced-motion for both scroll and flash. */
function scrollToEntry(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  // Move focus to the landed entry so keyboard / screen-reader users arrive
  // there too, not just sighted ones. tabindex=-1 makes it programmatically
  // focusable without adding it to the tab order; preventScroll avoids fighting
  // the smooth scroll above.
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  el.classList.add("notebook-folio-entry-flash");
  window.setTimeout(() => el.classList.remove("notebook-folio-entry-flash"), 1600);
}

export function NotebookYearFolio({ year }: NotebookYearFolioProps) {
  const era = getEraForYear(year.year);
  const totalSources = year.events.reduce((a, e) => a + e.sources.length, 0);

  // When arriving via a "follow the thread" link (/year/N#music-…), the folio
  // is client-rendered after data loads, so the browser's native hash scroll
  // has nothing to target yet. Once this year's entries are in the DOM, bring
  // the linked entry into view and flash it, so the thread keeps the reader's
  // place instead of dropping them at the top of a dense year.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    let raf1 = 0;
    let raf2 = 0;
    // Defer past the router's own post-navigation scroll and the final layout
    // pass (two frames) so our scroll isn't overridden and the target's
    // position is settled before we centre it. (Same-year hops don't remount
    // and are handled by the thread link's onClick instead — see MusicThread.)
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => scrollToEntry(hash));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [year.year]);

  return (
    <article className="notebook-folio">
      <Link href="/" className="notebook-folio-back">
        ← Back to timeline
      </Link>

      <motion.header
        className="notebook-folio-hero"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="notebook-folio-hero-grid">
          <div className="notebook-folio-eyebrow">
            <span className="notebook-stamp">Folio</span>
            <span className="notebook-folio-ordinal">
              Vol. I · Entry {yearOrdinal(year.year, 5226)}
            </span>
          </div>

          <h1 className="notebook-folio-title">
            <span className="notebook-folio-year-num">
              {String(Math.abs(year.year))}
            </span>
            <span className="notebook-folio-year-era">
              {year.year < 0 ? "BCE" : "CE"}
            </span>
          </h1>

          <div className="notebook-folio-hero-meta">
            <span className="notebook-folio-hero-meta-era">{era.label}</span>
            <span className="notebook-folio-dot">·</span>
            <span>{year.events.length} events</span>
            <span className="notebook-folio-dot">·</span>
            <span className="capitalize">{year.documentation_level} documentation</span>
            <span className="notebook-folio-dot">·</span>
            <span>{totalSources} cited sources</span>
          </div>
        </div>

        <aside className="notebook-folio-sidenote">
          <div className="notebook-folio-sidenote-label">Editor&apos;s note</div>
          <p>
            Year-by-year structured records generated by Claude Sonnet under
            the ICCRA schema. Every event carries a certainty level and the
            contemporary-vs-later mix of its sources. Read with the same
            scepticism you would bring to any secondary source.
          </p>
        </aside>
      </motion.header>

      <section className="notebook-folio-era">
        <div className="notebook-folio-era-rule" />
        <div className="notebook-folio-era-body">
          <div className="notebook-folio-era-label">Era context</div>
          <p className="notebook-folio-era-text">{year.era_context}</p>

          {year.geographic_coverage_gaps.length > 0 && (
            <div className="notebook-folio-gaps">
              <span className="notebook-folio-gap-label">Coverage gaps ·</span>
              {year.geographic_coverage_gaps.map((g, i) => (
                <span key={i} className="notebook-folio-gap-chip">{g}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="notebook-folio-scholar">
        <ScholarlyEraCard year={year.year} />
      </section>

      <section className="notebook-folio-section">
        <header className="notebook-folio-section-head">
          <span className="notebook-folio-section-num">§ 01</span>
          <h2>Events</h2>
          <span className="notebook-folio-section-trail">
            — chronological, as attested
          </span>
        </header>

        <ol className="notebook-folio-entries">
          {year.events.map((ev, i) => (
            <NotebookFolioEntry key={ev.id} ev={ev} idx={i} currentYear={year.year} />
          ))}
        </ol>
      </section>

      {year.disconfirming_evidence && (
        <section className="notebook-folio-section notebook-folio-dissent-block">
          <header className="notebook-folio-section-head">
            <span className="notebook-folio-section-num">§ 02</span>
            <h2>Disconfirming evidence</h2>
            <span className="notebook-folio-section-trail">
              — where this account breaks down
            </span>
          </header>
          <div className="notebook-folio-dissent-body">
            <div className="notebook-folio-dissent-mark">¶</div>
            <p>{year.disconfirming_evidence}</p>
          </div>
        </section>
      )}

      {year.historiographic_note && (
        <section className="notebook-folio-section notebook-folio-dissent-block">
          <header className="notebook-folio-section-head">
            <span className="notebook-folio-section-num">§ 03</span>
            <h2>Historiographic note</h2>
            <span className="notebook-folio-section-trail">
              — on the shape of the record itself
            </span>
          </header>
          <div className="notebook-folio-dissent-body">
            <div className="notebook-folio-dissent-mark">¶</div>
            <p>{year.historiographic_note}</p>
          </div>
        </section>
      )}

      {year.graph_edges.length > 0 && (
        <section className="notebook-folio-section notebook-folio-edges-block">
          <header className="notebook-folio-section-head">
            <span className="notebook-folio-section-num">§ 04</span>
            <h2>Cross-year connections</h2>
            <span className="notebook-folio-section-trail">
              — graph edges in the corpus
            </span>
          </header>
          <ul className="notebook-folio-edges">
            {year.graph_edges.map((edge, i) => {
              const fromYear = Number.parseInt(edge.from.split("_")[0]?.split("-")[0] ?? "", 10);
              const toYear = Number.parseInt(edge.to.split("_")[0]?.split("-")[0] ?? "", 10);
              const relation = RELATION_LABELS[edge.relation] ?? edge.relation.replace(/_/g, " ");
              return (
                <li key={i} className="notebook-folio-edge">
                  {Number.isFinite(fromYear) && !Number.isNaN(fromYear) ? (
                    <Link href={`/year/${fromYear}`} className="notebook-folio-edge-id">
                      {edge.from}
                    </Link>
                  ) : (
                    <span className="notebook-folio-edge-id">{edge.from}</span>
                  )}
                  <span className="notebook-folio-edge-rel">{relation}</span>
                  {Number.isFinite(toYear) && !Number.isNaN(toYear) ? (
                    <Link href={`/year/${toYear}`} className="notebook-folio-edge-id">
                      {edge.to}
                    </Link>
                  ) : (
                    <span className="notebook-folio-edge-id">{edge.to}</span>
                  )}
                  {edge.note && (
                    <span className="notebook-folio-edge-note">{edge.note}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="notebook-folio-footer">
        <div className="notebook-folio-footer-rule" />
        <div className="notebook-folio-footer-row">
          <span>End of entry {yearOrdinal(year.year, 5226)}</span>
          <span className="notebook-folio-footer-year">
            {year.year < 0
              ? `${Math.abs(year.year)} BCE`
              : `${year.year} CE`}
          </span>
          <span>Chronograph · Notebook folio</span>
        </div>

        {year._meta && (
          <div className="notebook-folio-meta">
            <span className="notebook-folio-meta-label">Research metadata</span>
            <span className="notebook-folio-meta-body">
              Model: {year._meta.model}
              {year._meta.method && ` · method: ${year._meta.method}`}
              {year._meta.cost_usd != null && ` · cost: $${year._meta.cost_usd.toFixed(4)}`}
              {year._meta.cached && " · cached"}
              {` · processed ${year._meta.processed_at}`}
            </span>
          </div>
        )}

        {year.year === 1423 && <GlassMarginalia />}
      </footer>
    </article>
  );
}

interface NotebookFolioEntryProps {
  ev: HistoryEvent;
  idx: number;
  currentYear: number;
}

function NotebookFolioEntry({ ev, idx, currentYear }: NotebookFolioEntryProps) {
  const [open, setOpen] = useState(false);
  const contemp = ev.sources.filter((s) => s.contemporary).length;
  const later = ev.sources.length - contemp;
  const rank = CERTAINTY_RANK[ev.certainty] ?? 0;
  const catLabel = safeCategoryConfig(ev.category).label;

  return (
    <li id={ev.id} className="notebook-folio-entry" data-cat={ev.category}>
      <div className="notebook-folio-entry-rail">
        <div className="notebook-folio-entry-index">
          {String(idx + 1).padStart(2, "0")}
        </div>
        <div
          className="notebook-folio-entry-dot"
          style={{ background: `var(--cat-${ev.category}, var(--stamp))` }}
        />
      </div>

      <div className="notebook-folio-entry-body">
        <div className="notebook-folio-entry-open">
          <div className="notebook-folio-entry-head">
            <span
              className="notebook-folio-entry-cat"
              style={{ color: `var(--cat-${ev.category}, var(--stamp))` }}
            >
              {catLabel}
            </span>
            <span className="notebook-folio-entry-sep">·</span>
            <span className="notebook-folio-entry-region">{ev.region}</span>
          </div>
          <h3 className="notebook-folio-entry-title">{ev.title}</h3>
          {/* Reading-first: the narrative is always shown in full. Only the
              citation apparatus (figures + sources) sits behind the toggle. */}
          <p className="notebook-folio-entry-desc">{ev.description}</p>

          <div className="notebook-folio-entry-foot">
            <CertaintyStamp certainty={ev.certainty} rank={rank} />
            <div className="notebook-folio-entry-bars">
              <span className="notebook-folio-entry-bars-label">
                Contemp / Later
              </span>
              <span className="notebook-folio-entry-bars-meter">
                <span
                  className="notebook-folio-entry-bar c"
                  style={{ flex: contemp || 0.01 }}
                  title={`${contemp} contemporary`}
                />
                <span
                  className="notebook-folio-entry-bar l"
                  style={{ flex: later || 0.01 }}
                  title={`${later} later`}
                />
              </span>
              <span className="notebook-folio-entry-bars-num">
                {ev.sources.length}
              </span>
            </div>
            <button
              type="button"
              className="notebook-folio-entry-more"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
            >
              {open ? "Hide sources ↑" : "Sources & figures ↓"}
            </button>
          </div>

          {ev.category === "musical" && (
            <MusicThread eventId={ev.id} currentYear={currentYear} />
          )}
        </div>

        {open && (
          <div className="notebook-folio-entry-expand">
            {ev.key_figures.length > 0 && (
              <div className="notebook-folio-kf">
                <div className="notebook-folio-kf-label">Figures cited</div>
                <div className="notebook-folio-kf-list">
                  {ev.key_figures.map((f, i) => (
                    <span key={i} className="notebook-folio-kf-chip">{f}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="notebook-folio-sources">
              <div className="notebook-folio-kf-label">Sources</div>
              <ol className="notebook-folio-source-list">
                {ev.sources.map((s, i) => (
                  <li key={i} className="notebook-folio-source">
                    <sup className="notebook-folio-source-num">{i + 1}</sup>
                    <span className="notebook-folio-source-name">{s.name}</span>
                    <span
                      className={
                        "notebook-folio-source-tag " +
                        (s.contemporary ? "contemp" : "later")
                      }
                    >
                      {s.type.replace(/_/g, " ")}
                      {s.contemporary && " · contemporary"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {ev.certainty_note && (
              <p className="notebook-folio-entry-cert-note">
                <span className="notebook-folio-kf-label">Certainty note</span>
                {ev.certainty_note}
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Follow-the-thread control for Music & Opera entries: jumps to the earlier /
 * later work in the chronological music sequence, landing on that exact entry
 * (via a #id anchor). Turns the "musical" filter into the guided narrative the
 * UX audit asked for ("filter and thread"). Keyed off the event's stable id, so
 * a miss (suppressed/non-thread work) simply renders nothing.
 */
function MusicThread({ eventId, currentYear }: { eventId: string; currentYear: number }) {
  const { prev, next, position, total } = musicThreadNeighbours(eventId);
  if (position < 0 || (!prev && !next)) return null;

  // A hop to a work in the SAME year only changes the URL hash: the folio does
  // not remount and the mount effect (keyed on year) never fires. Scroll + flash
  // directly. Cross-year hops fall through to the Link nav + the mount effect.
  const hop =
    (targetYear: number, targetId: string) => (e: React.MouseEvent) => {
      // Let modified clicks (new tab/window) behave normally — don't hijack the
      // current page; the opened tab deep-links and scrolls itself.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (targetYear === currentYear) {
        requestAnimationFrame(() => scrollToEntry(targetId));
      }
    };

  return (
    <nav
      className="notebook-folio-thread"
      aria-label={`Music & Opera thread — work ${position + 1} of ${total}`}
    >
      <span className="notebook-folio-thread-label">
        <span aria-hidden="true">♪ </span>Follow the thread
        <span className="notebook-folio-thread-count">
          {" "}
          <span aria-hidden="true">· </span>
          {position + 1} of {total}
        </span>
      </span>
      <div className="notebook-folio-thread-links">
        {prev ? (
          <Link
            href={`/year/${prev.year}#${prev.id}`}
            scroll={false}
            onClick={hop(prev.year, prev.id)}
            className="notebook-folio-thread-link prev"
          >
            <span className="notebook-folio-thread-dir">
              <span aria-hidden="true">← </span>Earlier
            </span>
            <span className="notebook-folio-thread-work">
              {prev.title} <span aria-hidden="true">·</span> {formatYear(prev.year)}
            </span>
          </Link>
        ) : (
          <span className="notebook-folio-thread-end">
            <span aria-hidden="true">← </span>Start of the thread
          </span>
        )}
        {next ? (
          <Link
            href={`/year/${next.year}#${next.id}`}
            scroll={false}
            onClick={hop(next.year, next.id)}
            className="notebook-folio-thread-link next"
          >
            <span className="notebook-folio-thread-dir">
              Later<span aria-hidden="true"> →</span>
            </span>
            <span className="notebook-folio-thread-work">
              {next.title} <span aria-hidden="true">·</span> {formatYear(next.year)}
            </span>
          </Link>
        ) : (
          <span className="notebook-folio-thread-end">
            End of the thread<span aria-hidden="true"> →</span>
          </span>
        )}
      </div>
    </nav>
  );
}

function CertaintyStamp({ certainty, rank }: { certainty: string; rank: number }) {
  const label = certainty.charAt(0).toUpperCase() + certainty.slice(1);
  return (
    <span
      className={`notebook-folio-cert notebook-folio-cert-${certainty}`}
      title={`Certainty: ${label}`}
    >
      <span className="notebook-folio-cert-mark">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className={i < rank ? "on" : ""} />
        ))}
      </span>
      {label}
    </span>
  );
}
