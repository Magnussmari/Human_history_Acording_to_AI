"use client";

import { motion } from "motion/react";
import { List, Map, Network } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "timeline" | "map" | "graph";

interface ViewToggleProps {
  active: ViewMode;
  onChange: (view: ViewMode) => void;
}

const VIEWS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "timeline", label: "Timeline", icon: <List size={14} /> },
  { id: "map", label: "Map", icon: <Map size={14} /> },
  { id: "graph", label: "Graph", icon: <Network size={14} /> },
];

export function ViewToggle({ active, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-lg p-1 gap-0.5"
      style={{
        background: "#111111",
        border: "1px solid #222222",
      }}
    >
      {VIEWS.map((view) => {
        const isActive = active === view.id;
        return (
          <motion.button
            key={view.id}
            onClick={() => onChange(view.id)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.span
                layoutId="view-active-bg"
                className="absolute inset-0 rounded-md"
                style={{ background: "rgba(232,200,138,0.15)", border: "1px solid rgba(232,200,138,0.25)" }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{view.icon}</span>
            <span className="relative z-10">{view.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
