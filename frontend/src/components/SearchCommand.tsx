"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import type { YearData } from "@/types/history";
import { searchEvents } from "@/lib/data";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SearchCommandProps {
  years: YearData[];
}

export function SearchCommand({ years }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const results = searchEvents(years, query);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback(
    (year: number) => {
      setOpen(false);
      setQuery("");
      router.push(`/year/${year}`);
    },
    [router]
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        Search events...
        <kbd className="hidden sm:inline ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
          Cmd+K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center border-b border-border px-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, figures, years..."
            className="border-0 bg-transparent focus-visible:ring-0 text-base"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {query.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Type to search across all researched years...
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </p>
          ) : (
            results.map((r) => (
              <button
                key={r.event.id}
                onClick={() => handleSelect(r.year)}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted transition-colors"
              >
                <span className="shrink-0 font-mono text-xs text-primary tabular-nums mt-0.5">
                  {r.yearLabel}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.event.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("rounded px-1 py-0 text-[10px]", CATEGORY_CONFIG[r.event.category].color)}>
                      {CATEGORY_CONFIG[r.event.category].label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{r.event.region}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
