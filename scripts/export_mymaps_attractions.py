#!/usr/bin/env python3
"""Export itinerary sights for Google My Maps.

Google My Maps has no public write API, so this prepares an import-ready
layer: every pin tagged `attraction` (to match the website category).

Outputs:
  collab/mymaps/attractions.csv
  collab/mymaps/attractions.kml

And a shared Sheet tab «אטרקציות» you can Import into My Maps.

Usage:
  python3 scripts/export_mymaps_attractions.py
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import defaultdict
from html import escape as html_escape
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sheets_client import load_config, open_workbook, save_config  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "collab" / "mymaps"
HE_DATA = ROOT / "docs" / "js" / "he-data.js"
TAB_TITLE = "אטרקציות"
TAG = "attraction"

SIGHT_TAGS = {
    "must-see",
    "temple",
    "shrine",
    "park",
    "view",
    "culture",
    "icon",
    "nature",
    "neighborhood",
}
KIND_ORDER = (
    "temple",
    "shrine",
    "park",
    "view",
    "nature",
    "culture",
    "icon",
    "market",
    "food",
    "shopping",
    "nightlife",
    "neighborhood",
    "onsen",
    "must-see",
)
HEADERS = [
    "Name",
    "Latitude",
    "Longitude",
    "Description",
    "Tag",
    "Kind",
    "City",
    "Country",
    "Local name",
    "Days",
    "Place ID",
]


def load_trip():
    path = ROOT / "scripts" / "build_data.py"
    src = path.read_text(encoding="utf-8")
    ns = {"__file__": str(path), "__name__": "build_data"}
    exec(compile(src[: src.find("\njs = f")], str(path), "exec"), ns)
    he_m = re.search(r"const HE = (\{.*?\n\})\n;", HE_DATA.read_text(encoding="utf-8"), re.S)
    he = json.loads(he_m.group(1)) if he_m else {}
    return ns["DAYS"], ns["PLACES"], he.get("places") or {}


def itinerary_days(days) -> dict[str, list[str]]:
    by_place: dict[str, list[str]] = defaultdict(list)
    seen: dict[str, set[str]] = defaultdict(set)
    for d in days:
        y, m, dayn = d["date"].split("-")
        label = f"{int(dayn)}/{int(m)}"
        ids = list(d.get("placeIds") or [])
        for item in d.get("timeline") or []:
            pid = item.get("placeId")
            if pid:
                ids.append(pid)
        for pid in ids:
            if pid and label not in seen[pid]:
                seen[pid].add(label)
                by_place[pid].append(label)
    return by_place


def is_attraction(place: dict, on_itinerary: set[str]) -> bool:
    tags = set(place.get("tags") or [])
    if "hotel" in tags:
        return False
    if place.get("lat") in (None, "") or place.get("lng") in (None, ""):
        return False
    if "transport" in tags:
        return bool(tags & {"view", "park", "nature", "icon"})
    if "inspiration" in tags and not (tags & (SIGHT_TAGS | {"booked", "onsen"})):
        return False
    if tags & SIGHT_TAGS:
        return True
    if place["id"] in on_itinerary:
        return True
    if "onsen" in tags:
        return True
    return False


def kind_for(tags: list[str]) -> str:
    tagset = set(tags or [])
    for k in KIND_ORDER:
        if k in tagset:
            return k
    return TAG


def description_for(place: dict, he_places: dict) -> str:
    he = (he_places.get(place["id"]) or {}).get("blurb") or ""
    en = place.get("blurb") or ""
    text = (he or en).strip()
    return text[:900]


def collect_rows(days, places, he_places) -> list[dict]:
    by_day = itinerary_days(days)
    on_itinerary = set(by_day)
    rows = []
    for place in places.values():
        if not is_attraction(place, on_itinerary):
            continue
        rows.append(
            {
                "Name": place["name"],
                "Latitude": f"{place['lat']:.6f}",
                "Longitude": f"{place['lng']:.6f}",
                "Description": description_for(place, he_places),
                "Tag": TAG,
                "Kind": kind_for(place.get("tags") or []),
                "City": place.get("city") or "",
                "Country": place.get("country") or "",
                "Local name": place.get("nameJa") or "",
                "Days": ", ".join(by_day.get(place["id"]) or []),
                "Place ID": place["id"],
            }
        )
    city_order = [
        "Seoul",
        "Tokyo",
        "Kawaguchiko",
        "Hakone",
        "Kyoto",
        "Osaka",
        "Hiroshima",
    ]
    rank = {c: i for i, c in enumerate(city_order)}
    rows.sort(key=lambda r: (rank.get(r["City"], 50), r["City"], r["Name"].lower()))
    return rows


def write_csv(rows: list[dict]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / "attractions.csv"
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADERS)
        w.writeheader()
        w.writerows(rows)
    return path


def write_kml(rows: list[dict]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / "attractions.kml"
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        "<Document>",
        "<name>Korea + Japan 2026 — Attractions</name>",
        "<Style id=\"attraction\">",
        "  <IconStyle>",
        "    <scale>1.1</scale>",
        "    <Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-stars.png</href></Icon>",
        "  </IconStyle>",
        "</Style>",
        "<Folder>",
        "<name>Attractions</name>",
    ]
    for r in rows:
        desc = html_escape(r["Description"])
        extra = " · ".join(
            x for x in (r["City"], r["Local name"], r["Days"] and f"Days {r['Days']}") if x
        )
        parts.extend(
            [
                "<Placemark>",
                f"<name>{xml_escape(r['Name'])}</name>",
                "<styleUrl>#attraction</styleUrl>",
                "<ExtendedData>",
                f'  <Data name="Tag"><value>{TAG}</value></Data>',
                f'  <Data name="Kind"><value>{xml_escape(r["Kind"])}</value></Data>',
                f'  <Data name="City"><value>{xml_escape(r["City"])}</value></Data>',
                f'  <Data name="Country"><value>{xml_escape(r["Country"])}</value></Data>',
                f'  <Data name="Local name"><value>{xml_escape(r["Local name"])}</value></Data>',
                f'  <Data name="Days"><value>{xml_escape(r["Days"])}</value></Data>',
                f'  <Data name="Place ID"><value>{xml_escape(r["Place ID"])}</value></Data>',
                "</ExtendedData>",
                f"<description><![CDATA[<p>{desc}</p><p>{html_escape(extra)}</p>]]></description>",
                "<Point>",
                f"<coordinates>{r['Longitude']},{r['Latitude']},0</coordinates>",
                "</Point>",
                "</Placemark>",
            ]
        )
    parts.extend(["</Folder>", "</Document>", "</kml>", ""])
    path.write_text("\n".join(parts), encoding="utf-8")
    return path


def push_sheet(rows: list[dict]) -> str:
    cfg = load_config()
    wb = open_workbook(cfg)
    values = [HEADERS] + [[r[h] for h in HEADERS] for r in rows]
    ncols = len(HEADERS)
    nrows = len(values)
    try:
        ws = wb.worksheet(TAB_TITLE)
    except Exception:
        ws = wb.add_worksheet(title=TAB_TITLE, rows=max(nrows + 20, 80), cols=ncols + 2)
    ws.clear()
    try:
        ws.resize(rows=max(nrows + 20, 80), cols=ncols + 2)
    except Exception:
        pass
    ws.update(values, value_input_option="USER_ENTERED")
    wb.batch_update(
        {
            "requests": [
                {
                    "updateSheetProperties": {
                        "properties": {
                            "sheetId": ws.id,
                            "rightToLeft": False,
                            "gridProperties": {
                                "frozenRowCount": 1,
                                "hideGridlines": False,
                            },
                        },
                        "fields": "rightToLeft,gridProperties.frozenRowCount,gridProperties.hideGridlines",
                    }
                },
                {
                    "repeatCell": {
                        "range": {
                            "sheetId": ws.id,
                            "startRowIndex": 0,
                            "endRowIndex": 1,
                            "startColumnIndex": 0,
                            "endColumnIndex": ncols,
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "backgroundColor": {"red": 0.11, "green": 0.16, "blue": 0.24},
                                "horizontalAlignment": "CENTER",
                                "textFormat": {
                                    "foregroundColor": {"red": 1, "green": 1, "blue": 1},
                                    "bold": True,
                                    "fontSize": 11,
                                },
                            }
                        },
                        "fields": "userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)",
                    }
                },
                {
                    "repeatCell": {
                        "range": {
                            "sheetId": ws.id,
                            "startRowIndex": 1,
                            "endRowIndex": nrows,
                            "startColumnIndex": 0,
                            "endColumnIndex": ncols,
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "wrapStrategy": "WRAP",
                                "verticalAlignment": "MIDDLE",
                                "textFormat": {"fontSize": 10},
                            }
                        },
                        "fields": "userEnteredFormat(wrapStrategy,verticalAlignment,textFormat)",
                    }
                },
                {
                    "updateDimensionProperties": {
                        "range": {
                            "sheetId": ws.id,
                            "dimension": "COLUMNS",
                            "startIndex": 0,
                            "endIndex": 1,
                        },
                        "properties": {"pixelSize": 260},
                        "fields": "pixelSize",
                    }
                },
                {
                    "updateDimensionProperties": {
                        "range": {
                            "sheetId": ws.id,
                            "dimension": "COLUMNS",
                            "startIndex": 3,
                            "endIndex": 4,
                        },
                        "properties": {"pixelSize": 360},
                        "fields": "pixelSize",
                    }
                },
            ]
        }
    )
    cfg["tabs"] = {s.title: {"gid": str(s.id), "name": s.title} for s in wb.worksheets()}
    save_config(cfg)
    gid = cfg["tabs"][TAB_TITLE]["gid"]
    return f"{cfg['googleSheetsUrl']}#gid={gid}"


def main() -> int:
    days, places, he_places = load_trip()
    rows = collect_rows(days, places, he_places)
    csv_path = write_csv(rows)
    kml_path = write_kml(rows)
    sheet_url = push_sheet(rows)
    cities = {}
    for r in rows:
        cities[r["City"]] = cities.get(r["City"], 0) + 1
    print(f"Exported {len(rows)} attractions (Tag = {TAG})")
    for city, n in cities.items():
        print(f"  {city}: {n}")
    print(f"CSV:   {csv_path}")
    print(f"KML:   {kml_path}")
    print(f"Sheet: {sheet_url}")
    print(
        "\nMy Maps (one-time, ~1 min):\n"
        "  1. Open https://www.google.com/mymaps and open (or create) the shared map\n"
        "  2. Add layer → name it Attractions → Import\n"
        "  3. Google Drive → this spreadsheet → tab אטרקציות\n"
        "     (or upload collab/mymaps/attractions.csv / .kml)\n"
        "  4. Position: Latitude + Longitude · Title: Name\n"
        "  5. Uniform style → Group places by → Tag → Categories\n"
        "     then pick a landmark/camera icon for the attraction group"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
