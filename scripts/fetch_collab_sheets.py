#!/usr/bin/env python3
"""Fetch collaborative Google Sheet tabs (via OAuth) for Cursor sync."""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sheets_client import load_config, open_workbook  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT_META = ROOT / "collab" / "LAST_FETCH.json"
SNAPSHOT = ROOT / "collab" / "LAST_SYNCED_SNAPSHOT.txt"
COMBINED = ROOT / "collab" / "CURRENT_FROM_SHEETS.txt"

PREFERRED_TABS = ["לוח זמנים", "ימים", "מלונות", "להזמין", "רעיונות"]


def main() -> int:
    cfg = load_config()
    if not (cfg.get("googleSheetsId") or cfg.get("googleSheetsUrl")):
        raise SystemExit("No googleSheetsUrl/Id in collab/config.json")

    wb = open_workbook(cfg)
    parts = []
    digests = {}
    for title in PREFERRED_TABS:
        try:
            ws = wb.worksheet(title)
        except Exception:
            continue
        values = ws.get_all_values()
        lines = ["\t".join(row) for row in values]
        text = "\n".join(lines) + ("\n" if lines else "")
        digests[title] = hashlib.sha256(text.encode("utf-8")).hexdigest()
        parts.append(f"===== {title} =====\n{text}")
        print(f"Fetched {title}: {max(len(values) - 1, 0)} rows")

    combined = "\n".join(parts)
    COMBINED.write_text(combined, encoding="utf-8")
    digest = hashlib.sha256(combined.encode("utf-8")).hexdigest()

    prev = None
    if OUT_META.exists():
        try:
            prev = json.loads(OUT_META.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            prev = None

    meta = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source": "sheets",
        "googleSheetsId": cfg.get("googleSheetsId") or wb.id,
        "googleSheetsUrl": cfg.get("googleSheetsUrl")
        or f"https://docs.google.com/spreadsheets/d/{wb.id}/edit",
        "sha256": digest,
        "tabDigests": digests,
        "changedSinceLastFetch": (not prev) or prev.get("sha256") != digest,
        "changedSinceLastSync": True,
    }
    if SNAPSHOT.exists():
        snap = SNAPSHOT.read_text(encoding="utf-8")
        meta["snapshotSha256"] = hashlib.sha256(snap.encode("utf-8")).hexdigest()
        meta["changedSinceLastSync"] = meta["snapshotSha256"] != digest
    else:
        meta["snapshotSha256"] = None

    OUT_META.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {COMBINED.name}")
    print(f"Changed since last fetch: {meta['changedSinceLastFetch']}")
    print(f"Changed since last sync: {meta['changedSinceLastSync']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
