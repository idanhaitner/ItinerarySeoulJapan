#!/usr/bin/env python3
"""Build docs/js/restaurants.js from MK's Japan Google My Maps (restaurants only).

Source map: https://www.google.com/maps/d/u/0/viewer?mid=1fmfaySQHmojbRGKWCwRecq6Ln1Bb2Xdh
Keeps restaurant / noodles / izakaya / sushi pins for trip cities only.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "js" / "restaurants.js"
CACHE = ROOT / "scripts" / "cache" / "mk_japan.kml"
MID = "1fmfaySQHmojbRGKWCwRecq6Ln1Bb2Xdh"
SOURCE = f"https://www.google.com/maps/d/u/0/viewer?mid={MID}"
KML_URL = f"https://www.google.com/maps/d/kml?mid={MID}&forcekml=1"

RESTAURANT_ICONS = {
    "1577": "restaurant",
    "1640": "noodles",
    "1800": "izakaya",
    "1835": "sushi",
}
CAT_HE = {
    "restaurant": "מסעדה",
    "noodles": "אטריות / ראמן",
    "izakaya": "איזקאיה",
    "sushi": "סושי",
}

# Day-trip / side cities not in Tokyo/Kyoto/Osaka folders
REGIONS = [
    ("Hakone", "Hakone", "הקונה", 35.15, 35.30, 138.90, 139.15),
    ("Kawaguchiko", "Kawaguchiko", "קוואגוצ׳יקו", 35.45, 35.56, 138.70, 138.88),
    ("Kamakura", "Kamakura", "קמאקורה / אנושימה", 35.27, 35.36, 139.45, 139.58),
    ("Nikko", "Nikko", "ניקו", 36.70, 36.80, 139.40, 139.75),
    ("Nara", "Nara", "נארה", 34.65, 34.72, 135.80, 135.87),
    ("Hiroshima", "Hiroshima", "הירושימה / מיאג׳ימה", 34.28, 34.42, 132.28, 132.52),
]

TOKYO_WARDS = [
    ("Shinjuku", "שינג׳וקו", 35.68, 35.71, 139.68, 139.72),
    ("Shibuya", "שיבויה / הראג׳וקו", 35.64, 35.68, 139.68, 139.72),
    ("Asakusa", "אסאקוסה", 35.70, 35.73, 139.78, 139.82),
    ("Akihabara", "אקיהברה", 35.69, 35.71, 139.76, 139.79),
    ("Ginza", "גינזה", 35.66, 35.68, 139.75, 139.78),
    ("Roppongi", "רופונגי / אזבודאי", 35.65, 35.67, 139.72, 139.75),
    ("Nakano", "נאקאנו", 35.70, 35.72, 139.65, 139.68),
    ("Shimokitazawa", "שימוקיטאזאווה", 35.65, 35.67, 139.65, 139.68),
    ("Odaiba", "אודאיבה / טויוסו", 35.61, 35.66, 139.75, 139.80),
    ("Ueno", "אואנו", 35.70, 35.73, 139.76, 139.79),
    ("Kichijoji", "קיצ׳וג׳י / מיטאקה", 35.69, 35.71, 139.55, 139.60),
]


def fetch_kml() -> Path:
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["curl", "-sL", "--max-time", "60", "-A", "Mozilla/5.0", "-o", str(CACHE), KML_URL],
        capture_output=True,
        text=True,
        check=False,
    )
    if r.returncode != 0 or not CACHE.exists() or CACHE.stat().st_size < 1000:
        raise SystemExit(f"Failed to download KML (exit {r.returncode})")
    return CACHE


def text(el: ET.Element, tag: str) -> str:
    c = el.find(tag)
    return (c.text or "").strip() if c is not None else ""


def strip_html(s: str) -> str:
    s = unescape(s or "")
    s = re.sub(r"<br\s*/?>", " · ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"\s+", " ", s).strip(" ·")
    return s


def parse_coords(pm: ET.Element) -> tuple[float | None, float | None]:
    pt = pm.find(".//coordinates")
    if pt is None or not pt.text:
        return None, None
    parts = pt.text.strip().split(",")
    if len(parts) < 2:
        return None, None
    return float(parts[1]), float(parts[0])


def is_area_label(name: str) -> bool:
    # Skip decorative all-caps area headers used as map labels
    compact = re.sub(r"[\s/·\xa0]+", "", name)
    if not compact:
        return True
    # Mathematical Bold Sans / similar fancy capitals
    fancy = sum(1 for ch in compact if ord(ch) >= 0x1D400)
    return fancy >= max(3, len(compact) // 2)


def ward_for(lat: float, lng: float, name: str, desc: str) -> tuple[str, str]:
    blob = f"{name} {desc}".lower()
    for key, he, la0, la1, ln0, ln1 in TOKYO_WARDS:
        if la0 <= lat <= la1 and ln0 <= lng <= ln1:
            return key, he
    for key, he, *_ in TOKYO_WARDS:
        if key.lower() in blob:
            return key, he
    return "Tokyo", "טוקיו"


def region_for(lat: float, lng: float) -> tuple[str, str, str] | None:
    for city, dist, he, la0, la1, ln0, ln1 in REGIONS:
        if la0 <= lat <= la1 and ln0 <= lng <= ln1:
            return city, dist, he
    return None


def build(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8", errors="replace")
    raw = re.sub(r'\sxmlns="[^"]+"', "", raw)
    root = ET.fromstring(raw)

    restaurants: list[dict] = []
    seen: set[tuple] = set()

    for folder in root.findall(".//Folder"):
        fname = text(folder, "name")
        for pm in folder.findall("Placemark"):
            style = text(pm, "styleUrl").lstrip("#")
            m = re.match(r"icon-(\d+)-", style)
            icon = m.group(1) if m else ""
            if icon not in RESTAURANT_ICONS:
                continue

            name = text(pm, "name")
            if not name or is_area_label(name):
                continue

            lat, lng = parse_coords(pm)
            if lat is None or lng is None:
                continue

            desc = strip_html(text(pm, "description"))

            if fname == "Tokyo":
                city = "Tokyo"
                district, district_he = ward_for(lat, lng, name, desc)
            elif fname == "Kyoto":
                city, district, district_he = "Kyoto", "Kyoto", "קיוטו"
            elif fname == "Osaka":
                city, district, district_he = "Osaka", "Osaka", "אוסקה"
            else:
                hit = region_for(lat, lng)
                if not hit:
                    continue
                city, district, district_he = hit

            key = (round(lat, 5), round(lng, 5), name.lower())
            if key in seen:
                continue
            seen.add(key)

            cat = RESTAURANT_ICONS[icon]
            rid = hashlib.md5(f"{name}|{lat}|{lng}".encode()).hexdigest()[:12]
            restaurants.append(
                {
                    "id": rid,
                    "name": name,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "city": city,
                    "district": district,
                    "districtHe": district_he,
                    "category": cat,
                    "categoryHe": CAT_HE[cat],
                    "blurb": desc[:220],
                    "address": "",
                    "roadAddress": desc[:140],
                    "googleUrl": f"https://www.google.com/maps/search/?api=1&query={lat},{lng}",
                    "photos": [],
                    "score": None,
                    "reviewCount": None,
                }
            )

    restaurants.sort(key=lambda r: (r["city"], r["district"], r["name"].lower()))
    return {
        "meta": {
            "source": SOURCE,
            "sourceLabel": "MK's Japan map",
            "author": "MK",
            "count": len(restaurants),
            "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "note": "Restaurants only for trip cities (restaurant / noodles / izakaya / sushi)",
        },
        "restaurants": restaurants,
    }


def main() -> None:
    path = fetch_kml()
    data = build(path)
    counts = Counter(r["city"] for r in data["restaurants"])
    js = (
        "/* Japan restaurants from MK's Google My Maps — generated, do not hand-edit */\n"
        f"window.RESTAURANT_LIST = {json.dumps(data, ensure_ascii=False, separators=(',', ':'))};\n"
    )
    OUT.write_text(js, encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
    print("By city:", dict(counts))
    print("Total:", data["meta"]["count"])


if __name__ == "__main__":
    main()
