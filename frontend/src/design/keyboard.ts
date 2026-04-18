/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * Atlas keyboard spec — first-class, not an afterthought.
 * 17,991 events demands a power-user surface.
 *
 * All bindings registered here. Components call useShortcut(id, handler).
 * Help surface reads SHORTCUTS directly; never duplicate the spec.
 */

import { useEffect } from "react";

export type ShortcutId =
  | "search"
  | "next-year"
  | "prev-year"
  | "next-lane"
  | "prev-lane"
  | "jump-to-year"
  | "filter"
  | "pin-era"
  | "escape"
  | "help";

export interface Shortcut {
  id: ShortcutId;
  keys: string[];          // display form, e.g. ["⌘", "K"]
  match: (e: KeyboardEvent) => boolean;
  description: string;
  group: "navigation" | "search" | "filter" | "drawer" | "help";
}

const isMac =
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform);

const meta = (e: KeyboardEvent) => (isMac ? e.metaKey : e.ctrlKey);

const inEditable = (e: KeyboardEvent): boolean => {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    t.isContentEditable === true
  );
};

export const SHORTCUTS: Shortcut[] = [
  {
    id: "search",
    keys: [isMac ? "⌘" : "Ctrl", "K"],
    match: (e) => meta(e) && e.key.toLowerCase() === "k",
    description: "Open search",
    group: "search",
  },
  {
    id: "next-year",
    keys: ["J"],
    match: (e) => !meta(e) && !inEditable(e) && e.key.toLowerCase() === "j",
    description: "Next year",
    group: "navigation",
  },
  {
    id: "prev-year",
    keys: ["K"],
    match: (e) => !meta(e) && !inEditable(e) && e.key.toLowerCase() === "k",
    description: "Previous year",
    group: "navigation",
  },
  {
    id: "next-lane",
    keys: ["→"],
    match: (e) => !inEditable(e) && e.key === "ArrowRight",
    description: "Next lane",
    group: "navigation",
  },
  {
    id: "prev-lane",
    keys: ["←"],
    match: (e) => !inEditable(e) && e.key === "ArrowLeft",
    description: "Previous lane",
    group: "navigation",
  },
  {
    id: "jump-to-year",
    keys: ["G"],
    match: (e) => !meta(e) && !inEditable(e) && e.key.toLowerCase() === "g",
    description: "Jump to year",
    group: "navigation",
  },
  {
    id: "filter",
    keys: ["F"],
    match: (e) => !meta(e) && !inEditable(e) && e.key.toLowerCase() === "f",
    description: "Open filter",
    group: "filter",
  },
  {
    id: "pin-era",
    keys: ["P"],
    match: (e) => !meta(e) && !inEditable(e) && e.key.toLowerCase() === "p",
    description: "Pin / unpin era",
    group: "drawer",
  },
  {
    id: "escape",
    keys: ["Esc"],
    match: (e) => e.key === "Escape",
    description: "Close / cancel",
    group: "drawer",
  },
  {
    id: "help",
    keys: ["?"],
    match: (e) => !inEditable(e) && e.key === "?",
    description: "Show keyboard shortcuts",
    group: "help",
  },
];

export function getShortcut(id: ShortcutId): Shortcut {
  const s = SHORTCUTS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown shortcut: ${id}`);
  return s;
}

/**
 * Bind a single shortcut to a handler. Component unmount auto-cleans.
 *
 *   useShortcut("search", () => setSearchOpen(true));
 */
export function useShortcut(id: ShortcutId, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const shortcut = getShortcut(id);
    const listener = (e: KeyboardEvent) => {
      if (shortcut.match(e)) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [id, handler]);
}
