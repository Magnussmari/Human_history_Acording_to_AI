/**
 * TypeScript types for Layer 2 (scholarly eras + education).
 * Mirrors schema v1.0.0 at evidence-layer/methodology/scite-skill-system/reference/schema.json.
 * Nullable/optional fields match the schema's humanities-branch concessions.
 */

export type Verdict =
  | "supported"
  | "contested"
  | "refuted"
  | "unresolved"
  | "insufficient-evidence";

export type Confidence = "high" | "moderate" | "low" | "unknown";

export type Tier = "Tier 1" | "Tier 2" | "Tier 3" | "Tier unknown";

export type DisciplineBranch =
  | "biomedical"
  | "humanities"
  | "social"
  | "natural-science"
  | "engineering"
  | "mixed"
  | "unknown";

export type EditorialType =
  | "retraction"
  | "correction"
  | "expression-of-concern"
  | "clarification";

export type AccessStatus =
  | "open"
  | "institutional"
  | "purchase"
  | "publisher"
  | "unknown";

export type AngleCode =
  | "FOUND" | "RECENT" | "META" | "CONTRA" | "METHOD" | "CLINICAL"
  | "ADJACENT" | "DEBATE" | "AUTHOR" | "INST" | "SOURCE" | "SUPPORT"
  | "RETRACT" | "AREA" | "INTERSECT" | "RAPID" | "IMPACT" | "OPTION"
  | "HEAD2HEAD" | "EFFECT" | "SAFETY" | "COST" | "GUIDE" | "REAL"
  | "PAPER" | "CITING" | "CONTEXT" | "CUSTOM";

export interface EditorialNotice {
  type: EditorialType;
  date?: string;
  note?: string;
}

export interface ScholarlyDebate {
  question: string;
  position_a: string;
  position_b: string;
  current_consensus: string;
  resolution_needed: string;
}

export type ClaimStatus = Extract<Verdict, "supported" | "contested" | "refuted" | "unresolved">;

export interface ContestedClaim {
  claim: string;
  status: ClaimStatus;
  evidentiary_basis: string;
  key_citations?: string[];
}

export interface SciteEvidence {
  doi: string;
  title: string;
  authors: string[];
  journal: string;
  year: number | null;
  publication_type?: string | null;

  supporting_count: number | null;
  contrasting_count: number | null;
  mentioning_count: number | null;
  citing_publications_count: number | null;
  support_ratio: number | null;

  tier: Tier;
  tier_rule_applied?: string;

  editorial_notices: EditorialNotice[];

  key_finding: string;
  excerpt?: string | null;

  access: {
    status: AccessStatus;
    url?: string;
  };

  found_by_searches?: string[];
  // The schema declares additionalProperties:false; in practice some Phase 3
  // entries carry a `publisher` field (see aggregator warning). We keep this
  // loose on the client side.
  [extra: string]: unknown;
}

export interface SciteAgentResult {
  schema_version: "1.0.0";
  mission_id: string;
  agent_id: string;
  angle: string;
  angle_code: AngleCode | string;
  research_timestamp: string;
  model: string;

  key_claim: string;
  verdict: Verdict;
  confidence: Confidence;

  searches_executed: number;
  searches_planned?: number;

  papers_found_total: number;
  papers_with_editorial_notices: {
    count: number;
    dois: string[];
  };

  discipline_branch: DisciplineBranch;
  scholarly_debate: ScholarlyDebate;
  contested_claims?: ContestedClaim[];
  evidence: SciteEvidence[];

  gaps_observed?: string[];
  apa_references: string[];
  calls_consumed?: number;
}

// ─── Education layer (parsed from pilot markdown) ──────────────────────────

export type CapacityLevel = "Strongly" | "Centrally" | "Moderately" | "Weakly" | "No" | string;

export interface CapacityEntry {
  id: number;
  name: string;
  /** "Strongly"/"Centrally" in eras 16/25; "Critical"/"Low" in era-50. Rendered via safeLevelConfig. */
  level: CapacityLevel;
  evidence: string;
}

export interface ConstantEntry {
  id: number;
  name: string;
  state: string;
}

export interface EducationPilotData {
  status: "pilot-complete";
  frontmatter: Record<string, string>;
  coreQuestion: string;
  capacities: CapacityEntry[];
  constants: ConstantEntry[];
  institutions: string[][];
  pedagogicalForm: string;
  canonicalTexts: string[][];
  stageMapping: string[][];
  centralDebate: { position: string; knowledge: string; aiQuestion: string }[];
  valorFindings: string[];
  aiEraImplication: string;
  crossRefL1: string;
  verification: string;
  phase1Source: string;
}

export interface EducationValorMapped {
  status: "valor-mapped";
  valorSource: string | null;
  note: string;
}

export interface EducationUnmapped {
  status: "unmapped";
}

export interface EducationParseFailed {
  status: "parse-failed";
  error: string;
}

export type EducationData =
  | EducationPilotData
  | EducationValorMapped
  | EducationUnmapped
  | EducationParseFailed;

// ─── Era bundle + registry ─────────────────────────────────────────────────

export type PhaseStatus =
  | "phase3-complete"
  | "phase2-migration-pending"
  | "unresearched";

export type EducationStatus =
  | "pilot-complete"
  | "valor-mapped"
  | "unmapped";

/** Agent-result shape when phaseStatus === "phase3-complete". */
export type EraScholarlyPhase3 = SciteAgentResult;

export interface EraScholarlyStub {
  status: "migration-pending" | "unresearched";
  sourcePath?: string;
  note?: string;
}

export type EraScholarlyData = EraScholarlyPhase3 | EraScholarlyStub;

export function isScholarlyStub(s: EraScholarlyData): s is EraScholarlyStub {
  return typeof (s as EraScholarlyStub).status === "string";
}

export interface EraBundle {
  id: string;
  number: number;
  label: string;
  start: number;
  end: number;
  primaryBroadEra: string;
  phaseStatus: PhaseStatus;
  valorSource: string | null;
  educationStatus: EducationStatus;
  scholarly: EraScholarlyData;
  education: EducationData;
}

export interface EraRegistryEntry {
  id: string;
  number: number;
  label: string;
  start: number;
  end: number;
  primaryBroadEra: string;
  phaseStatus: PhaseStatus;
  educationStatus: EducationStatus;
}

export interface FutureBucket {
  id: string;
  label: string;
  start: number;
  end: number;
  valorSource: string;
  eraRange: string;
}

export interface EraIndex {
  generated_at: string;
  totals: {
    registered: number;
    phase3Complete: number;
    phase2Pending: number;
    unresearched: number;
    educationPilots: number;
  };
  registry: EraRegistryEntry[];
  futureBuckets: FutureBucket[];
}

// ─── Bibliography + VALOR map ──────────────────────────────────────────────

export interface BibliographyEntry {
  type: string;
  key: string;
  title?: string;
  author?: string;
  year?: string;
  journal?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  institution?: string;
  note?: string;
  keywords?: string;
  volume?: string;
  [field: string]: string | undefined;
}

export type Bibliography = Record<string, BibliographyEntry>;

export interface ValorMapEntry {
  file: string;
  eraRange: string;
  calendarSpan: string;
  themes: string;
}

export interface ValorMap {
  sources: ValorMapEntry[];
  generated_at: string;
}
