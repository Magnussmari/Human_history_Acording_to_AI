/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-29
 *
 * Era selector — replaces the horizontal scroll strip of scholarly-era pills.
 *
 * That strip was fine at 7 eras and unusable at 43: everything past the fourth
 * pill lived off-screen behind a sideways scroll with no indication of how much
 * was hidden or how it was organised. This is a trigger button that opens one
 * panel showing every era at once, grouped by kind (chronological sweep, then
 * the thematic / crisis / regional expansion), with a filter box, each era's
 * span, and whether its dossier is filed.
 *
 * a11y: role=dialog + aria-modal with a Tab focus-trap and focus-restore to the
 * trigger, Escape to close, type-to-filter, and arrow-key navigation through the
 * results. Mirrors the ⌘K palette's proven pattern (SearchCommand.tsx).
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { GraduationCap, Search, X } from "lucide-react";
import { formatYear } from "@/lib/constants";
import { isDossierFiled } from "@/lib/evidence";
import type { EraIndex, EraRegistryEntry } from "@/types/evidence";
import "./era-select-menu.css";

const GROUPS: { kind: string; label: string; blurb: string }[] = [
  {
    kind: "chronological",
    label: "Chronological sweep",
    blurb: "The linear record, earliest first",
  },
  {
    kind: "thematic",
    label: "Thematic lenses",
    blurb: "Cross-cutting currents that ignore geography",
  },
  {
    kind: "crisis",
    label: "Crisis & rupture",
    blurb: "Pandemic, war, atrocity, climate shock",
  },
  {
    kind: "regional",
    label: "Regional spheres",
    blurb: "Civilisations outside the Western default",
  },
];

interface Props {
  index: EraIndex;
}

export function EraSelectMenu({ index }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasOpenedRef = useRef(false);

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (e: EraRegistryEntry) =>
      !needle ||
      e.label.toLowerCase().includes(needle) ||
      (e.primaryBroadEra ?? "").toLowerCase().includes(needle) ||
      (e.focus ?? "").toLowerCase().includes(needle);

    return GROUPS.map((g) => ({
      ...g,
      eras: index.registry
        .filter((e) => (e.kind ?? "chronological") === g.kind)
        .filter(match)
        .sort((a, b) => a.start - b.start),
    })).filter((g) => g.eras.length > 0);
  }, [index.registry, q]);

  const flat = useMemo(() => grouped.flatMap((g) => g.eras), [grouped]);

  useEffect(() => setCursor(0), [q]);

  // Escape closes.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus into the panel on open; restore to the trigger on close.
  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      const t = setTimeout(() => inputRef.current?.focus(), 70);
      return () => clearTimeout(t);
    }
    if (hasOpenedRef.current) triggerRef.current?.focus();
    return undefined;
  }, [open]);

  const onTrapKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const root = panelRef.current;
    if (!root) return;
    const f = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !root.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const go = (id: string) => {
    setOpen(false);
    router.push(`/era/${id}`);
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(flat.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter" && flat[cursor]) {
      e.preventDefault();
      go(flat[cursor].id);
    }
  };

  const filed = index.registry.filter(isDossierFiled).length;

  return (
    <div className="era-select">
      <button
        ref={triggerRef}
        type="button"
        className="era-select-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <GraduationCap size={14} aria-hidden="true" />
        <span>Select a scholarly era</span>
        <span className="era-select-trigger-count">
          {index.registry.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="era-select-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Select a scholarly era"
              className="era-select-panel"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              onKeyDown={onTrapKeyDown}
            >
              <div className="era-select-head">
                <div className="era-select-search">
                  <Search size={14} aria-hidden="true" />
                  <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder="Filter eras…"
                    aria-label="Filter eras by name"
                  />
                </div>
                <button
                  type="button"
                  className="era-select-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close era selector"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>

              <p className="era-select-meta">
                {index.registry.length} eras · {filed} with a filed dossier ·
                overlapping spans by design
              </p>

              <div className="era-select-body">
                {grouped.length === 0 && (
                  <p className="era-select-empty">No era matches “{q}”.</p>
                )}
                {grouped.map((g) => (
                  <section key={g.kind} className="era-select-group">
                    <h3>
                      {g.label}
                      <span className="era-select-group-n">
                        {g.eras.length}
                      </span>
                    </h3>
                    <p className="era-select-group-blurb">{g.blurb}</p>
                    <ul>
                      {g.eras.map((era) => {
                        const pending = !isDossierFiled(era);
                        const i = flat.indexOf(era);
                        return (
                          <li key={era.id}>
                            <button
                              type="button"
                              className="era-select-item"
                              data-tone={era.tone ?? "neutral"}
                              data-cursor={i === cursor || undefined}
                              onClick={() => go(era.id)}
                              onMouseEnter={() => setCursor(i)}
                            >
                              <span className="era-select-item-label">
                                {era.label}
                              </span>
                              {/* Meta on its own line: era labels run long ("The
                                  Era of Modern Genocide & Mass Atrocity") and
                                  inline badges truncated them mid-word. */}
                              <span className="era-select-item-meta">
                                <span className="era-select-item-span">
                                  {formatYear(era.start)} –{" "}
                                  {formatYear(era.end)}
                                </span>
                                {pending && (
                                  <span className="era-select-item-pending">
                                    pending
                                  </span>
                                )}
                                {era.careLevel === "high" && (
                                  <span
                                    className="era-select-item-care"
                                    title="Editorial duty of care applies"
                                  >
                                    care
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
