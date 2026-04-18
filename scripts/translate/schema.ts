/**
 * ICCRA schema validator — mirrors scripts/validate_corpus.py
 * Used to validate English source AND translated output structurally.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import Ajv, { type JSONSchemaType, type ErrorObject } from "ajv";

export const VALID_CATEGORIES = [
  "political", "military", "scientific", "cultural", "economic",
  "demographic", "technological", "religious", "environmental",
  "exploration", "legal",
] as const;

export const VALID_CERTAINTIES = [
  "confirmed", "probable", "approximate", "traditional", "legendary",
] as const;

export const VALID_DOC_LEVELS = [
  "rich", "moderate", "sparse", "minimal", "negligible",
] as const;

export const VALID_SOURCE_TYPES = [
  "primary_text", "archaeological", "epigraphic", "numismatic",
  "chronicle", "historiographic_consensus", "oral_tradition", "later_compilation",
] as const;

export const VALID_RELATIONS = [
  "caused_by", "led_to", "contemporary_with", "contradicts", "part_of",
] as const;

export interface SourceRef {
  name: string;
  type?: string;
  contemporary?: boolean;
  [key: string]: unknown;
}

export interface YearEvent {
  id: string;
  title: string;
  region: string;
  coordinates_approx?: string;
  category: typeof VALID_CATEGORIES[number];
  description: string;
  key_figures: string[];
  sources: SourceRef[];
  certainty: typeof VALID_CERTAINTIES[number];
  certainty_note?: string;
  cross_references?: string[];
  [key: string]: unknown;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
  note?: string;
}

export interface YearDoc {
  year: number;
  year_label: string;
  era_context: string;
  documentation_level: typeof VALID_DOC_LEVELS[number];
  geographic_coverage_gaps: string[];
  events: YearEvent[];
  disconfirming_evidence: string;
  historiographic_note: string;
  graph_edges: GraphEdge[];
  _meta?: Record<string, unknown>;
  [key: string]: unknown;
}

const schema: JSONSchemaType<YearDoc> = {
  type: "object",
  required: [
    "year", "year_label", "era_context", "documentation_level",
    "geographic_coverage_gaps", "events", "disconfirming_evidence",
    "historiographic_note", "graph_edges",
  ],
  properties: {
    year: { type: "integer" },
    year_label: { type: "string", minLength: 1 },
    era_context: { type: "string", minLength: 1 },
    documentation_level: { type: "string", enum: [...VALID_DOC_LEVELS] },
    geographic_coverage_gaps: { type: "array", items: { type: "string" } },
    events: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "region", "category", "description", "key_figures", "sources", "certainty"],
        properties: {
          id: { type: "string", minLength: 1 },
          title: { type: "string", minLength: 3 },
          region: { type: "string", minLength: 1 },
          coordinates_approx: { type: "string", nullable: true },
          category: { type: "string", enum: [...VALID_CATEGORIES] },
          description: { type: "string", minLength: 1 },
          key_figures: { type: "array", items: { type: "string" } },
          sources: {
            type: "array",
            items: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string", minLength: 1 },
                type: { type: "string", nullable: true },
                contemporary: { type: "boolean", nullable: true },
              },
              additionalProperties: true,
            },
          },
          certainty: { type: "string", enum: [...VALID_CERTAINTIES] },
          certainty_note: { type: "string", nullable: true },
          cross_references: { type: "array", items: { type: "string" }, nullable: true },
        },
        additionalProperties: true,
      },
    },
    disconfirming_evidence: { type: "string", minLength: 1 },
    historiographic_note: { type: "string", minLength: 1 },
    graph_edges: {
      type: "array",
      items: {
        type: "object",
        required: ["from", "to", "relation"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          relation: { type: "string" },
          note: { type: "string", nullable: true },
        },
        additionalProperties: true,
      },
    },
    _meta: { type: "object", nullable: true, additionalProperties: true } as unknown as JSONSchemaType<Record<string, unknown> | undefined>,
  },
  additionalProperties: true,
};

const ajv = new Ajv({ allErrors: true, strict: false });
const validateFn = ajv.compile(schema);

export interface ValidationReport {
  valid: boolean;
  errors: string[];
}

export function validateYearDoc(doc: unknown): ValidationReport {
  const ok = validateFn(doc);
  if (ok) return { valid: true, errors: [] };
  const errors = (validateFn.errors ?? []).map(formatError);
  return { valid: false, errors };
}

function formatError(err: ErrorObject): string {
  return `${err.instancePath || "(root)"} ${err.message ?? "invalid"}${err.params ? ` — ${JSON.stringify(err.params)}` : ""}`;
}
