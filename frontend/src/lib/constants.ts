import type { EventCategory, CertaintyLevel, DocumentationLevel } from "@/types/history";

export const ERAS = [
  { label: "Modern", start: 2025, end: 1900, color: "bg-blue-500" },
  { label: "Industrial", start: 1899, end: 1750, color: "bg-indigo-500" },
  { label: "Enlightenment", start: 1749, end: 1500, color: "bg-violet-500" },
  { label: "Renaissance", start: 1499, end: 1300, color: "bg-purple-500" },
  { label: "Medieval", start: 1299, end: 800, color: "bg-fuchsia-500" },
  { label: "Early Medieval", start: 799, end: 400, color: "bg-pink-500" },
  { label: "Classical", start: 399, end: -200, color: "bg-rose-500" },
  { label: "Iron Age", start: -201, end: -800, color: "bg-orange-500" },
  { label: "Bronze Age", start: -801, end: -2000, color: "bg-amber-500" },
  { label: "Early Bronze", start: -2001, end: -3200, color: "bg-yellow-600" },
] as const;

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; icon: string }> = {
  political: { label: "Political", color: "bg-blue-600 text-blue-100", icon: "landmark" },
  military: { label: "Military", color: "bg-red-700 text-red-100", icon: "swords" },
  scientific: { label: "Scientific", color: "bg-cyan-600 text-cyan-100", icon: "flask" },
  cultural: { label: "Cultural", color: "bg-purple-600 text-purple-100", icon: "palette" },
  economic: { label: "Economic", color: "bg-emerald-600 text-emerald-100", icon: "coins" },
  demographic: { label: "Demographic", color: "bg-teal-600 text-teal-100", icon: "users" },
  technological: { label: "Technological", color: "bg-sky-600 text-sky-100", icon: "cog" },
  religious: { label: "Religious", color: "bg-amber-700 text-amber-100", icon: "church" },
  environmental: { label: "Environmental", color: "bg-green-700 text-green-100", icon: "leaf" },
  exploration: { label: "Exploration", color: "bg-indigo-600 text-indigo-100", icon: "compass" },
  legal: { label: "Legal", color: "bg-slate-600 text-slate-100", icon: "scale" },
};

export const CERTAINTY_CONFIG: Record<CertaintyLevel, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "bg-green-600 text-green-100" },
  probable: { label: "Probable", color: "bg-blue-600 text-blue-100" },
  approximate: { label: "Approximate", color: "bg-yellow-600 text-yellow-100" },
  traditional: { label: "Traditional", color: "bg-orange-600 text-orange-100" },
  legendary: { label: "Legendary", color: "bg-purple-600 text-purple-100" },
};

export const DOC_LEVEL_CONFIG: Record<DocumentationLevel, { label: string; color: string; bars: number }> = {
  rich: { label: "Rich", color: "text-green-400", bars: 5 },
  moderate: { label: "Moderate", color: "text-blue-400", bars: 4 },
  sparse: { label: "Sparse", color: "text-yellow-400", bars: 3 },
  minimal: { label: "Minimal", color: "text-orange-400", bars: 2 },
  negligible: { label: "Negligible", color: "text-red-400", bars: 1 },
};

export const DATA_BASE_URL = "/data";
export const EVIDENCE_DATA_URL = "/data/eras";
export const TOTAL_YEARS = 5226;

// ─── Layer 2 (scholarly eras + education) config ────────────────────────────

export const VERDICT_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  supported:               { label: "Supported",              color: "bg-emerald-700/40 text-emerald-200 border border-emerald-600/30", dot: "bg-emerald-400" },
  contested:               { label: "Contested",              color: "bg-amber-700/40 text-amber-200 border border-amber-600/30",       dot: "bg-amber-400" },
  refuted:                 { label: "Refuted",                color: "bg-rose-800/40 text-rose-200 border border-rose-700/30",          dot: "bg-rose-400" },
  unresolved:              { label: "Unresolved",             color: "bg-slate-700/40 text-slate-200 border border-slate-600/30",       dot: "bg-slate-400" },
  "insufficient-evidence": { label: "Insufficient Evidence",  color: "bg-slate-700/40 text-slate-300 border border-slate-600/30",       dot: "bg-slate-500" },
};

export const CONFIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  high:     { label: "High confidence",     color: "text-emerald-300" },
  moderate: { label: "Moderate confidence", color: "text-amber-300" },
  low:      { label: "Low confidence",      color: "text-rose-300" },
  unknown:  { label: "Unknown confidence",  color: "text-muted-foreground" },
};

export const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  "Tier 1":       { label: "Tier 1", color: "bg-emerald-700/30 text-emerald-200 border border-emerald-600/30" },
  "Tier 2":       { label: "Tier 2", color: "bg-sky-700/30 text-sky-200 border border-sky-600/30" },
  "Tier 3":       { label: "Tier 3", color: "bg-slate-700/30 text-slate-300 border border-slate-600/30" },
  "Tier unknown": { label: "Tier ?", color: "bg-muted text-muted-foreground border border-border" },
};

