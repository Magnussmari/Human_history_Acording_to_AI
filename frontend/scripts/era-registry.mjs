/**
 * Scholarly-era registry. Source of truth for era boundaries + status.
 *
 * 20 researched eras (Phase 2: 01-13 drifted, Phase 3: 14-20 schema v1.0.0).
 * 6 future buckets (21-50) sourced from VALOR cross-reference map.
 *
 * primaryBroadEra must match a label in frontend/src/lib/constants.ts::ERAS.
 * educationStatus = "pilot-complete" for eras 16/25/50 only.
 */

export const ERA_REGISTRY = [
  // Phase 2 — drifted schema, migration pending
  { id: "era-01", number: 1,  label: "Late Neolithic & Writing",     start: -3300, end: -3000, primaryBroadEra: "Early Bronze", phaseStatus: "phase2-migration-pending", valorSource: "01_dawn_of_written_knowledge.md", educationStatus: "valor-mapped" },
  { id: "era-02", number: 2,  label: "Early Dynastic Egypt",         start: -3100, end: -2700, primaryBroadEra: "Early Bronze", phaseStatus: "phase2-migration-pending", valorSource: "01_dawn_of_written_knowledge.md", educationStatus: "valor-mapped" },
  { id: "era-03", number: 3,  label: "Sumerian City-States",         start: -2900, end: -2300, primaryBroadEra: "Early Bronze", phaseStatus: "phase2-migration-pending", valorSource: "01_dawn_of_written_knowledge.md", educationStatus: "valor-mapped" },
  { id: "era-04", number: 4,  label: "Old Kingdom Egypt",            start: -2686, end: -2181, primaryBroadEra: "Early Bronze", phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-05", number: 5,  label: "Akkadian Empire",              start: -2334, end: -2154, primaryBroadEra: "Early Bronze", phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-06", number: 6,  label: "Middle Bronze Age",            start: -2000, end: -1550, primaryBroadEra: "Bronze Age",   phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-07", number: 7,  label: "Minoan Civilization",          start: -2000, end: -1450, primaryBroadEra: "Bronze Age",   phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-08", number: 8,  label: "Shang Dynasty China",          start: -1600, end: -1046, primaryBroadEra: "Bronze Age",   phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-09", number: 9,  label: "New Kingdom Egypt",            start: -1550, end: -1070, primaryBroadEra: "Bronze Age",   phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-10", number: 10, label: "Hittite Empire",               start: -1650, end: -1200, primaryBroadEra: "Bronze Age",   phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-11", number: 11, label: "Late Bronze Age Collapse",     start: -1200, end: -1100, primaryBroadEra: "Bronze Age",   phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-12", number: 12, label: "Early Iron Age — Phoenicia",   start: -1100, end: -800,  primaryBroadEra: "Iron Age",     phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },
  { id: "era-13", number: 13, label: "Neo-Assyrian Empire",          start: -911,  end: -609,  primaryBroadEra: "Iron Age",     phaseStatus: "phase2-migration-pending", valorSource: null, educationStatus: "unmapped" },

  // Phase 3 — schema v1.0.0 validated, 7/7 agents complete
  // agentFile derives agent number: era 14 → agent-01, era 20 → agent-07
  { id: "era-14", number: 14, label: "Archaic Greece",               start: -800,  end: -480,  primaryBroadEra: "Classical",    phaseStatus: "phase3-complete", valorSource: "02_classical_foundations.md", educationStatus: "valor-mapped", agentFile: "agent-01-results.json" },
  { id: "era-15", number: 15, label: "Persian Achaemenid Empire",    start: -550,  end: -330,  primaryBroadEra: "Classical",    phaseStatus: "phase3-complete", valorSource: null, educationStatus: "unmapped",   agentFile: "agent-02-results.json" },
  { id: "era-16", number: 16, label: "Classical Athens",             start: -508,  end: -323,  primaryBroadEra: "Classical",    phaseStatus: "phase3-complete", valorSource: "02_classical_foundations.md", educationStatus: "pilot-complete", agentFile: "agent-03-results.json", educationFile: "era-16-education.md" },
  { id: "era-17", number: 17, label: "Warring States China",         start: -475,  end: -221,  primaryBroadEra: "Classical",    phaseStatus: "phase3-complete", valorSource: "02_classical_foundations.md", educationStatus: "valor-mapped", agentFile: "agent-04-results.json" },
  { id: "era-18", number: 18, label: "Hellenistic World",            start: -323,  end: -31,   primaryBroadEra: "Classical",    phaseStatus: "phase3-complete", valorSource: "02_classical_foundations.md", educationStatus: "valor-mapped", agentFile: "agent-05-results.json" },
  { id: "era-19", number: 19, label: "Maurya Empire & Ashoka",       start: -322,  end: -185,  primaryBroadEra: "Classical",    phaseStatus: "phase3-complete", valorSource: null, educationStatus: "unmapped",   agentFile: "agent-06-results.json" },
  { id: "era-20", number: 20, label: "Han Dynasty & Silk Road",      start: -206,  end:  220,  primaryBroadEra: "Classical",    phaseStatus: "phase3-complete", valorSource: null, educationStatus: "unmapped",   agentFile: "agent-07-results.json" },

  // Pilot education eras with no Phase 2/3 L1 evidence yet — rendered for the pilot only
  { id: "era-25", number: 25, label: "Islamic Golden Age",           start:  750,  end:  1250, primaryBroadEra: "Medieval",     phaseStatus: "unresearched", valorSource: "03_preservation_and_transmission.md", educationStatus: "pilot-complete", educationFile: "era-25-education.md" },
  { id: "era-50", number: 50, label: "AI Inflection Point",          start:  2020, end:  2026, primaryBroadEra: "Modern",       phaseStatus: "unresearched", valorSource: "08_ai_inflection_point.md", educationStatus: "pilot-complete", educationFile: "era-50-education.md" },
];

/**
 * Future-research buckets. Not rendered as individual eras until both L1 + L2 run.
 * Shown on the homepage as an honest "upcoming research" block.
 */
export const FUTURE_BUCKETS = [
  { id: "bucket-21-30", label: "Late Antiquity → High Medieval",   start:  220, end: 1300, valorSource: "03_preservation_and_transmission.md", eraRange: "21-30" },
  { id: "bucket-31-34", label: "Renaissance & Early Modern",        start: 1300, end: 1700, valorSource: "04_renaissance_knowledge.md",        eraRange: "31-34" },
  { id: "bucket-35-37", label: "Enlightenment",                     start: 1700, end: 1800, valorSource: "05_enlightenment_knowledge.md",      eraRange: "35-37" },
  { id: "bucket-38-41", label: "Industrial Age",                    start: 1800, end: 1900, valorSource: "06_industrial_age.md",               eraRange: "38-41" },
  { id: "bucket-42-47", label: "Information Age",                   start: 1900, end: 2020, valorSource: "07_information_age.md",              eraRange: "42-47" },
  { id: "bucket-48-49", label: "Pre-LLM AI",                        start: 2012, end: 2020, valorSource: "08_ai_inflection_point.md",          eraRange: "48-49" },
];

/**
 * Broad eras (must match frontend/src/lib/constants.ts::ERAS labels).
 * Duplicated here so the aggregator can run without reading the TS file.
 */
export const BROAD_ERAS = [
  "Modern", "Industrial", "Enlightenment", "Renaissance", "Medieval",
  "Early Medieval", "Classical", "Iron Age", "Bronze Age", "Early Bronze",
];
