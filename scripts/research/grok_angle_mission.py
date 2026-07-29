#!/usr/bin/env python3
"""
Grok angle-generation + bias-audit missions for the era expansion.

Grok's job is NOT to supply citations (it cannot reach Scite and its
recall of DOIs is not trustworthy). Its job is to produce, per era:
  1. falsifiable research ANGLES (the `key_claim` seeds a Scite agent verifies)
  2. a Western-centrism / source-bias audit naming what the record under-serves
  3. the contested claims a naive LLM would assert without hedging

Output feeds evidence-layer/eras/phase4-*/angles/ and is consumed by the
Scite triangulation pass, which supplies the actual evidence.

Usage: grok_angle_mission.py <outdir> [era_key ...]
"""
import json, os, re, sys, urllib.request, concurrent.futures, datetime

MODEL = "x-ai/grok-4.5"
VAULT = os.path.expanduser("~/Vault-Secrets/Apps/openrouter-api.md")

ERAS = {
    "transatlantic-slave-trade": ("The Transatlantic Slave Trade", "c. 1526 – 1867 CE",
        "Forced migration of 10–12 million enslaved Africans; cross-reference European/American economic booms against African demographic devastation."),
    "abolition": ("The Age of Abolition & Emancipation", "c. 1780 – 1888 CE",
        "Global movement ending legal slavery, from British/French abolitionist societies to the Lei Áurea in Brazil."),
    "world-wars": ("The Age of the World Wars", "1914 – 1945 CE",
        "WWI, interwar, WWII as one dense era of military, political and technological events."),
    "modern-genocide": ("The Era of Modern Genocide & Mass Atrocity", "1904 – present",
        "Herero and Namaqua, Holodomor, the Holocaust, Cambodia, Rwanda, Srebrenica and after."),
    "black-death": ("The Black Death & Crisis of the Late Middle Ages", "1346 – 1353 CE",
        "Demographic, economic and religious rupture from the most fatal recorded pandemic."),
    "west-african-golden-age": ("The West African Golden Age", "c. 1200 – 1600 CE",
        "Overlapping heights of Mali and Songhai: trans-Saharan trade, Timbuktu scholarship, state formation."),
    "tang-song": ("The Tang & Song Cosmopolitan Era", "618 – 1279 CE",
        "Cultural flowering, printing/compass/gunpowder, commercial revolution in China."),
    "classic-maya": ("The Classic Maya Period", "c. 250 – 900 CE",
        "Peak Maya urbanisation, monumental architecture, astronomy, and the political collapse."),
}

PROMPT = """You are a historiographer preparing research angles for a scholarly evidence layer.

ERA: {label} ({span})
SCOPE: {scope}

A separate agent will verify your output against the peer-reviewed literature via Scite.
So do NOT invent citations, DOIs, or paper titles. If you name a work, name only ones you
are confident exist, and mark each with your own confidence. Your value here is FRAMING,
not retrieval.

Produce STRICT JSON, no prose outside it:

{{
  "era_key": "{key}",
  "angles": [                      // 5-7 falsifiable research claims
    {{
      "key_claim": "a specific, falsifiable claim a scholar could support or refute",
      "why_it_matters": "what it changes about how this era is understood",
      "search_terms": ["3-6 domain-specific search terms for a literature database"],
      "likely_verdict": "supported|contested|refuted",
      "risk": "how this claim could be wrong or overstated"
    }}
  ],
  "bias_audit": {{
    "western_centric_distortions": ["ways the standard account distorts this era"],
    "underserved_perspectives": ["whose sources/voices the record under-represents"],
    "llm_failure_modes": ["what an LLM trained on English web text gets wrong here"],
    "source_asymmetry": "where the documentary record is thick vs thin, and why"
  }},
  "contested_claims": [            // 3-5 things a naive account asserts too confidently
    {{"claim": "...", "status": "contested|refuted|oversimplified", "the_actual_debate": "..."}}
  ],
  "care_notes": "For eras of atrocity/suffering: how this must be represented responsibly — naming conventions, whose framing, what to avoid. Empty string if not applicable.",
  "quantitative_anchors": [        // figures a verifier should check, with your uncertainty
    {{"figure": "...", "value": "...", "confidence": "high|moderate|low", "contested_because": "..."}}
  ]
}}"""


def key():
    with open(VAULT) as f:
        for line in f:
            if line.lower().startswith("| password / secret"):
                return line.split("|")[2].strip()
    raise SystemExit("no OpenRouter key in vault")


def run(k, api):
    label, span, scope = ERAS[k]
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": PROMPT.format(label=label, span=span, scope=scope, key=k)}],
        "temperature": 0.4,
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=body,
        headers={"Authorization": f"Bearer {api}", "Content-Type": "application/json",
                 "X-Title": "Chronograph era expansion"})
    with urllib.request.urlopen(req, timeout=900) as r:
        d = json.loads(r.read())
    txt = d["choices"][0]["message"]["content"]
    m = re.search(r"\{.*\}", txt, re.S)
    parsed = json.loads(m.group(0)) if m else {"raw": txt, "parse_error": True}
    parsed["_meta"] = {"model": MODEL, "generated_at": datetime.datetime.now(datetime.UTC).isoformat(),
                       "usage": d.get("usage", {})}
    return k, parsed


def main():
    outdir = sys.argv[1]
    keys = sys.argv[2:] or list(ERAS)
    os.makedirs(outdir, exist_ok=True)
    api = key()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        for fut in concurrent.futures.as_completed([ex.submit(run, k, api) for k in keys]):
            try:
                k, res = fut.result()
                with open(os.path.join(outdir, f"{k}.json"), "w") as f:
                    json.dump(res, f, indent=2, ensure_ascii=False)
                n = len(res.get("angles", []))
                print(f"OK   {k}: {n} angles, {res['_meta']['usage'].get('total_tokens','?')} tok", flush=True)
            except Exception as e:
                print(f"FAIL {e}", flush=True)


if __name__ == "__main__":
    main()
