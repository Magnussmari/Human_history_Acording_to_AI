"use client";

import type { ScholarlyDebate } from "@/types/evidence";

interface ScholarlyDebatePanelProps {
  debate: ScholarlyDebate;
}

export function ScholarlyDebatePanel({ debate }: ScholarlyDebatePanelProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#111111", border: "1px solid #222222" }}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
        Scholarly debate
      </p>
      <h3
        className="text-lg font-semibold mb-5 leading-snug"
        style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
      >
        {debate.question}
      </h3>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg p-4 bg-background/40 border border-border/40">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300 mb-2">Position A</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{debate.position_a}</p>
        </div>
        <div className="rounded-lg p-4 bg-background/40 border border-border/40">
          <p className="text-[10px] uppercase tracking-wider text-amber-300 mb-2">Position B</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{debate.position_b}</p>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border/30">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Current consensus
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{debate.current_consensus}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Resolution needed
          </p>
          <p className="text-sm text-foreground/70 italic leading-relaxed">
            {debate.resolution_needed}
          </p>
        </div>
      </div>
    </div>
  );
}
