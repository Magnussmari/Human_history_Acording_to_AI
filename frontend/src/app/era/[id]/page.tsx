"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Info, GraduationCap } from "lucide-react";
import { fetchEra, formatEraRange } from "@/lib/evidence";
import { fetchManifest, fetchAllYears } from "@/lib/data";
import type { EraBundle, EraScholarlyPhase3, EducationPilotData } from "@/types/evidence";
import {
  safeVerdictConfig,
  safeConfidenceConfig,
  safePhaseStatusConfig,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ScholarlyDebatePanel } from "@/components/ScholarlyDebatePanel";
import { ContestedClaimsList } from "@/components/ContestedClaimsList";
import { EvidenceTable } from "@/components/EvidenceTable";
import { EducationPanel } from "@/components/EducationPanel";
import { EducationSkeleton } from "@/components/EducationSkeleton";
import { YearCard } from "@/components/YearCard";

function isPhase3(era: EraBundle): era is EraBundle & { scholarly: EraScholarlyPhase3 } {
  return (era.scholarly as { schema_version?: string })?.schema_version === "1.0.0";
}

export default function EraPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const { data: era, isLoading } = useQuery({
    queryKey: ["era", id],
    queryFn: () => fetchEra(id),
    enabled: !!id,
  });

  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: allYears } = useQuery({
    queryKey: ["years", manifest?.generated_at],
    queryFn: () => fetchAllYears(manifest!),
    enabled: !!manifest && !!era,
  });

  if (isLoading) return null; // loading.tsx handles skeleton

  if (!era) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
        >
          Era not found
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          No scholarly era is registered under that id.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all gold-button"
        >
          <ArrowLeft size={14} /> Return to timeline
        </Link>
      </div>
    );
  }

  const phase = safePhaseStatusConfig(era.phaseStatus);
  const relatedYears = (allYears ?? [])
    .filter(y => y.year <= era.start && y.year >= era.end)
    .slice(0, 10);

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } },
    item: {
      hidden: { opacity: 0, y: 16 },
      show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 250, damping: 28 } },
    },
  };

  const phase3 = isPhase3(era) ? era.scholarly : null;

  return (
    <motion.div
      className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to timeline
      </Link>

      <motion.div variants={stagger.container} initial="hidden" animate="show">
        {/* Hero */}
        <motion.div variants={stagger.item} className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold rounded-full px-3 py-1 uppercase tracking-wider bg-muted text-muted-foreground">
              {era.primaryBroadEra}
            </span>
            <span className={cn("flex items-center gap-1.5 text-xs font-medium", phase.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", phase.dot)} />
              {phase.label}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatEraRange(era)}
            </span>
          </div>

          <h1
            className="glow-title text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
          >
            {era.label}
          </h1>

          {phase3 && (
            <p
              className="prose-reading text-lg leading-relaxed italic"
              style={{ fontFamily: "var(--font-heading), serif", color: "#d1c2a8", lineHeight: 1.8 }}
            >
              {phase3.key_claim}
            </p>
          )}
        </motion.div>

        {/* Verdict + confidence */}
        {phase3 && (
          <motion.div variants={stagger.item} className="mb-8 flex flex-wrap gap-3">
            <Pill label="Verdict" value={safeVerdictConfig(phase3.verdict).label} tone={safeVerdictConfig(phase3.verdict).color} />
            <Pill label="Confidence" value={safeConfidenceConfig(phase3.confidence).label} tone={safeConfidenceConfig(phase3.confidence).color} bare />
            <Pill label="Papers" value={String(phase3.papers_found_total ?? phase3.evidence?.length ?? 0)} bare />
            <Pill label="Searches" value={String(phase3.searches_executed ?? 0)} bare />
            <Pill
              label="Retractions"
              value={String(phase3.papers_with_editorial_notices?.count ?? 0)}
              tone={
                (phase3.papers_with_editorial_notices?.count ?? 0) > 0
                  ? "bg-rose-900/40 text-rose-200 border border-rose-800/40"
                  : undefined
              }
              bare={!(phase3.papers_with_editorial_notices?.count > 0)}
            />
          </motion.div>
        )}

        {/* Scholarly debate */}
        {phase3?.scholarly_debate && (
          <motion.div variants={stagger.item} className="mb-10">
            <ScholarlyDebatePanel debate={phase3.scholarly_debate} />
          </motion.div>
        )}

        {/* Contested claims */}
        {phase3?.contested_claims && phase3.contested_claims.length > 0 && (
          <motion.div variants={stagger.item} className="mb-10">
            <h2
              className="text-xl font-semibold mb-4"
              style={{ fontFamily: "var(--font-heading), serif" }}
            >
              Contested claims
            </h2>
            <ContestedClaimsList claims={phase3.contested_claims} />
          </motion.div>
        )}

        {/* Evidence */}
        {phase3?.evidence && phase3.evidence.length > 0 && (
          <motion.div variants={stagger.item} className="mb-10">
            <h2
              className="text-xl font-semibold mb-4 flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading), serif" }}
            >
              Evidence
              <span
                className="text-sm rounded-full px-2.5 py-0.5 font-normal tabular-nums"
                style={{
                  background: "rgba(232,200,138,0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(232,200,138,0.2)",
                }}
              >
                {phase3.evidence.length}
              </span>
            </h2>
            <EvidenceTable evidence={phase3.evidence} />
          </motion.div>
        )}

        {/* Stub messaging for non-phase3 eras */}
        {!phase3 && (
          <motion.div
            variants={stagger.item}
            className="mb-10 rounded-2xl p-6"
            style={{ background: "#111111", border: "1px solid #222222" }}
          >
            <div className="flex items-start gap-3">
              <BookOpen size={20} className="text-muted-foreground mt-1 shrink-0" />
              <div>
                <p className="text-sm font-semibold mb-1 text-foreground/85">
                  {era.phaseStatus === "phase2-migration-pending"
                    ? "Phase 2 scholarly evidence pending migration"
                    : "Scholarly evidence not yet collected"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {era.phaseStatus === "phase2-migration-pending"
                    ? "Phase 2 outputs exist but use an earlier schema; they will appear here once migrated to schema v1.0.0."
                    : "This era hasn't been through a Scite research mission yet. The VALOR source and broad period are known; evidence will be collected in a future research batch."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Education */}
        <motion.div variants={stagger.item} className="mb-10">
          <h2
            className="text-xl font-semibold mb-4 flex items-center gap-2"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            <GraduationCap size={18} />
            Education &amp; formation
          </h2>
          {era.education.status === "pilot-complete" ? (
            <EducationPanel data={era.education as EducationPilotData} />
          ) : (
            <EducationSkeleton
              valorSource={era.valorSource}
              reason={
                era.education.status === "parse-failed"
                  ? "Education markdown failed to parse; please regenerate the aggregator."
                  : undefined
              }
            />
          )}
        </motion.div>

        {/* Related years strip */}
        {relatedYears.length > 0 && (
          <motion.div variants={stagger.item} className="mb-10">
            <h2
              className="text-xl font-semibold mb-4"
              style={{ fontFamily: "var(--font-heading), serif" }}
            >
              Years in this era
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {relatedYears.map((y, i) => (
                <YearCard key={y.year} year={y} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* APA refs */}
        {phase3?.apa_references && phase3.apa_references.length > 0 && (
          <motion.div variants={stagger.item} className="mb-10">
            <h3 className="text-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">
              References (APA)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-foreground/70 leading-relaxed">
              {phase3.apa_references.map((r, i) => (
                <li key={i} className="pl-1">{r}</li>
              ))}
            </ol>
          </motion.div>
        )}

        {/* Meta footer */}
        {phase3 && (
          <motion.div
            variants={stagger.item}
            className="mt-10 pt-6 border-t"
            style={{ borderColor: "rgba(232,200,138,0.1)" }}
          >
            <div className="flex items-center gap-1.5 mb-2 text-muted-foreground/50">
              <Info size={11} />
              <span className="text-[10px] uppercase tracking-[0.18em]">Research metadata</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground/40 leading-relaxed">
              Mission: {phase3.mission_id}
              {" | "}Agent: {phase3.agent_id}
              {" | "}Model: {phase3.model}
              {phase3.calls_consumed != null && ` | Scite calls: ${phase3.calls_consumed}`}
              {` | Run: ${phase3.research_timestamp}`}
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Pill({
  label,
  value,
  tone,
  bare,
}: {
  label: string;
  value: string;
  tone?: string;
  bare?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2",
        bare && !tone ? "bg-muted/20 border border-border/30" : null,
      )}
    >
      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className={cn("text-sm font-semibold", bare && !tone ? "text-foreground" : tone)}>
        {value}
      </p>
    </div>
  );
}
