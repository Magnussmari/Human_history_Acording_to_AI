/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-15
 */
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Search, ExternalLink } from "lucide-react";
import {
  MUSIC_ERAS,
  type MusicEntry,
  type MusicEntryKind,
} from "@/data/music-timeline";
import "./music.css";

const KINDS: Record<MusicEntryKind, { label: string; varName: string }> = {
  opera: { label: "Opera", varName: "--mf-opera" },
  work: { label: "Work", varName: "--mf-work" },
  composer: { label: "Composer", varName: "--mf-composer" },
  innovation: { label: "Innovation", varName: "--mf-innovation" },
  institution: { label: "Institution", varName: "--mf-institution" },
  event: { label: "Event", varName: "--mf-event" },
};
const KIND_ORDER = Object.keys(KINDS) as MusicEntryKind[];

// Century minimap axis: span the full corpus, 850 to 2025.
const AXIS_MIN = 850;
const AXIS_MAX = 2025;
const CENTURIES = [900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000];
const pct = (year: number) =>
  ((Math.max(AXIS_MIN, Math.min(AXIS_MAX, year)) - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100;

// Presort each era's entries once (not on every keystroke).
const SORTED_ERAS = MUSIC_ERAS.map((e) => ({
  ...e,
  entries: [...e.entries].sort((a, b) => a.year - b.year),
}));
const TOTAL_ENTRIES = SORTED_ERAS.reduce((n, e) => n + e.entries.length, 0);
// Year span from era bounds, so the hero and the stat agree (850 to 2025).
const SPAN_MIN = Math.min(...SORTED_ERAS.map((e) => e.start));
const SPAN_MAX = Math.max(...SORTED_ERAS.map((e) => e.end));
const OPERA_COUNT = SORTED_ERAS.flatMap((e) => e.entries).filter(
  (e) => e.kind === "opera",
).length;

// Minimap tick positions with a collision-nudge, so overlapping eras (18/19 and
// 23/24 share a midpoint) each stay clickable instead of stacking.
const TICK_POS: Record<string, number> = (() => {
  const arr = SORTED_ERAS.map((e) => ({ id: e.id, pos: pct((e.start + e.end) / 2) })).sort(
    (a, b) => a.pos - b.pos,
  );
  const MIN_GAP = 1.5;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].pos - arr[i - 1].pos < MIN_GAP) arr[i].pos = arr[i - 1].pos + MIN_GAP;
  }
  const map: Record<string, number> = {};
  for (const t of arr) map[t.id] = Math.min(t.pos, 99.4);
  return map;
})();

// A single honest "explore" affordance per entry. Scores and audio for the
// musical works, an encyclopaedia lookup for events and institutions.
function exploreLink(en: MusicEntry): { href: string; label: string } {
  const q = encodeURIComponent(`${en.title} ${en.composer}`.trim());
  if (en.kind === "opera" || en.kind === "work" || en.kind === "composer") {
    return { href: `https://imslp.org/wiki/Special:Search?search=${q}`, label: "Scores & audio" };
  }
  return { href: `https://en.wikipedia.org/w/index.php?search=${q}`, label: "Read more" };
}