export const PHASE_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  "phase3-complete":          { label: "Phase 3 — validated",      color: "text-emerald-300", dot: "bg-emerald-400" },
  "phase2-migration-pending": { label: "Phase 2 — migration pending", color: "text-amber-300", dot: "bg-amber-400" },
  "unresearched":             { label: "Not yet researched",       color: "text-muted-foreground", dot: "bg-slate-500" },
};

/** 7 VALOR capacity categories. Used by EducationPanel / CapacityGrid. */
export const CAPACITY_CONFIG: Record<number, { name: string; short: string }> = {
  1: { name: "Foundational cognition",         short: "Cognition" },
  2: { name: "Practical judgment (phronesis)", short: "Phronesis" },
  3: { name: "Ethical formation",              short: "Ethics" },
  4: { name: "Communicative competence",       short: "Communication" },
  5: { name: "Embodied knowledge",             short: "Embodied" },
  6: { name: "Critical evaluation",            short: "Critical" },
  7: { name: "Self-knowledge",                 short: "Self-knowledge" },
};

/**
 * Capacity "level" cell. Foregrounding-scale values (eras 16/25) plus
 * risk-scale values (era 50). Unknown strings fall back to neutral.
 */
export const LEVEL_CONFIG: Record<string, { color: string; tone: "positive" | "negative" | "neutral" }> = {
  "Strongly":      { color: "bg-emerald-700/30 text-emerald-200 border border-emerald-600/30", tone: "positive" },
  "Centrally":     { color: "bg-emerald-700/40 text-emerald-100 border border-emerald-600/40", tone: "positive" },
  "Explicitly named": { color: "bg-emerald-700/40 text-emerald-100 border border-emerald-600/40", tone: "positive" },
  "Moderately":    { color: "bg-sky-700/30 text-sky-200 border border-sky-600/30",              tone: "neutral" },
  "Weakly":        { color: "bg-slate-700/30 text-slate-300 border border-slate-600/30",        tone: "neutral" },
  "No":            { color: "bg-slate-800/60 text-slate-400 border border-slate-700/30",        tone: "neutral" },
  "Critical":      { color: "bg-rose-800/40 text-rose-200 border border-rose-700/30",           tone: "negative" },
  "Low":           { color: "bg-emerald-800/30 text-emerald-200 border border-emerald-700/30",  tone: "positive" },
  "Low-moderate":  { color: "bg-emerald-900/30 text-emerald-300 border border-emerald-800/30",  tone: "positive" },
};

export function safeVerdictConfig(v: string) {
  return (VERDICT_CONFIG as Record<string, { label: string; color: string; dot: string } | undefined>)[v]
    ?? { label: v, color: "bg-muted text-muted-foreground border border-border", dot: "bg-muted-foreground" };
}

export function safeConfidenceConfig(c: string) {
  return (CONFIDENCE_CONFIG as Record<string, { label: string; color: string } | undefined>)[c]
    ?? { label: c, color: "text-muted-foreground" };
}

export function safeTierConfig(t: string) {
  return (TIER_CONFIG as Record<string, { label: string; color: string } | undefined>)[t]
    ?? { label: t || "Tier ?", color: "bg-muted text-muted-foreground border border-border" };
}

export function safeLevelConfig(l: string) {
  const trimmed = (l ?? "").trim();
  return (LEVEL_CONFIG as Record<string, { color: string; tone: string } | undefined>)[trimmed]
    ?? { color: "bg-muted text-muted-foreground border border-border", tone: "neutral" };
}

export function safePhaseStatusConfig(s: string) {
  return (PHASE_STATUS_CONFIG as Record<string, { label: string; color: string; dot: string } | undefined>)[s]
    ?? { label: s, color: "text-muted-foreground", dot: "bg-muted-foreground" };
}

export function safeCapacityConfig(id: number) {
  return CAPACITY_CONFIG[id] ?? { name: `Capacity ${id}`, short: `#${id}` };
}

export function getEraForYear(year: number) {
  return ERAS.find(e => year <= e.start && year >= e.end) ?? ERAS[ERAS.length - 1];
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export function safeCategoryConfig(cat: string) {
  return (CATEGORY_CONFIG as Record<string, { label: string; color: string; icon: string } | undefined>)[cat]
    ?? { label: cat, color: "bg-muted text-muted-foreground", icon: "help-circle" };
}

export function safeCertaintyConfig(cert: string) {
  return (CERTAINTY_CONFIG as Record<string, { label: string; color: string } | undefined>)[cert]
    ?? { label: cert, color: "bg-muted text-muted-foreground" };
}
