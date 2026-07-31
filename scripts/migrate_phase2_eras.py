#!/usr/bin/env python3
"""Migrate phase2 pre-schema era research files to evidence schema v1.0.0.

Deterministic transform only — reorders and renames existing content, maps
free-text enum drift through explicit tables, and fills operational metadata
with values that declare migration provenance. Never invents claims, sources,
or numbers. The mapping was piloted by hand on era-01 (see MIGRATION-NOTES.md
in the output directory).

Files whose structure lacks per-paper scite metrics (eras 05-08, 12) cannot
reach v1 without fabricating counts; they are skipped and listed as
requires-re-research.

Usage: python3 scripts/migrate_phase2_eras.py
Output: evidence-layer/eras/phase2-eras-01-13/migrated-v1/era-NN.v1.json
"""

import json
import os
from pathlib import Path

from jsonschema import Draft202012Validator

BASE = Path(os.environ.get("BASE_DIR", Path(__file__).resolve().parent.parent))
SRC = BASE / "evidence-layer/eras/phase2-eras-01-13/outputs/json"
OUT = BASE / "evidence-layer/eras/phase2-eras-01-13/migrated-v1"
SCHEMA = BASE / "evidence-layer/methodology/scite-skill-system/reference/schema.json"

MISSION_ID = "2026-07-31-phase2-migration-eras-01-13"
MODEL = "unknown (phase2 pre-schema run 2026-04; model not recorded)"

# Explicit verdict table — every observed phase2 value, nothing inferred at runtime.
VERDICT_MAP = {
    "supported": "supported",
    "supported with nuance": "supported",
    "substantially supported with nuance": "supported",
    "partially supported with significant nuance": "contested",
    "partially supported — requires qualification": "contested",
}


def map_verdict(raw):
    v = (raw or "").strip().lower()
    if v in VERDICT_MAP:
        return VERDICT_MAP[v]
    if v.startswith("contested"):
        return "contested"
    if v.startswith("supported") or v.startswith("substantially supported"):
        return "supported"
    if v.startswith("partially supported"):
        return "contested"
    raise ValueError(f"unmapped verdict: {raw!r}")


def map_confidence(raw):
    if isinstance(raw, (int, float)):
        # Lossy numeric->band conversion; original value is preserved in the
        # per-era note emitted below.
        return "high" if raw >= 0.75 else "moderate" if raw >= 0.5 else "low"
    c = (raw or "").strip().lower()
    if c == "medium":
        return "moderate"
    if c in {"high", "moderate", "low", "unknown"}:
        return c
    raise ValueError(f"unmapped confidence: {raw!r}")


# Explicit contested-claim status table for every observed phase2 value.
STATUS_MAP = {
    "contested": "contested",
    "contested/revised": "contested",
    "challenged": "contested",
    "seriously challenged": "contested",
    "actively debated": "contested",
    "influential but debated": "contested",
    "nuanced": "contested",
    "supported": "supported",
    "widely accepted with caveats": "supported",
    "established history — not contested": "supported",
    "partially supported — requires qualification": "contested",
    # era-01: dispute resolved in favor of the claim (independent invention);
    # basis text records the supporting evidence.
    "recently resolved": "supported",
    "largely rejected": "refuted",
    "rejected by current scholarship": "refuted",
    "weakly supported / mostly rejected": "refuted",
    "unresolved": "unresolved",
    "uncertain": "unresolved",
}


def normalize_debate(sd, notes):
    """Map debate-shape drift onto the five required v1 fields — reformat only."""
    required = {"question", "position_a", "position_b", "current_consensus", "resolution_needed"}

    def flatten(v):
        if isinstance(v, dict):
            label = v.get("label", "")
            summary = v.get("summary", "")
            return f"{label}: {summary}" if label else summary
        return v

    if required.issubset(sd.keys()):
        out = {k: flatten(sd[k]) for k in required}
        if any(isinstance(sd[k], dict) for k in required):
            notes.append("scholarly_debate positions flattened from label/summary objects")
        return out
    if {"topic", "summary", "primary_positions"}.issubset(sd.keys()):
        pos = sd["primary_positions"]

        def fmt(p):
            return f"{p.get('position', '')} ({p.get('proponents', 'proponents unrecorded')}) — status: {p.get('status', 'unrecorded')}"

        notes.append("scholarly_debate reshaped from topic/summary/primary_positions")
        return {
            "question": sd["topic"],
            "position_a": fmt(pos[0]) if len(pos) > 0 else "unrecorded in phase2 data",
            "position_b": fmt(pos[1]) if len(pos) > 1 else "unrecorded in phase2 data",
            "current_consensus": sd["summary"],
            "resolution_needed": sd.get("resolution_needed") or "unrecorded in phase2 data",
        }
    raise ValueError(f"unrecognized scholarly_debate shape: {sorted(sd.keys())}")


