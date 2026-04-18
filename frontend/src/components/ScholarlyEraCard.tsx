"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ArrowRight } from "lucide-react";
import { fetchEraIndex, fetchEra, findEraForYear, formatEraRange } from "@/lib/evidence";
import type { SciteAgentResult } from "@/types/evidence";
import { safeVerdictConfig, safePhaseStatusConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ScholarlyEraCardProps {
  year: number;
}

export function ScholarlyEraCard({ year }: ScholarlyEraCardProps) {
  const { data: index } = useQuery({
    queryKey: ["era-index"],
    queryFn: fetchEraIndex,
  });

  const registryEntry = index ? findEraForYear(year, index) : null;

  const { data: era } = useQuery({
    queryKey: ["era", registryEntry?.id],
    queryFn: () => (registryEntry ? fetchEra(registryEntry.id) : Promise.resolve(null)),
    enabled: !!registryEntry,
  });

  if (!index) return null;

  if (!registryEntry) {
    return (
      <div
        className="mb-8 rounded-2xl p-5"
        style={{ background: "#111111", border: "1px solid #222222" }}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Scholarly era
        </p>
        <p className="text-sm text-muted-foreground">
          No scholarly-era deep-dive covers this year yet.
        </p>
      </div>
    );
  }

  const isPhase3 = registryEntry.phaseStatus === "phase3-complete";
  const phase = safePhaseStatusConfig(registryEntry.phaseStatus);
  const scholarly = era?.scholarly as SciteAgentResult | undefined;
  const isAgentResult = scholarly?.schema_version === "1.0.0";
  const verdict = isAgentResult ? safeVerdictConfig(scholarly!.verdict) : null;
  const hasEducationPilot = registryEntry.educationStatus === "pilot-complete";

  return (
    <Link
      href={`/era/${registryEntry.id}`}
      className="block mb-8 group"
    >
      <div
        className="rounded-2xl p-5 transition-all group-hover:border-primary/40"
        style={{ background: "#111111", border: "1px solid #222222" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={12} className="text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Scholarly era
          </span>
          <span className={cn("ml-auto flex items-center gap-1.5 text-[10px]", phase.color)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", phase.dot)} />
            {phase.label}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
          <h3
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
          >
            {registryEntry.label}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatEraRange(registryEntry)}
          </span>
        </div>

        {isPhase3 && isAgentResult && (
          <p className="text-sm text-foreground/75 line-clamp-2 leading-relaxed mb-3">
            {scholarly!.key_claim}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {verdict && (
            <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5", verdict.color)}>
              Verdict: {verdict.label}
            </span>
          )}
          {hasEducationPilot && (
            <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-violet-800/30 text-violet-200 border border-violet-700/30">
              Education pilot
            </span>
          )}
          <span
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium transition-colors group-hover:text-primary"
            style={{ color: "var(--gold)" }}
          >
            View full evidence <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}
