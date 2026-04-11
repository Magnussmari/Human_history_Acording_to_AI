"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, SlidersHorizontal } from "lucide-react";
import { CATEGORY_CONFIG, CERTAINTY_CONFIG } from "@/lib/constants";
import type { FilterState } from "@/lib/data";
import type { EventCategory, CertaintyLevel } from "@/types/history";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const CATEGORY_ICONS: Record<EventCategory, string> = {
  political: "🏛️",
  military: "⚔️",
  scientific: "🔬",
  cultural: "🎨",
  economic: "💰",
  demographic: "👥",
  technological: "⚙️",
  religious: "⛪",
  environmental: "🌿",
  exploration: "🧭",
  legal: "⚖️",
};

export function FilterPanel({ open, onClose, filters, onChange }: FilterPanelProps) {
  const toggleCategory = (cat: EventCategory) => {
    const cats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: cats });
  };

  const toggleCertainty = (cert: CertaintyLevel) => {
    const certs = filters.certainties.includes(cert)
      ? filters.certainties.filter((c) => c !== cert)
      : [...filters.certainties, cert];
    onChange({ ...filters, certainties: certs });
  };

  const activeCount = filters.categories.length + filters.certainties.length + (filters.region ? 1 : 0);

  const handleClear = () => {
    onChange({ categories: [], certainties: [], search: filters.search, region: "" });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 overflow-y-auto"
            style={{
              background: "#0a0a0a",
              borderLeft: "1px solid #222222",
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
              style={{
                borderColor: "#222222",
                background: "#0a0a0a",
              }}
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} style={{ color: "var(--gold)" }} />
                <span
                  className="font-semibold text-sm uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
                >
                  Filters
                </span>
                {activeCount > 0 && (
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: "var(--gold)", color: "var(--background)" }}
                  >
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Categories
                </h3>
                <div className="space-y-1.5">
                  {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map((cat) => {
                    const active = filters.categories.includes(cat);
                    return (
                      <motion.button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all text-left",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                        style={active ? {
                          background: "rgba(232,200,138,0.12)",
                          border: "1px solid rgba(232,200,138,0.3)",
                        } : {
                          border: "1px solid transparent",
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                        <span className="flex-1">{CATEGORY_CONFIG[cat].label}</span>
                        {active && (
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ background: "var(--gold)" }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Certainty */}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Certainty Level
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CERTAINTY_CONFIG) as CertaintyLevel[]).map((cert) => {
                    const active = filters.certainties.includes(cert);
                    return (
                      <motion.button
                        key={cert}
                        onClick={() => toggleCertainty(cert)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-all",
                          active
                            ? CERTAINTY_CONFIG[cert].color
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                        whileTap={{ scale: 0.93 }}
                      >
                        {CERTAINTY_CONFIG[cert].label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Region */}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Region
                </h3>
                <Input
                  placeholder="Filter by region..."
                  value={filters.region}
                  onChange={(e) => onChange({ ...filters, region: e.target.value })}
                  className="h-9 text-sm bg-muted/30 border-border/50 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
