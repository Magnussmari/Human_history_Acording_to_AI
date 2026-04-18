"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { EraIndex, EraRegistryEntry } from "@/types/evidence";
import { findErasForBroadEra } from "@/lib/evidence";
import { safePhaseStatusConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ScholarlyEraPillRowProps {
  index: EraIndex;
  activeBroadEra: string | null;
}

export function ScholarlyEraPillRow({ index, activeBroadEra }: ScholarlyEraPillRowProps) {
  const router = useRouter();
  const visible: EraRegistryEntry[] = activeBroadEra
    ? findErasForBroadEra(activeBroadEra, index)
    : index.registry.filter(e => e.phaseStatus === "phase3-complete" || e.educationStatus === "pilot-complete");

  if (visible.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
        Scholarly eras {activeBroadEra && <span className="text-foreground/60">· {activeBroadEra}</span>}
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {visible.map(era => {
          const phase = safePhaseStatusConfig(era.phaseStatus);
          const rangeLabel =
            era.start < 0
              ? `${Math.abs(era.start)} BCE`
              : `${era.start} CE`;
          return (
            <motion.button
              key={era.id}
              onClick={() => router.push(`/era/${era.id}`)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                "flex items-center gap-2"
              )}
              style={{ background: "#151515", border: "1px solid #262626", color: "#d1c2a8" }}
              whileHover={{ scale: 1.02, background: "#1d1d1d" }}
              whileTap={{ scale: 0.96 }}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", phase.dot)} />
              {era.label}
              <span className="text-[10px] text-muted-foreground tabular-nums">{rangeLabel}</span>
              {era.educationStatus === "pilot-complete" && (
                <span className="text-[9px] rounded-full px-1.5 bg-violet-800/30 text-violet-200 border border-violet-700/30">
                  edu
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
