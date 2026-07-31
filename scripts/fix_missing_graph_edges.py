#!/usr/bin/env python3
"""Add an empty graph_edges array to year files missing the required key.

An empty array is the honest value here: it declares "no cross-year edges
researched" without fabricating connections. Modeled on fix_categories.py.
"""

import json
import os
from pathlib import Path

BASE = Path(os.environ.get("BASE_DIR", Path(__file__).resolve().parent.parent))
JSON_DIR = BASE / "outputs" / "json"

fixed = 0

for f in sorted(JSON_DIR.glob("*.json")):
    if f.name.endswith(".tmp"):
        continue
    try:
        with open(f) as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, Exception):
        continue

    if "graph_edges" not in data:
        data["graph_edges"] = []
        with open(f, "w") as fh:
            json.dump(data, fh, indent=2)
        fixed += 1
        print(f"  {f.name}: added empty graph_edges")

print(f"Fixed {fixed} files")