export function MusicTimeline() {
  const [activeKinds, setActiveKinds] = useState<Set<MusicEntryKind>>(new Set());
  const [query, setQuery] = useState("");
  const [activeEra, setActiveEra] = useState<string>(SORTED_ERAS[0]?.id ?? "");
  const searchRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();

  // Restore filter state from the URL on mount, then keep the URL in sync so a
  // shared link preserves search + active kinds (era hash deep-links already work).
  const hydrated = useRef(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const qp = p.get("q");
    const kp = p.get("kinds");
    if (qp) setQuery(qp);
    if (kp) {
      const ks = kp.split(",").filter((k): k is MusicEntryKind => k in KINDS);
      if (ks.length) setActiveKinds(new Set(ks));
    }
    hydrated.current = true;
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    const p = new URLSearchParams();
    const qq = query.trim();
    if (qq) p.set("q", qq);
    if (activeKinds.size) p.set("kinds", [...activeKinds].join(","));
    const qs = p.toString();
    const { pathname, hash } = window.location;
    history.replaceState(null, "", qs ? `${pathname}?${qs}${hash}` : `${pathname}${hash}`);
  }, [query, activeKinds]);

  const view = useMemo(() => {
    return SORTED_ERAS.map((era) => {
      const entries = era.entries.map((en) => {
        const okKind = activeKinds.size === 0 || activeKinds.has(en.kind);
        const okText =
          !q ||
          (en.title + " " + en.composer + " " + en.description)
            .toLowerCase()
            .includes(q);
        return { en, visible: okKind && okText };
      });
      const shown = entries.filter((e) => e.visible).length;
      return { era, entries, shown, visible: shown > 0 };
    });
  }, [activeKinds, q]);

  const shownCount = view.reduce((n, v) => n + v.shown, 0);
  const anyVisible = shownCount > 0;
  const filtered = activeKinds.size > 0 || q.length > 0;

  const stats = [
    { n: String(SORTED_ERAS.length), l: "Eras" },
    { n: String(TOTAL_ENTRIES), l: "Entries" },
    { n: `${SPAN_MIN} – ${SPAN_MAX}`, l: "Year span" },
    { n: String(OPERA_COUNT), l: "Operas" },
  ];

  // Scroll-spy. Hidden (display:none) sections never intersect, so the active
  // era naturally stays on a visible one.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section.mf-era"));
    const spy = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) setActiveEra((e.target as HTMLElement).dataset.era ?? "");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((s) => spy.observe(s));
    return () => spy.disconnect();
  }, []);

  // "/" focuses search, but never while typing in any field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleKind = (k: MusicEntryKind) =>
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const clearFilters = () => {
    setActiveKinds(new Set());
    setQuery("");
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(`mf-era-${id}`);
    if (el) {
      history.replaceState(null, "", `#mf-era-${id}`);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="mf">
      <div className="mf-wrap">
        {/* rail */}
        <aside className="mf-rail">
          <div className="mf-brand">
            <div className="mark">Musica &amp; Opera</div>
            <div className="sub">A timeline of the Western tradition</div>
          </div>
          <nav className="mf-railscroll" aria-label="Eras">
            {view.map(({ era, visible }) => (
              <button
                key={era.id}
                className={`mf-rlink${activeEra === era.id ? " active" : ""}${
                  !visible ? " dim" : ""
                }`}
                aria-current={activeEra === era.id ? "true" : undefined}
                onClick={() => scrollTo(era.id)}
              >
                <span className="n">{era.id}</span>
                <span className="t">
                  {era.name}
                  <span className="yr">
                    {era.start}–{era.end}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* main */}
        <main className="mf-main">
          <header className="mf-hero">
            <div className="mf-kicker">A Chronicle in Sound · c.850 – 2025</div>
            <h1>
              A Timeline of
              <br />
              Classical Music &amp; <em>Opera</em>
            </h1>
            <p className="mf-lede">
              From the first notated plainchant to twenty-first-century opera,
              twenty-nine eras that carried a single art forward, one invention,
              one masterwork, one voice at a time.
            </p>
            <div className="mf-stats">
              {stats.map((s) => (
                <div className="mf-stat" key={s.l}>
                  <b>{s.n}</b>
                  <span>{s.l}</span>
                </div>
              ))}
            </div>
            <div className="mf-prov">
              <span className="dot">◆</span>
              <span>
                <b>Layer 1, an initial draft.</b> This chronicle was drawn from
                well-established music history to be explored and refined. A
                scholarly evidence layer (peer-reviewed, citation-checked) is the
                next pass. Dates marked &ldquo;c.&rdquo; are approximate.
              </span>
            </div>

            <nav className="mf-map" aria-label="Century map">
              <div className="mf-map-track">
                {CENTURIES.map((c) => (
                  <div className="mf-map-cent" key={c} style={{ left: `${pct(c)}%` }}>
                    <span>{c}</span>
                  </div>
                ))}
                {SORTED_ERAS.map((era, i) => {
                  return (
                    <button
                      key={era.id}
                      className={`mf-map-tick${activeEra === era.id ? " active" : ""}`}
                      style={{ left: `${TICK_POS[era.id]}%` }}
                      data-flip={i % 2}
                      title={`${era.id} · ${era.name} (${era.start}–${era.end})`}
                      aria-label={`Jump to ${era.name}, ${era.start} to ${era.end}`}
                      onClick={() => scrollTo(era.id)}
                    >
                      <span className="lbl">{era.id}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </header>

          <div className="mf-controls">
            <div className="row">
              <label className="mf-search">
                <Search size={16} aria-hidden />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search a work, composer, or idea…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  aria-label="Search the timeline"
                />
                <kbd>/</kbd>
              </label>
              <div className="mf-chips" role="group" aria-label="Filter by kind">
                {KIND_ORDER.map((k) => (
                  <button
                    key={k}
                    className={`mf-chip${activeKinds.has(k) ? " on" : ""}`}
                    aria-pressed={activeKinds.has(k)}
                    onClick={() => toggleKind(k)}
                  >
                    <span className="sw" style={{ background: `var(${KINDS[k].varName})` }} />
                    {KINDS[k].label}
                  </button>
                ))}
              </div>
              <span className="mf-count" role="status" aria-live="polite">
                {filtered ? `Showing ${shownCount} of ${TOTAL_ENTRIES}` : `${TOTAL_ENTRIES} entries`}
              </span>
            </div>
          </div>

          {view.map(({ era, entries, visible }) => (
            <section
              key={era.id}
              id={`mf-era-${era.id}`}
              data-era={era.id}
              className={`mf-era${!visible ? " hidden" : ""}`}
            >
              <div className="mf-erahead">
                <div className="mf-num">{era.id}</div>
                <div>
                  <h2 className="mf-eratitle">{era.name}</h2>
                  <div className="mf-eradates">
                    {era.start} – {era.end}
                  </div>
                  <div className="mf-erablurb">{era.blurb}</div>
                  <p className="mf-erasummary">{era.summary}</p>
                  <div className="mf-figs">
                    {era.key_figures.map((f) => (
                      <span className="mf-fig" key={f}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <ol className="mf-entries">
                {entries.map(({ en, visible: evis }) => {
                  const k = KINDS[en.kind] ?? KINDS.work;
                  const link = exploreLink(en);
                  return (
                    <li
                      key={en.title + en.year}
                      className={`mf-entry${!evis ? " hidden" : ""}`}
                    >
                      <span className="mf-dot" style={{ borderColor: `var(${k.varName})` }} />
                      <div className="yr">{en.year_label || en.year}</div>
                      <div className="body">
                        <h3 className="t">{en.title}</h3>
                        <div className="mf-meta">
                          <span className="mf-composer">{en.composer}</span>
                          <span className="mf-badge" style={{ "--k": `var(${k.varName})` } as CSSProperties}>
                            {k.label}
                          </span>
                        </div>
                        <div className="mf-desc">{en.description}</div>
                        <div className="mf-meta mf-provrow">
                          {en.certainty !== "confirmed" && (
                            <span className={`mf-cert mf-cert-${en.certainty}`}>
                              {en.certainty}
                              <span className="mf-sr"> historical confidence</span>
                            </span>
                          )}
                          <span className="mf-region">
                            <span className="mf-sr">Region: </span>
                            {en.region}
                          </span>
                          <a
                            className="mf-listen"
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${en.title}: ${link.label.toLowerCase()} (opens in a new tab)`}
                          >
                            {link.label}
                            <ExternalLink size={11} aria-hidden />
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}

          {!anyVisible && (
            <div className="mf-noresults">
              <p>No entries match the current search and filters.</p>
              <button onClick={clearFilters}>Clear filters</button>
            </div>
          )}

          <footer className="mf-foot">
            <p>
              <b>How this was made.</b> Twenty-nine eras were generated in
              parallel by a seven-agent swarm on 15 July 2026, then rendered here
              inside Chronograph. It mirrors the two-layer method of this project:
              a fast model-drafted layer first, a scholarly evidence layer (via
              the Scite research swarm) second. Nothing here is a final scholarly
              claim yet; the &ldquo;Layer 1&rdquo; stamp on each entry marks that.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
