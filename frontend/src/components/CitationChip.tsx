"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitationChipProps {
  doi: string;
  label?: string;
  className?: string;
}

export function CitationChip({ doi, label, className }: CitationChipProps) {
  const href = doi.startsWith("http") ? doi : `https://doi.org/${doi}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono transition-colors",
        "bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted/80",
        "border border-border/50",
        className
      )}
      title={doi}
    >
      <span className="truncate max-w-[18ch]">{label ?? doi}</span>
      <ExternalLink size={9} />
    </a>
  );
}
