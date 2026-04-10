# Human History — Year Research Prompt (Smarason Method / Tier C)

> Daemon-executed research prompt. One run per year, 2025 CE → ~3200 BCE.
> Parameterised by {{YEAR}} and {{YEAR_LABEL}}.

---

## Intent

Map the most significant known historical events for the year **{{YEAR}}** ({{YEAR_LABEL}}) as part of a comprehensive, year-by-year chronicle of human history. The output must be factually grounded, globally inclusive, honest about uncertainty, and structured for automated synthesis, graph indexing, and adversarial review.

## Context

- This prompt is one of ~5,226 identical runs covering every year from 2025 CE to ~3200 BCE.
- Outputs will be machine-aggregated into a unified dataset — structural consistency is non-negotiable.
- Documentation density varies enormously across this range: modern years have rich multi-source records; ancient years may have only archaeological inference or nothing at all.
- All years use the proleptic Gregorian calendar. Convert from original calendar systems (Julian, Islamic, Chinese, Hebrew, Egyptian, etc.) and note the original dating where relevant.
- This is AI-authored history. The value is not in pretending to be a textbook but in honest, structured, citation-aware synthesis that explicitly marks its own confidence levels and gaps.

## Constraints

- **Do not fabricate.** If nothing specific is known for this year, say so. Describe the broader era context and move on. An empty events array with honest era_context is infinitely more valuable than hallucinated entries.
- **Do not default to Western-centric history.** Actively cover Asia, Africa, the Middle East, the Americas, Oceania, and the Steppe where sources exist. If your training data is thin for a region in a given period, flag that as a known gap rather than omitting the region silently.
- **Anti-sycophancy protocol (mandatory):** Identify any evidence encountered during research that undermines, contradicts, or complicates the significance attributed to events listed. Do not omit findings because they are inconvenient. Report disconfirming or complicating evidence in the dedicated field below. If a commonly repeated historical claim for this year is disputed by modern scholarship, surface the dispute.
- **Source attribution is required.** Every event must name its source tradition — primary text, archaeological evidence, historiographic consensus, or chronicle. "General knowledge" is not acceptable. If the best you can do is "Attested in later chronicles, not contemporary sources" — say that.
- **No anachronism.** Do not project modern categories onto pre-modern events. A Bronze Age palace fire is not an "economic crisis." Use period-appropriate framing.

## Authority

Operate at full discretion within these constraints. Choose which events are most significant based on historical impact — political, military, scientific, cultural, economic, demographic, technological, religious, environmental, or exploratory. You determine the number of events: 15–25 for well-documented modern years; as few as 0–2 for poorly attested ancient years. Quality and honesty over quantity.

## Reporting

Respond in **valid JSON only** — no preamble, no markdown fencing, no commentary outside the JSON structure.

```json
{
  "year": {{YEAR}},
  "year_label": "{{YEAR_LABEL}}",
  "era_context": "2–4 sentence description of the broader historical period this year falls within. What civilisations, dynasties, or movements were active? What defines this era?",
  "documentation_level": "rich | moderate | sparse | minimal | negligible",
  "geographic_coverage_gaps": ["Regions or civilisations where sources likely exist but were not retrieved or are underrepresented in training data."],
  "events": [
    {
      "id": "{{YEAR}}-001",
      "title": "Short event title",
      "region": "Geographic region, civilisation, or polity",
      "coordinates_approx": "Approximate lat/lon or null if not meaningful",
      "category": "political | military | scientific | cultural | economic | demographic | technological | religious | environmental | exploration | legal",
      "description": "3–5 sentence description. What happened, why it mattered, and what it led to. Use period-appropriate framing.",
      "key_figures": ["Name (role/title)"],
      "sources": [
        {
          "name": "Source name (e.g., Thucydides, History of the Peloponnesian War; Archaeological evidence from Tel Megiddo; Shiji by Sima Qian)",
          "type": "primary_text | archaeological | epigraphic | numismatic | chronicle | historiographic_consensus | oral_tradition | later_compilation",
          "contemporary": true
        }
      ],
      "certainty": "confirmed | probable | approximate | traditional | legendary",
      "certainty_note": "Brief explanation of dating confidence. Why this certainty level?",
      "cross_references": ["IDs of related events in other years if known, e.g., 'Follows from -490-003'"]
    }
  ],
  "disconfirming_evidence": "Mandatory section. What commonly held beliefs about this year are disputed by modern scholarship? What events listed above have contested significance, disputed dating, or alternative interpretations? If none found, state: 'No disconfirming evidence identified for events listed.' Do not leave empty.",
  "historiographic_note": "How reliable is the historical record for this year overall? What biases shape the surviving sources (e.g., court-sponsored chronicles, victor narratives, colonial-era archaeology)? What is likely missing?",
  "graph_edges": [
    {
      "from": "{{YEAR}}-001",
      "to": "TARGET_YEAR-EVENT_ID or concept",
      "relation": "caused_by | led_to | contemporary_with | contradicts | part_of",
      "note": "Brief explanation of the relationship"
    }
  ]
}
```

### Key Definitions
- **confirmed**: Strong contemporary documentary or archaeological evidence.
- **probable**: Scholarly consensus with minor dating uncertainty (±1–2 years).
- **approximate**: Event occurred within ~5–10 years of this date; assigned here by convention.
- **traditional**: Date from tradition, religious texts, or much later sources. May have symbolic rather than historical basis.
- **legendary**: Source is mythological or semi-legendary. Included for cultural significance, not as historical fact.

### Source Type Definitions
- **primary_text**: Written by a contemporary witness or participant.
- **archaeological**: Material evidence (excavation, artefact, stratigraphy).
- **epigraphic**: Inscriptions on stone, metal, clay, etc.
- **numismatic**: Evidence from coins or currency.
- **chronicle**: Near-contemporary historical record, often compiled within a generation.
- **historiographic_consensus**: No single source; accepted by the weight of modern scholarship.
- **oral_tradition**: Transmitted orally before being recorded; dating is inherently uncertain.
- **later_compilation**: Written significantly after the events described.