def migrate(old, era_num):
    notes = []
    angle = f"{old.get('era_label', f'era-{era_num}')} ({old.get('date_range', 'range unrecorded')}): {old['key_claim']}"

    pwen = old.get("papers_with_editorial_notices", 0)
    if isinstance(pwen, int):
        pwen = {"count": pwen, "dois": []}

    conf_raw = old.get("key_claim_confidence")
    if isinstance(conf_raw, (int, float)):
        notes.append(f"numeric confidence {conf_raw} banded to '{map_confidence(conf_raw)}'")

    evidence = []
    for e in old["scite_evidence"]:
        tally = e.get("tally") or {}
        supporting = e.get("supporting_count", tally.get("supporting"))
        contrasting = e.get("contrasting_count", tally.get("contrasting"))
        mentioning = e.get("mentioning_count", tally.get("mentioning"))
        citing = e.get(
            "citing_publications",
            tally.get("citingPublications", tally.get("citing_publications")),
        )
        # Counts are nullable in schema v1 — entries whose phase2 agent did not
        # record scite metrics keep honest nulls rather than invented numbers.

        ratio = e.get("support_ratio")
        if ratio is None and supporting is not None and contrasting is not None:
            # Pure arithmetic on existing counts; schema: null when both are 0.
            ratio = round(supporting / (supporting + contrasting), 3) if (supporting + contrasting) > 0 else None

        finding = e.get("key_finding") or e.get("relevance") or e.get("key_quote") or ""
        if not finding:
            exc = e.get("key_excerpts") or e.get("key_excerpt")
            finding = exc[0] if isinstance(exc, list) and exc else (exc or "unrecorded in phase2 data")

        oa = e.get("open_access", e.get("is_oa", e.get("isOa")))
        access = {"status": "open"} if oa is True else {"status": "unknown"}
        if e.get("oa_url"):
            access["url"] = e["oa_url"]

        ev = {
            "doi": e.get("doi") or e.get("paper_doi") or "",
            "title": e.get("title") or e.get("paper_title") or "",
            "authors": e.get("authors") if isinstance(e.get("authors"), list) else ([e["authors"]] if e.get("authors") else []),
            "journal": e.get("journal") or e.get("publisher") or "unrecorded in phase2 data",
            "year": e.get("year"),
            "supporting_count": supporting,
            "contrasting_count": contrasting,
            "mentioning_count": mentioning,
            "citing_publications_count": citing,
            "support_ratio": ratio,
            "tier": e.get("tier") or "Tier unknown",
            "editorial_notices": e.get("editorial_notices") or [],
            "key_finding": finding,
            "access": access,
        }
        excerpt = e.get("excerpt") or e.get("key_quote") or e.get("key_excerpt")
        if not excerpt:
            exc = e.get("key_excerpts")
            excerpt = " | ".join(exc) if isinstance(exc, list) and exc else exc
        if excerpt:
            ev["excerpt"] = excerpt
        evidence.append(ev)

    new = {
        "schema_version": "1.0.0",
        "mission_id": MISSION_ID,
        "agent_id": "agent-00",  # migration marker, not a research agent
        "angle": angle,
        "angle_code": "CUSTOM",
        "research_timestamp": old["research_timestamp"],
        "model": MODEL,
        "key_claim": old["key_claim"],
        "verdict": map_verdict(old["key_claim_verdict"]),
        "confidence": map_confidence(conf_raw),
        "searches_executed": len(old["searches_executed"]) if isinstance(old.get("searches_executed"), list) else old["searches_executed"],
        "papers_found_total": old["papers_found_total"],
        "papers_with_editorial_notices": pwen,
        "discipline_branch": "humanities",
        "scholarly_debate": normalize_debate(old["scholarly_debate"], notes),
        "evidence": evidence,
        "gaps_observed": old.get("academic_gaps") or [],
        "apa_references": old.get("apa_references") or [],
    }
    if not old.get("academic_gaps"):
        notes.append("no academic_gaps recorded in phase2 data -> empty gaps_observed")
    if not old.get("apa_references"):
        notes.append("no apa_references recorded in phase2 data -> empty list")

    contested = old.get("contested_scholarly_claims")
    if contested:
        new["contested_claims"] = [
            {
                "claim": c["claim"],
                "status": STATUS_MAP[c["status"].strip().lower()],
                "evidentiary_basis": c.get("basis") or "unrecorded in phase2 data",
            }
            for c in contested
        ]
        for c in contested:
            mapped = STATUS_MAP[c["status"].strip().lower()]
            if mapped != c["status"].strip().lower():
                notes.append(f"contested status {c['status']!r} -> '{mapped}'")

    return new, notes


def main():
    OUT.mkdir(exist_ok=True)
    validator = Draft202012Validator(json.loads(SCHEMA.read_text()))

    migrated, skipped, failed = [], [], []
    for f in sorted(SRC.glob("era-*.json")):
        old = json.loads(f.read_text())
        num = f.stem.split("-")[1]

        if "scite_evidence" not in old or old.get("scite_evidence") is None:
            skipped.append(f.name)
            print(f"SKIP {f.name}: no scite_evidence — requires re-research, not migration")
            continue

        try:
            new, notes = migrate(old, num)
        except ValueError as exc:
            skipped.append(f.name)
            print(f"SKIP {f.name}: {exc} — requires re-research, not migration")
            continue
        errors = sorted(validator.iter_errors(new), key=lambda e: list(e.path))
        if errors:
            failed.append(f.name)
            print(f"FAIL {f.name}: {len(errors)} schema errors")
            for e in errors[:5]:
                print(f"    {'/'.join(map(str, e.path))}: {e.message[:100]}")
            continue

        out = OUT / f"era-{num}.v1.json"
        out.write_text(json.dumps(new, indent=2, ensure_ascii=False) + "\n")
        migrated.append(f.name)
        note_str = ("; ".join(notes)) if notes else "clean"
        print(f"OK   {f.name} -> {out.name} ({len(new['evidence'])} evidence entries; {note_str})")

    print(f"\nmigrated: {len(migrated)}  skipped(re-research): {len(skipped)}  failed: {len(failed)}")
    if skipped:
        print("requires re-research:", ", ".join(skipped))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
