/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "motion/react";
import { fetchManifest, fetchAllYears } from "@/lib/data";
import { formatYear } from "@/lib/constants";
import { NotebookYearFolio } from "@/components/notebook/NotebookYearFolio";

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
      <div className="notebook-folio-skeleton" aria-busy="true">
        <div className="notebook-folio-skeleton-bar" />
        <div className="notebook-folio-skeleton-title" />
        <div className="notebook-folio-skeleton-line" />
        <div className="notebook-folio-skeleton-line short" />
        <div className="notebook-folio-skeleton-line" />
      </div>
    );
  }

  if (!year) {
    return (
      <motion.section
        className="notebook-folio notebook-folio-missing"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="notebook-stamp">Unfiled</span>
        <h1 className="notebook-folio-title">{formatYear(yearId)}</h1>
        <p className="notebook-folio-era-text">
          This year has not been filed in the Chronograph yet. The folio is a
          living document — each entry is researched, schema-validated, and
          sourced before it appears.
        </p>
        <Link href="/" className="notebook-folio-back">
          ← Back to timeline
        </Link>
      </motion.section>
    );
  }

  return <NotebookYearFolio year={year} />;
}
