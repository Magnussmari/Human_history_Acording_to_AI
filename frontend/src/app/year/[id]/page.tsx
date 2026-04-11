"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchManifest, fetchAllYears } from "@/lib/data";
import { DOC_LEVEL_CONFIG, getEraForYear, formatYear } from "@/lib/constants";
import { EventCard } from "@/components/EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function YearPage() {
  const params = useParams();
  const yearId = Number(params.id);

  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: allYears, isLoading } = useQuery({
    queryKey: ["years", manifest?.generated_at],
    queryFn: () => fetchAllYears(manifest!),
    enabled: !!manifest,
  });

  const year = allYears?.find((y) => y.year === yearId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!year) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">{formatYear(yearId)}</h1>
        <p className="text-muted-foreground mb-6">This year has not been researched yet.</p>
        <Link href="/" className="text-primary hover:underline">Back to timeline</Link>
      </div>
    );
  }

  const era = getEraForYear(year.year);
  const docConfig = DOC_LEVEL_CONFIG[year.documentation_level];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors mb-6 inline-block">
        Back to timeline
      </Link>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className={cn("rounded px-2 py-0.5 text-xs font-medium text-white", era.color)}>
            {era.label}
          </span>
          <span className={cn("text-xs font-medium", docConfig.color)}>
            {docConfig.label} documentation
          </span>
        </div>
        <h1 className="text-5xl font-bold text-primary mb-3">
          {year.year_label}
        </h1>
        <p className="text-lg text-foreground/70 leading-relaxed">
          {year.era_context}
        </p>
      </div>

      {/* Geographic gaps */}
      {year.geographic_coverage_gaps.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-2">
            Geographic Coverage Gaps
          </h3>
          <ul className="text-sm text-yellow-200/70 space-y-1">
            {year.geographic_coverage_gaps.map((gap, i) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Events */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Events ({year.events.length})
        </h2>
        <div className="space-y-4">
          {year.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* Disconfirming Evidence */}
      {year.disconfirming_evidence && (
        <div className="mb-6 rounded-lg border border-red-600/20 bg-red-900/10 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400 mb-2">
            Disconfirming Evidence
          </h3>
          <p className="text-sm text-red-200/70 leading-relaxed">
            {year.disconfirming_evidence}
          </p>
        </div>
      )}

      {/* Historiographic Note */}
      {year.historiographic_note && (
        <div className="mb-6 rounded-lg border border-border/50 bg-card/50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Historiographic Note
          </h3>
          <p className="text-sm text-foreground/60 leading-relaxed">
            {year.historiographic_note}
          </p>
        </div>
      )}

      {/* Graph Edges */}
      {year.graph_edges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Cross-Year Connections
          </h3>
          <div className="space-y-2">
            {year.graph_edges.map((edge, i) => (
              <div key={i} className="flex items-center gap-2 text-sm rounded bg-card/50 border border-border/30 p-3">
                <span className="font-mono text-xs text-primary">{edge.from}</span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {edge.relation.replace(/_/g, " ")}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{edge.to}</span>
                <span className="text-xs text-foreground/50 ml-2">{edge.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      {year._meta && (
        <div className="mt-8 pt-6 border-t border-border/30 text-xs text-muted-foreground/50 font-mono">
          Model: {year._meta.model} | Method: {year._meta.method ?? "api"} |{" "}
          {year._meta.cost_usd != null && `Cost: $${year._meta.cost_usd.toFixed(4)} | `}
          Processed: {year._meta.processed_at}
        </div>
      )}
    </div>
  );
}
