#!/usr/bin/env python3
"""Normalize non-standard certainty values to the ICCRA enum.

'disputed' maps to 'approximate': the event is real but its dating/details
are contested — which is exactly what 'approximate' declares. The dispute
itself stays documented in the event description. Modeled on fix_categories.py.
"""

import json
import os
from pathlib import Path

VALID_CERTAINTIES = {"confirmed", "probable", "approximate", "traditional", "legendary"}
MAPPING = {"disputed": "approximate"}

BASE = Path(os.environ.get("BASE_DIR", Path(__file__).resolve().parent.parent))
JSON_DIR = BASE / "outputs" / "json"

fixed_files = 0
fixed_events = 0

for f in sorted(JSON_DIR.glob("*.json")):
    if f.name.endswith(".tmp"):
        continue
    try:
        with open(f) as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, Exception):
        continue

    changed = False
    for event in data.get("events", []):
        cert = event.get("certainty", "")
        if cert not in VALID_CERTAINTIES and cert in MAPPING:
            event["certainty"] = MAPPING[cert]
            changed = True
            fixed_events += 1
            print(f"  {f.name}: '{cert}' -> '{MAPPING[cert]}'")

    if changed:
        with open(f, "w") as fh:
            json.dump(data, fh, indent=2)
        fixed_files += 1

print(f"Fixed {fixed_events} events across {fixed_files} files")
