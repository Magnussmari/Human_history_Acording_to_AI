export type DocumentationLevel = "rich" | "moderate" | "sparse" | "minimal" | "negligible";

export type EventCategory =
  | "political" | "military" | "scientific" | "cultural"
  | "economic" | "demographic" | "technological" | "religious"
  | "environmental" | "exploration" | "legal";

export type CertaintyLevel = "confirmed" | "probable" | "approximate" | "traditional" | "legendary";

export type EdgeRelation = "caused_by" | "led_to" | "contemporary_with" | "contradicts" | "part_of";

export interface Source {
  name: string;
  type: string;
  contemporary: boolean;
}

export interface HistoryEvent {
  id: string;
  title: string;
  region: string;
  coordinates_approx: string | null;
  category: EventCategory;
  description: string;
  key_figures: string[];
  sources: Source[];
  certainty: CertaintyLevel;
  certainty_note: string;
  cross_references: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: EdgeRelation;
  note: string;
}

export interface YearMeta {
  processed_at: string;
  model: string;
  method?: string;
  cost_usd?: number;
  cached?: boolean;
  note?: string;
}

export interface YearData {
  year: number;
  year_label: string;
  era_context: string;
  documentation_level: DocumentationLevel;
  geographic_coverage_gaps: string[];
  events: HistoryEvent[];
  disconfirming_evidence: string;
  historiographic_note: string;
  graph_edges: GraphEdge[];
  _meta?: YearMeta;
}

export interface ChunkManifest {
  total_years: number;
  total_events: number;
  year_range: { newest: number; oldest: number };
  chunks: ChunkInfo[];
  generated_at: string;
}

export interface ChunkInfo {
  file: string;
  start: number;
  end: number;
  count: number;
}

export interface ProgressData {
  completed: number[];
  failed: number[];
  in_progress: number[];
}
