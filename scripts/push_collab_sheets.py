#!/usr/bin/env python3
"""Push a human-friendly Hebrew collaborative itinerary to Google Sheets."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sheets_client import (  # noqa: E402
    client,
    get_credentials,
    load_config,
    open_workbook,
    save_config,
)

ROOT = Path(__file__).resolve().parents[1]
HE_DATA = ROOT / "docs" / "js" / "he-data.js"

WD = {
    "Monday": "שני",
    "Tuesday": "שלישי",
    "Wednesday": "רביעי",
    "Thursday": "חמישי",
    "Friday": "שישי",
    "Saturday": "שבת",
    "Sunday": "ראשון",
}
CITY = {
    "Seoul": "סיאול",
    "Tokyo": "טוקיו",
    "Hakone": "הקונה",
    "Kawaguchiko": "קוואגוצ׳יקו",
    "Kyoto": "קיוטו",
    "Osaka": "אוסקה",
    "Kobe": "קובה",
    "Nara": "נארה",
    "Nikko": "ניקו",
    "Kamakura": "קמאקורה",
    "Enoshima": "אנושימה",
    "Uji": "אוג׳י",
    "Ikeda": "איקדה",
    "Gotemba": "גוטמבה",
    "Hiroshima": "הירושימה",
    "Bangkok": "בנגקוק",
    "Home": "הבית",
}
# Connection / home hubs — never treat as trip cities (no color, no hotels row).
NON_TRIP_CITIES = {
    "Dubai",
    "Tirana",
    "Addis Ababa",
    "Tel Aviv",
    "Home",
    "דובאי",
    "טירנה",
    "אדיס אבבה",
    "תל אביב",
    "הבית",
}
CITY_COLORS = {
    # Distinct soft fills — one unique tint per trip city
    "סיאול": {"red": 0.98, "green": 0.82, "blue": 0.90},
    "טוקיו": {"red": 0.78, "green": 0.88, "blue": 0.98},
    "קוואגוצ׳יקו": {"red": 0.75, "green": 0.93, "blue": 0.95},
    "גוטמבה": {"red": 0.93, "green": 0.91, "blue": 0.78},
    "הקונה": {"red": 1.00, "green": 0.88, "blue": 0.72},
    "אודאווארה": {"red": 0.86, "green": 0.86, "blue": 0.93},
    "קיוטו": {"red": 1.00, "green": 0.84, "blue": 0.74},
    "אוג'י": {"red": 0.80, "green": 0.94, "blue": 0.80},
    "אוג׳י": {"red": 0.80, "green": 0.94, "blue": 0.80},
    "ארשיאמה": {"red": 0.84, "green": 0.92, "blue": 0.84},
    "אוסקה": {"red": 1.00, "green": 0.80, "blue": 0.84},
    "נארה": {"red": 0.92, "green": 0.86, "blue": 0.76},
    "איקדה": {"red": 0.78, "green": 0.92, "blue": 0.86},
    "קובה": {"red": 0.86, "green": 0.78, "blue": 0.96},
    "ניקו": {"red": 0.78, "green": 0.90, "blue": 0.78},
    "קמאקורה": {"red": 0.78, "green": 0.86, "blue": 0.96},
    "אנושימה": {"red": 0.90, "green": 0.82, "blue": 0.96},
}
HEADER_BG = {"red": 0.11, "green": 0.16, "blue": 0.24}  # deep navy
HEADER_FG = {"red": 1, "green": 1, "blue": 1}
ZEBRA = {"red": 0.97, "green": 0.97, "blue": 0.98}
BORDER = {"red": 0.85, "green": 0.87, "blue": 0.90}
WHITE = {"red": 1, "green": 1, "blue": 1}
STATUS_OPTIONS = ["לטפל", "הוזמן", "סגור", "רעיון", "לדלג"]
STATUS_COLORS = {
    # soft fills + readable text (no neon green chrome)
    "לטפל": {
        "bg": {"red": 1.0, "green": 0.95, "blue": 0.85},
        "fg": {"red": 0.55, "green": 0.35, "blue": 0.05},
    },
    "הוזמן": {
        "bg": {"red": 0.88, "green": 0.95, "blue": 0.90},
        "fg": {"red": 0.10, "green": 0.35, "blue": 0.22},
    },
    "סגור": {
        "bg": {"red": 0.88, "green": 0.91, "blue": 0.96},
        "fg": {"red": 0.11, "green": 0.16, "blue": 0.28},
    },
    "רעיון": {
        "bg": {"red": 0.94, "green": 0.90, "blue": 0.98},
        "fg": {"red": 0.35, "green": 0.18, "blue": 0.45},
    },
    "לדלג": {
        "bg": {"red": 0.93, "green": 0.93, "blue": 0.94},
        "fg": {"red": 0.35, "green": 0.37, "blue": 0.40},
    },
}
FONT_FAMILY = "Rubik"  # excellent Hebrew support in Google Sheets
# Do NOT set tab colors — Google Sheets tints the A/B/C + row-number chrome from tab color.

TAB_ORDER = ["לוח זמנים", "ימים", "מלונות", "להזמין", "רעיונות"]
KEEP_TABS = set(TAB_ORDER) | {"אטרקציות"}  # My Maps import tab from export_mymaps_attractions.py
OLD_TABS = {
    "Overview", "Days", "Timeline", "Hotels", "Bookings", "Ideas",
    "Sheet1", "גיליון1", "איך משתמשים",
}


def load_trip():
    path = ROOT / "scripts" / "build_data.py"
    src = path.read_text(encoding="utf-8")
    ns = {"__file__": str(path), "__name__": "build_data"}
    exec(compile(src[: src.find("\njs = f")], str(path), "exec"), ns)
    trip, days, places = ns["TRIP"], ns["DAYS"], ns["PLACES"]
    he = json.loads(re.search(r"const HE = (\{.*?\n\})\n;", HE_DATA.read_text(encoding="utf-8"), re.S).group(1))
    route = list(trip.get("route") or [])
    trip = {**trip, **he.get("trip", {})}
    trip["route"] = route
    for d in days:
        h = he.get("days", {}).get(d["id"])
        if not h:
            continue
        for k in ("title", "summary", "food"):
            if h.get(k) is not None:
                d[k] = h[k]
        if h.get("tips"):
            d["tips"] = h["tips"]
        if h.get("transport"):
            d["transport"] = h["transport"]
        if "transfer" in h:
            d["transfer"] = None if h["transfer"] is None else {**(d.get("transfer") or {}), **h["transfer"]}
        if h.get("timeline") and d.get("timeline"):
            for i, item in enumerate(h["timeline"]):
                if i >= len(d["timeline"]):
                    break
                if item.get("title") is not None:
                    d["timeline"][i]["title"] = item["title"]
                if item.get("note") is not None:
                    d["timeline"][i]["note"] = item["note"]
    return trip, days, places, he.get("places") or {}


def fmt_date(iso: str) -> str:
    """Unambiguous date for Sheets: =DATE(y,m,d) so locale can't flip day/month."""
    raw = (iso or "").strip()
    if not raw:
        return ""
    if raw.startswith("=DATE("):
        return raw
    if "/" in raw and "-" not in raw:
        a, b, y = raw.split("/")[:3]
        d, m = int(a), int(b)
        return f"=DATE({int(y)},{m},{d})"
    if "-" in raw:
        y, m, d = raw.split("-")[:3]
        return f"=DATE({int(y)},{int(m)},{int(d)})"
    return raw


def fmt_date_he(iso: str) -> str:
    """Human Hebrew date label when a string (not a cell date) is needed."""
    months = {
        1: "ינו׳", 2: "פבר׳", 3: "מרץ", 4: "אפר׳", 5: "מאי", 6: "יונ׳",
        7: "יול׳", 8: "אוג׳", 9: "ספט׳", 10: "אוק׳", 11: "נוב׳", 12: "דצמ׳",
    }
    raw = (iso or "").strip()
    if "-" in raw:
        y, m, d = raw.split("-")[:3]
    elif "/" in raw:
        d, m, y = raw.split("/")[:3]
    else:
        return raw
    return f"{int(d)} ב{months[int(m)]} {y}"


def place_name(places, pid):
    if not pid:
        return ""
    return (places.get(pid) or {}).get("name") or pid


# Airport / connection place IDs — never paint as trip cities.
HUB_PLACE_IDS = {"tlv", "add", "dxb", "tia"}


def city_for_item(day, item, places) -> str:
    """Specific trip city for this stop — never Dubai / Tirana / Addis / Tel Aviv."""
    pid = item.get("placeId")
    if pid in HUB_PLACE_IDS:
        return ""
    if pid and pid in places:
        pc = (places[pid].get("city") or "").strip()
        if pc in NON_TRIP_CITIES:
            return ""
        if pc:
            return CITY.get(pc, pc)
    title = f"{item.get('title') or ''} {item.get('note') or ''}"
    low = title.lower()
    heuristics = [
        (r"(?<![א-תa-z])nara(?![a-z])|(?<![א-ת])נארה(?![א-ת])", "נארה"),
        (r"(?<![א-תa-z])kobe(?![a-z])|(?<![א-ת])קובה(?![א-ת])|sannomiya|kitano|nunobiki|(?<![a-z])nada(?![a-z])|(?<![a-z])maya(?![a-z])", "קובה"),
        (r"(?<![א-תa-z])nikko(?![a-z])|(?<![א-ת])ניקו(?![א-ת])|chuzenji|kegon|toshogu", "ניקו"),
        (r"(?<![א-תa-z])enoshima(?![a-z])|(?<![א-ת])אנושימה(?![א-ת])|sea candle", "אנושימה"),
        (r"(?<![א-תa-z])kamakura(?![a-z])|(?<![א-ת])קמאקורה(?![א-ת])|kotoku|hasedera|enoden", "קמאקורה"),
        (r"(?<![א-תa-z])uji(?![a-z])|(?<![א-ת])אוג׳י(?![א-ת])|byodo", "אוג׳י"),
        (r"(?<![א-תa-z])ikeda(?![a-z])|(?<![א-ת])איקדה(?![א-ת])|cup noodle|ramen museum", "איקדה"),
        (r"(?<![א-תa-z])gotemba(?![a-z])|(?<![א-ת])גוטמבה(?![א-ת])", "גוטמבה"),
    ]
    for pat, he in heuristics:
        if re.search(pat, low, re.I) or re.search(pat, title):
            return he
    base = day.get("city") or ""
    if base in NON_TRIP_CITIES:
        return ""
    return CITY.get(base, base)


def place_label(places, he_places, pid):
    """Attraction name only — the city sits in the עיר / מקום columns."""
    return place_name(places, pid)


def plan_bullets(d, places, he_places):
    """One bullet per timeline attraction, with Hebrew explanation."""
    lines = []
    for item in d.get("timeline") or []:
        title = (item.get("title") or "").strip()
        if not title:
            continue
        note = (item.get("note") or "").strip()
        pid = item.get("placeId")
        blurb = ((he_places or {}).get(pid) or {}).get("blurb") or ""
        blurb = blurb.strip()
        explain = note or blurb
        if explain and explain not in title:
            lines.append(f"• {title} — {explain}")
        else:
            lines.append(f"• {title}")
    if lines:
        return "\n".join(lines)
    return (d.get("summary") or "").strip()


def build_timeline(days, places, he_places=None):
    header = ["תאריך", "יום", "עיר", "שעה", "עד", "מה עושים", "פרטים", "מקום", "הערות שלנו"]
    rows = [header]
    for d in days:
        wd = WD.get(d["weekday"], d["weekday"])
        for item in d.get("timeline") or []:
            city_he = city_for_item(d, item, places)
            rows.append(
                [
                    fmt_date(d["date"]),
                    wd,
                    city_he,
                    item.get("time") or "",
                    item.get("end") or "",
                    item.get("title") or "",
                    item.get("note") or "",
                    city_he,  # מקום = עיר ספציפית (נארה / קובה / …)
                    "",
                ]
            )
    return rows


def _notes_by_date_from_fetch():
    """Preserve «הערות שלנו» from CURRENT_FROM_SHEETS.txt (ימים tab), keyed by ISO date."""
    path = ROOT / "collab" / "CURRENT_FROM_SHEETS.txt"
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    if "===== ימים =====" not in text:
        return {}
    section = text.split("===== ימים =====", 1)[1]
    if "=====" in section:
        section = section.split("=====", 1)[0]
    lines = [ln for ln in section.strip().splitlines() if ln.strip()]
    if len(lines) < 2:
        return {}
    header = lines[0].split("\t")
    try:
        date_i = header.index("תאריך")
        notes_i = header.index("הערות שלנו")
    except ValueError:
        return {}
    notes = {}
    for ln in lines[1:]:
        cols = ln.split("\t")
        if len(cols) <= max(date_i, notes_i):
            continue
        raw_date = (cols[date_i] or "").strip()
        note = (cols[notes_i] or "").strip()
        if not raw_date or not note:
            continue
        iso = raw_date
        if "/" in raw_date:
            parts = raw_date.split("/")
            if len(parts) == 3:
                d, m, y = parts
                iso = f"{y.zfill(4)}-{m.zfill(2)}-{d.zfill(2)}"
        notes[iso] = note
    return notes


def build_days(days, places, he_places=None):
    header = ["תאריך", "יום", "עיר", "כותרת", "מה בתוכנית", "מלון", "אוכל", "טיפים", "העברה", "הערות שלנו"]
    rows = [header]
    preserved = _notes_by_date_from_fetch()
    for d in days:
        hotel = places.get(d.get("hotelId") or "", {})
        hotel_name = hotel.get("name") or "טרם נבחר"
        if d.get("hotelId") == "nine-bricks":
            hotel_name += " ✓"
        tips = " • ".join(d.get("tips") or [])
        tr = d.get("transfer") or {}
        transfer = ""
        if tr:
            transfer = " — ".join(x for x in [tr.get("label"), tr.get("detail"), tr.get("duration")] if x)
        rows.append(
            [
                fmt_date(d["date"]),
                WD.get(d["weekday"], d["weekday"]),
                "" if d.get("city") in NON_TRIP_CITIES else CITY.get(d["city"], d["city"]),
                d.get("title") or "",
                plan_bullets(d, places, he_places),
                hotel_name,
                d.get("food") or "",
                tips,
                transfer,
                preserved.get(d["date"], ""),
            ]
        )
    return rows


def _stay_ranges(days):
    """Derive lodging night ranges from consecutive city blocks."""
    blocks = []
    for d in days:
        city = d["city"]
        if blocks and blocks[-1]["city"] == city:
            blocks[-1]["end"] = d["date"]
            blocks[-1]["days"].append(d)
        else:
            blocks.append({"city": city, "start": d["date"], "end": d["date"], "days": [d]})
    return blocks


def build_hotels(days):
    """Hotels tracker with real trip date ranges."""
    # Preferred labels / areas for known stays
    meta = {
        ("Seoul", 0): ("סיאול", "Hongdae", "9 Brick Hotel", "הוזמן", "בסיס סיאול · צ׳ק־אאוט 2 בספט׳"),
        ("Tokyo", 0): ("טוקיו (התחלה)", "Kabukicho / Shinjuku", "Hotel Gracery Shinjuku", "הוזמן", "לילות 2–6/9 · צ׳ק־אאוט בוקר 7/9 להקונה"),
        ("Hakone", 0): ("הקונה", "Hakone-Yumoto", "Hotel Zagakukan (坐樂閑)", "הוזמן", "הוזמן · לילה 9/9 · צ׳ק־אין 17:00 · צ׳ק־אאוט 10/9 לשינקנסן לקיוטו"),
        ("Kawaguchiko", 0): ("קוואגוצ׳יקו", "Fujiyoshida / ליד Fuji-Q", "HOTEL MYSTAYS Fuji Onsen Resort", "הוזמן", "לילות 7–8/9 · צ׳ק־אאוט 9/9 לגוטמבה"),
        ("Kyoto", 0): ("קיוטו", "Kawaramachi / Shijo", "KABIN Koji", "הוזמן", "לילות 10–14/9 · צ׳ק־אאוט 15/9 · שינקנסן מאודאווארה בערב 10/9"),
        ("Osaka", 0): ("אוסקה", "Higashi-Shinsaibashi / Dotonbori", "Apartment Hotel 11 Shinsaibashi 2", "הוזמן", "מ־15/9 ערב ל־21/9 בוקר"),
        ("Tokyo", 1): ("טוקיו (סיום)", "Ginza 8", "The Royal Park Canvas Ginza 8", "הוזמן", "בסיס אחרון · לילות 21–24/9 · צ׳ק־אאוט 25/9"),
    }
    rows = [["עיר", "מתאריך", "עד תאריך", "מלון", "אזור מועדף", "סטטוס", "הערות"]]
    tokyo_i = 0
    for block in _stay_ranges(days):
        city = block["city"]
        if city in NON_TRIP_CITIES or city in ("Home",):
            continue
        key_i = tokyo_i if city == "Tokyo" else 0
        if city == "Tokyo":
            tokyo_i += 1
        label, area, hotel, status, notes = meta.get(
            (city, key_i),
            (CITY.get(city, city), "", "", "לטפל", ""),
        )
        end = block["end"]
        # Seoul hotel already booked — nights through 1 Sep, checkout morning of 2 Sep
        if city == "Seoul":
            hotel = "9 Brick Hotel"
            status = "הוזמן"
            end = "2026-09-02"
        if city == "Tokyo" and key_i == 0:
            hotel = "Hotel Gracery Shinjuku"
            status = "הוזמן"
            area = "Kabukicho / Shinjuku"
            end = "2026-09-07"
            notes = "הוזמן · לילות 2–6/9 · צ׳ק־אאוט בוקר 7/9 (אוטובוס בין-עירוני לקוואגוצ׳יקו) · 歌舞伎町1-19-1 · בניין Godzilla"
        if city == "Tokyo" and key_i == 1:
            hotel = "The Royal Park Canvas Ginza 8"
            status = "הוזמן"
            area = "Ginza 8-chome"
            end = "2026-09-25"
            notes = "הוזמן · לילות 21–24/9 · צ׳ק־אאוט 25/9 · 銀座8-9-4 · ~5 דק׳ מתחנת Ginza (A3) / ~7 דק׳ משימבאשי"
        if city == "Hakone":
            hotel = "Hotel Zagakukan (坐樂閑)"
            status = "הוזמן"
            area = "Hakone-Yumoto"
            end = "2026-09-10"
            notes = "הוזמן · לילה 9/9 · צ׳ק־אין 17:00 · צ׳ק־אאוט 10/9 לשינקנסן לקיוטו · הגעה ~15:20 אחרי אוטובוס ישיר מגוטמבה · אונסן בחדר (ספינה מחר במעגל)"
        if city == "Kawaguchiko":
            hotel = "HOTEL MYSTAYS Fuji Onsen Resort"
            status = "הוזמן"
            area = "Fujiyoshida / ליד Fuji-Q"
            end = "2026-09-09"
            notes = "הוזמן · לילות 7–8/9 · צ׳ק־אאוט בוקר 9/9 (אוטובוס לגוטמבה) · Fuji-Q ב־8/9 ליד המלון · ~5 דק׳ מתחנת Fujikyu Highland"
        if city == "Kyoto":
            hotel = "KABIN Koji"
            status = "הוזמן"
            area = "Kawaramachi / Shijo"
            end = "2026-09-15"
            notes = "הוזמן · לילות 10–14/9 · צ׳ק־אאוט 15/9 · 下京区筋屋町152 · Hikari מאודאווארה בערב 10/9 · איסוף מזוודות בהגעה"
        if city == "Osaka":
            hotel = "Apartment Hotel 11 Shinsaibashi 2"
            status = "הוזמן"
            area = "Higashi-Shinsaibashi / Dotonbori"
            end = "2026-09-21"
            # block start may be 15 from city change; checkout morning 21/9 after Kobe day
            notes = "הוזמן · מ־15/9 ערב ל־21/9 בוקר · 東心斎橋2-2-12 · כולל ליל USJ ב־16/9 · טיול יום לקובה ב־20/9"
        rows.append([label, fmt_date(block["start"]), fmt_date(end), hotel, area, status, notes])
    return rows


def _parse_sheet_date(raw: str) -> str:
    """Return ISO yyyy-mm-dd from Sheet date text, or '' if unparseable."""
    raw = (raw or "").strip()
    if not raw:
        return ""
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        return raw
    if "/" in raw:
        parts = raw.split("/")
        if len(parts) == 3:
            a, b, c = parts
            # dd/mm/yyyy (iw_IL) or already ISO-ish
            if len(c) == 4:
                return f"{c.zfill(4)}-{b.zfill(2)}-{a.zfill(2)}"
            if len(a) == 4:
                return f"{a.zfill(4)}-{b.zfill(2)}-{c.zfill(2)}"
    return ""


def build_bookings(days):
    """Tickets / reservations only — no flights or hotels (those live elsewhere)."""
    by_id = {d["id"]: d["date"] for d in days}
    # Preserve status + date collaborators already set in the Sheet.
    preserved_status = {}
    preserved_date = {}
    path = ROOT / "collab" / "CURRENT_FROM_SHEETS.txt"
    if path.exists():
        text = path.read_text(encoding="utf-8")
        if "===== להזמין =====" in text:
            section = text.split("===== להזמין =====", 1)[1]
            if "=====" in section:
                section = section.split("=====", 1)[0]
            for ln in section.strip().splitlines()[1:]:
                cols = ln.split("\t")
                if len(cols) >= 3:
                    key = (cols[0] or "").strip()
                    preserved_status[key] = (cols[2] or "").strip()
                    if len(cols) >= 2:
                        iso = _parse_sheet_date(cols[1])
                        if iso:
                            preserved_date[key] = iso

    # (name, day_id, default_status, notes without redundant dates)
    # Shibuya Sky is booked for 6/9 (d11), not 3/9.
    items = [
        ("רישיון נהיגה בינלאומי פיזי (IDP 1949)", "d11", "לטפל", "חובה ל־Street Kart · להנפיק בארץ"),
        ("K-ETA לקוריאה", "d00", "לטפל", "רק אם נדרש לפי הדרכון"),
        ("ביטוח נסיעות", "d00", "לטפל", "לפני היציאה"),
        ("Visit Japan Web (VJW)", "d07", "לטפל", "למלא כמה ימים לפני נחיתה בנריטה"),
        ("USJ Studio Pass (כרטיס כניסה)", "d21", "לטפל", "חובה בנפרד מה־Express Pass"),
        ("USJ Express Pass 7 Minecart & Selection", "d21", "הוזמן", "Minecart & Selection"),
        ("Shibuya Sky sunset", "d11", "הוזמן", "כרטיס sunset · 6/9 · נפתח 28 ימים מראש"),
        ("Street Kart Tokyo — תור ערב", "d11", "לטפל", "~19:00 · IDP פיזי חובה"),
        ("teamLab Planets Tokyo", "d09", "לטפל", "כרטיס מתוזמן"),
        ("teamLab Biovortex Kyoto", "d19", "הוזמן", "כניסה 18:00–18:30"),
        ("Fuji-Q Freepass", "d13", "לטפל", "יום מלא בפארק"),
        ("Changdeokgung Secret Garden", "d03", "לטפל", "סיור מודרך מתוזמן"),
        ("Unni Guide Center", "d03", "הוזמן", "15:00–16:00 · אחריו Moclock"),
        ("Moclock Gangnam — טיפול שיער", "d03", "הוזמן", "16:30–18:00 · Nonhyeon exit 3"),
        ("Forena Clinic — ייעוץ + טיפול", "d04", "הוזמן", "10:30 · Hongdae H-CUBE"),
        ("ארוחת צהריים Yeonnam Chwihyang", "d04", "הוזמן", "15:00 · לרוב walk-in עם תור"),
        ("N Seoul Tower sunset", "d06", "הוזמן", "אוטובוס נאמסן למגדל"),
        ("Lotte World", "d05", "הוזמן", "יום מלא בפארק"),
        ("אוטובוס בין-עירוני Shinjuku → Kawaguchiko", "d12", "לטפל", "מושב שמור · Busta Shinjuku 09:15"),
        ("שינקנסן Hikari 653 Odawara → Kyoto", "d15", "לטפל", "18:07–20:12 · כרטיסים במכונות ~17:45"),
        ("שינקנסן Nozomi Osaka → Tokyo", "d26", "לטפל", "SmartEX · כל Nozomi שמורים ב־Silver Week"),
        ("Tobu Spacia X → Nikko", "d27", "לטפל", "יציאה ~07:30 מאסאקוסה · מושבים שמורים"),
        ("ארוחת ערב Koushiya (קוואגוצ׳יקו)", "d12", "הוזמן", "18:00 · Beef Cutlet"),
        ("פנקייקים Panel Cafe Kyoto", "d20", "הוזמן", "10:00"),
        ("ארוחת בשר קובה — Gennkichi", "d25", "הוזמן", "19:30 · ליד Sannomiya"),
        ("ארוחת טונה — Maguro Mart", "d26", "הוזמן", "20:45 · מזומן בלבד · Nakano"),
        ("ארוחת פרידה מיפן", "d29", "לטפל", "וואגיו / אומקאסה בגינזה או בקמאקורה"),
    ]
    # Force-correct dates that a previous push wrongly reset (Sheet may still show 3/9).
    force_date = {
        "Shibuya Sky sunset": by_id.get("d11", "2026-09-06"),
    }
    rows = [["מה להזמין", "תאריך", "סטטוס", "הערות"]]
    for name, day_id, status, notes in items:
        st = status
        if name in preserved_status and preserved_status[name] in STATUS_OPTIONS:
            st = preserved_status[name]
        else:
            for old_name, old_st in preserved_status.items():
                if old_st not in STATUS_OPTIONS:
                    continue
                if name in old_name or old_name in name or (
                    len(old_name) > 12 and old_name[:12] in name
                ):
                    st = old_st
                    break
        if name in force_date:
            date_iso = force_date[name]
        elif name in preserved_date:
            date_iso = preserved_date[name]
        else:
            matched = None
            for old_name, old_iso in preserved_date.items():
                if name in old_name or old_name in name or (
                    len(old_name) > 12 and old_name[:12] in name
                ):
                    matched = old_iso
                    break
            date_iso = matched or by_id.get(day_id, "")
        rows.append([name, fmt_date(date_iso), st, notes])
    return rows


def build_ideas():
    return [
        ["רעיון", "עיר", "עדיפות", "סטטוס", "הערות"],
        ["Seoulistique Skin (סאונגסו)", "סיאול", "נמוך", "לדלג", "טיפול פנים — דולג כרגע; Forena בהונגדה הוזמן במקום"],
        ["סאונגסו / יער סיאול בערב שבת", "סיאול", "נמוך", "לדלג", "חנויות נסגרות ~20:00 — סאונגסו באור יום ביום שלישי 14:00; שבת בערב זה DDP + קניוני לילה"],
    ]


def format_date_columns(wb, ws, date_cols: list[int], nrows: int):
    if nrows < 2 or not date_cols:
        return
    requests = []
    for col in date_cols:
        requests.append(
            {
                "repeatCell": {
                    "range": {
                        "sheetId": ws.id,
                        "startRowIndex": 1,
                        "endRowIndex": nrows,
                        "startColumnIndex": col,
                        "endColumnIndex": col + 1,
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "numberFormat": {"type": "DATE", "pattern": "dd/mm/yyyy"},
                            "horizontalAlignment": "CENTER",
                            "verticalAlignment": "MIDDLE",
                            "textFormat": {"fontFamily": FONT_FAMILY, "fontSize": 11},
                        }
                    },
                    "fields": "userEnteredFormat(numberFormat,horizontalAlignment,verticalAlignment,textFormat)",
                }
            }
        )
    wb.batch_update({"requests": requests})


def ensure_worksheet(wb, title: str, rows: int = 200, cols: int = 12):
    try:
        return wb.worksheet(title)
    except Exception:
        return wb.add_worksheet(title=title, rows=rows, cols=cols)


def col_letter(n: int) -> str:
    s = ""
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def set_basic_format(wb, ws, nrows: int, ncols: int):
    requests = [
        {
            "updateSheetProperties": {
                "properties": {
                    "sheetId": ws.id,
                    "rightToLeft": True,
                    "gridProperties": {
                        "frozenRowCount": 1,
                        "hideGridlines": True,
                    },
                },
                "fields": "rightToLeft,gridProperties.frozenRowCount,gridProperties.hideGridlines",
            }
        },
        # Base body: Rubik, centered, soft white
        {
            "repeatCell": {
                "range": {
                    "sheetId": ws.id,
                    "startRowIndex": 0,
                    "endRowIndex": max(nrows, 1),
                    "startColumnIndex": 0,
                    "endColumnIndex": ncols,
                },
                "cell": {
                    "userEnteredFormat": {
                        "backgroundColor": WHITE,
                        "horizontalAlignment": "CENTER",
                        "verticalAlignment": "MIDDLE",
                        "wrapStrategy": "WRAP",
                        "textFormat": {
                            "fontFamily": FONT_FAMILY,
                            "fontSize": 11,
                            "foregroundColor": {"red": 0.15, "green": 0.17, "blue": 0.20},
                        },
                        "borders": {
                            "top": {"style": "SOLID", "width": 1, "color": BORDER},
                            "bottom": {"style": "SOLID", "width": 1, "color": BORDER},
                            "left": {"style": "SOLID", "width": 1, "color": BORDER},
                            "right": {"style": "SOLID", "width": 1, "color": BORDER},
                        },
                        "padding": {"top": 6, "bottom": 6, "left": 8, "right": 8},
                    }
                },
                "fields": (
                    "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,"
                    "wrapStrategy,textFormat,borders,padding)"
                ),
            }
        },
        # Zebra rows (neutral gray-blue — not green)
        *[
            {
                "repeatCell": {
                    "range": {
                        "sheetId": ws.id,
                        "startRowIndex": r,
                        "endRowIndex": r + 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": ncols,
                    },
                    "cell": {"userEnteredFormat": {"backgroundColor": ZEBRA}},
                    "fields": "userEnteredFormat.backgroundColor",
                }
            }
            for r in range(2, nrows, 2)
        ],
        # Header
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
                        "backgroundColor": HEADER_BG,
                        "horizontalAlignment": "CENTER",
                        "verticalAlignment": "MIDDLE",
                        "wrapStrategy": "WRAP",
                        "textFormat": {
                            "fontFamily": FONT_FAMILY,
                            "fontSize": 12,
                            "bold": True,
                            "foregroundColor": HEADER_FG,
                        },
                        "borders": {
                            "top": {"style": "SOLID", "width": 1, "color": HEADER_BG},
                            "bottom": {"style": "SOLID", "width": 2, "color": {"red": 0.75, "green": 0.45, "blue": 0.28}},
                            "left": {"style": "SOLID", "width": 1, "color": HEADER_BG},
                            "right": {"style": "SOLID", "width": 1, "color": HEADER_BG},
                        },
                    }
                },
                "fields": (
                    "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,"
                    "wrapStrategy,textFormat,borders)"
                ),
            }
        },
        {
            "updateDimensionProperties": {
                "range": {
                    "sheetId": ws.id,
                    "dimension": "ROWS",
                    "startIndex": 0,
                    "endIndex": 1,
                },
                "properties": {"pixelSize": 40},
                "fields": "pixelSize",
            }
        },
        {
            "setBasicFilter": {
                "filter": {
                    "range": {
                        "sheetId": ws.id,
                        "startRowIndex": 0,
                        "endRowIndex": max(nrows, 1),
                        "startColumnIndex": 0,
                        "endColumnIndex": ncols,
                    }
                }
            }
        },
        {
            "autoResizeDimensions": {
                "dimensions": {
                    "sheetId": ws.id,
                    "dimension": "COLUMNS",
                    "startIndex": 0,
                    "endIndex": ncols,
                }
            }
        },
        {
            "autoResizeDimensions": {
                "dimensions": {
                    "sheetId": ws.id,
                    "dimension": "ROWS",
                    "startIndex": 1,
                    "endIndex": max(nrows, 1),
                }
            }
        },
    ]
    # batch in chunks if zebra list is long
    for i in range(0, len(requests), 90):
        wb.batch_update({"requests": requests[i : i + 90]})


def normalize_city_key(city: str) -> str:
    """Canonical city key for color lookup (apostrophes + strip '(התחלה)' etc.)."""
    s = (city or "").strip()
    for ch in ("'", "'", "ʼ", "′", "`"):
        s = s.replace(ch, "׳")
    s = re.sub(r"\s*\([^)]*\)\s*$", "", s).strip()
    return s


def color_for_city(city: str) -> dict | None:
    key = normalize_city_key(city)
    if not key:
        return None
    if key in CITY_COLORS:
        return CITY_COLORS[key]
    # Prefix match for rare variants (e.g. still carrying extra words)
    for name, color in CITY_COLORS.items():
        if key.startswith(name) or name.startswith(key):
            return color
    return None


def color_by_city(wb, ws, values: list[list[str]], city_col: int, ncols: int, extra_cols: list[int] | None = None):
    """City tint on the city column (+ optional twin columns like מקום)."""
    cols = [city_col] + list(extra_cols or [])
    requests = []
    for r_idx, row in enumerate(values[1:], start=1):
        if len(row) <= city_col:
            continue
        city = (row[city_col] or "").strip()
        if not city:
            continue  # connection hubs (Dubai/Addis/…) stay uncolored
        color = color_for_city(city)
        if not color:
            continue
        for col in cols:
            if col < 0 or col >= ncols:
                continue
            requests.append(
                {
                    "repeatCell": {
                        "range": {
                            "sheetId": ws.id,
                            "startRowIndex": r_idx,
                            "endRowIndex": r_idx + 1,
                            "startColumnIndex": col,
                            "endColumnIndex": col + 1,
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "backgroundColor": color,
                                "textFormat": {
                                    "fontFamily": FONT_FAMILY,
                                    "bold": True,
                                    "fontSize": 11,
                                },
                            }
                        },
                        "fields": "userEnteredFormat(backgroundColor,textFormat)",
                    }
                }
            )
    for i in range(0, len(requests), 80):
        wb.batch_update({"requests": requests[i : i + 80]})


def style_tab(wb, ws, title: str):
    """Keep tabs uncolored so Sheets row/column headers stay neutral gray."""
    wb.batch_update(
        {
            "requests": [
                {
                    "updateSheetProperties": {
                        "properties": {"sheetId": ws.id},
                        "fields": "tabColor",
                    }
                }
            ]
        }
    )


def add_status_dropdown(wb, ws, col_index: int, nrows: int):
    """Hebrew status dropdown + color rules that update when status changes."""
    end_row = max(nrows + 50, 80)  # leave room for new rows
    # Clear existing conditional format rules on this sheet first
    meta = wb.fetch_sheet_metadata()
    clear_reqs = []
    for sheet in meta.get("sheets", []):
        if sheet["properties"]["sheetId"] != ws.id:
            continue
        rules = sheet.get("conditionalFormats", [])
        for idx in range(len(rules) - 1, -1, -1):
            clear_reqs.append({"deleteConditionalFormatRule": {"sheetId": ws.id, "index": idx}})
    if clear_reqs:
        wb.batch_update({"requests": clear_reqs})

    requests = [
        {
            "setDataValidation": {
                "range": {
                    "sheetId": ws.id,
                    "startRowIndex": 1,
                    "endRowIndex": end_row,
                    "startColumnIndex": col_index,
                    "endColumnIndex": col_index + 1,
                },
                "rule": {
                    "condition": {
                        "type": "ONE_OF_LIST",
                        "values": [{"userEnteredValue": s} for s in STATUS_OPTIONS],
                    },
                    "showCustomUi": True,
                    "strict": False,
                },
            }
        }
    ]
    for i, status in enumerate(STATUS_OPTIONS):
        colors = STATUS_COLORS[status]
        requests.append(
            {
                "addConditionalFormatRule": {
                    "rule": {
                        "ranges": [
                            {
                                "sheetId": ws.id,
                                "startRowIndex": 1,
                                "endRowIndex": end_row,
                                "startColumnIndex": col_index,
                                "endColumnIndex": col_index + 1,
                            }
                        ],
                        "booleanRule": {
                            "condition": {
                                "type": "TEXT_EQ",
                                "values": [{"userEnteredValue": status}],
                            },
                            "format": {
                                "backgroundColor": colors["bg"],
                                "textFormat": {
                                    "foregroundColor": colors["fg"],
                                    "bold": True,
                                },
                            },
                        },
                    },
                    "index": i,
                }
            }
        )
    wb.batch_update({"requests": requests})


def push_table(wb, title: str, values: list[list[str]], *, city_col=None, status_col=None, date_cols=None, extra_city_cols=None):
    ncols = max(len(r) for r in values)
    nrows = len(values)
    ws = ensure_worksheet(wb, title, rows=max(nrows + 20, 60), cols=max(ncols + 2, 10))
    ws.clear()
    try:
        ws.resize(rows=max(nrows + 20, 60), cols=max(ncols + 2, 10))
    except Exception:
        pass
    padded = [r + [""] * (ncols - len(r)) for r in values]
    ws.update(padded, value_input_option="USER_ENTERED")

    set_basic_format(wb, ws, nrows, ncols)
    if date_cols:
        format_date_columns(wb, ws, date_cols, nrows)
    if city_col is not None:
        color_by_city(wb, ws, padded, city_col, ncols, extra_cols=extra_city_cols)
    style_tab(wb, ws, title)
    # auto-size after formatting
    wb.batch_update(
        {
            "requests": [
                {
                    "autoResizeDimensions": {
                        "dimensions": {
                            "sheetId": ws.id,
                            "dimension": "COLUMNS",
                            "startIndex": 0,
                            "endIndex": ncols,
                        }
                    }
                },
                {
                    "autoResizeDimensions": {
                        "dimensions": {
                            "sheetId": ws.id,
                            "dimension": "ROWS",
                            "startIndex": 1,
                            "endIndex": max(nrows, 1),
                        }
                    }
                },
                {
                    "updateDimensionProperties": {
                        "range": {
                            "sheetId": ws.id,
                            "dimension": "ROWS",
                            "startIndex": 0,
                            "endIndex": 1,
                        },
                        "properties": {"pixelSize": 42},
                        "fields": "pixelSize",
                    }
                },
            ]
        }
    )
    if status_col is not None:
        add_status_dropdown(wb, ws, status_col, nrows)
    return ws


def apply_spreadsheet_theme(wb):
    """Neutral navy theme — Google uses ACCENT1 for the A/B/C + row-number chrome."""
    navy = {"red": 0.11, "green": 0.16, "blue": 0.24}
    ink = {"red": 0.15, "green": 0.17, "blue": 0.20}
    bg = {"red": 1.0, "green": 1.0, "blue": 1.0}
    soft = {"red": 0.45, "green": 0.48, "blue": 0.52}
    lilac = {"red": 0.45, "green": 0.28, "blue": 0.45}
    sand = {"red": 0.55, "green": 0.35, "blue": 0.25}
    blue = {"red": 0.15, "green": 0.35, "blue": 0.55}
    rose = {"red": 0.55, "green": 0.25, "blue": 0.30}
    slate = {"red": 0.30, "green": 0.35, "blue": 0.50}
    wb.batch_update(
        {
            "requests": [
                {
                    "updateSpreadsheetProperties": {
                        "properties": {
                            "locale": "iw_IL",
                            "timeZone": "Asia/Jerusalem",
                            "spreadsheetTheme": {
                                "primaryFontFamily": FONT_FAMILY,
                                "themeColors": [
                                    {"colorType": "TEXT", "color": {"rgbColor": ink}},
                                    {"colorType": "BACKGROUND", "color": {"rgbColor": bg}},
                                    {"colorType": "ACCENT1", "color": {"rgbColor": navy}},
                                    {"colorType": "ACCENT2", "color": {"rgbColor": lilac}},
                                    {"colorType": "ACCENT3", "color": {"rgbColor": sand}},
                                    {"colorType": "ACCENT4", "color": {"rgbColor": blue}},
                                    {"colorType": "ACCENT5", "color": {"rgbColor": rose}},
                                    {"colorType": "ACCENT6", "color": {"rgbColor": slate}},
                                    {"colorType": "LINK", "color": {"rgbColor": blue}},
                                ],
                            }
                        },
                        "fields": "locale,timeZone,spreadsheetTheme",
                    }
                }
            ]
        }
    )


def create_or_open(cfg: dict):
    gc = client()
    if (cfg.get("googleSheetsId") or cfg.get("googleSheetsUrl") or "").strip():
        return open_workbook(cfg)
    from googleapiclient.discovery import build

    service = build("sheets", "v4", credentials=get_credentials(interactive=False), cache_discovery=False)
    created = service.spreadsheets().create(body={"properties": {"title": "Korea + Japan 2026 — Collab"}}).execute()
    wb = gc.open_by_key(created["spreadsheetId"])
    cfg["googleSheetsId"] = wb.id
    cfg["googleSheetsUrl"] = f"https://docs.google.com/spreadsheets/d/{wb.id}/edit"
    cfg["source"] = "sheets"
    save_config(cfg)
    return wb


def format_days_plan_column(wb, ws, nrows: int):
    """Make «מה בתוכנית» readable: top/right-aligned bullets, wide column."""
    if nrows < 2:
        return
    wb.batch_update(
        {
            "requests": [
                {
                    "repeatCell": {
                        "range": {
                            "sheetId": ws.id,
                            "startRowIndex": 1,
                            "endRowIndex": nrows,
                            "startColumnIndex": 4,
                            "endColumnIndex": 5,
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "horizontalAlignment": "RIGHT",
                                "verticalAlignment": "TOP",
                                "wrapStrategy": "WRAP",
                            }
                        },
                        "fields": "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)",
                    }
                },
                {
                    "updateDimensionProperties": {
                        "range": {
                            "sheetId": ws.id,
                            "dimension": "COLUMNS",
                            "startIndex": 4,
                            "endIndex": 5,
                        },
                        "properties": {"pixelSize": 460},
                        "fields": "pixelSize",
                    }
                },
            ]
        }
    )


def main() -> int:
    get_credentials(interactive=True)
    trip, days, places, he_places = load_trip()
    cfg = load_config()
    wb = create_or_open(cfg)
    cfg = load_config()
    apply_spreadsheet_theme(wb)

    # Rename spreadsheet title
    try:
        wb.update_title("קוריאה + יפן 2026 — תכנון משותף")
    except Exception:
        pass

    tabs = {
        "לוח זמנים": (build_timeline(days, places, he_places), {"city_col": 2, "extra_city_cols": [7], "date_cols": [0]}),
        "ימים": (build_days(days, places, he_places), {"city_col": 2, "date_cols": [0]}),
        "מלונות": (build_hotels(days), {"city_col": 0, "status_col": 5, "date_cols": [1, 2]}),
        "להזמין": (build_bookings(days), {"status_col": 2, "date_cols": [1]}),
        "רעיונות": (build_ideas(), {"status_col": 3}),
    }

    created = []
    for title in TAB_ORDER:
        values, opts = tabs[title]
        print(f"Updating {title} ({max(len(values) - 1, 0)} rows)…")
        push_table(
            wb,
            title,
            values,
            city_col=opts.get("city_col"),
            status_col=opts.get("status_col"),
            date_cols=opts.get("date_cols"),
            extra_city_cols=opts.get("extra_city_cols"),
        )
        if title == "ימים":
            format_days_plan_column(wb, wb.worksheet(title), len(values))
        created.append(title)

    # Delete old/messy tabs (keep My Maps attractions export)
    for ws in list(wb.worksheets()):
        if ws.title in KEEP_TABS:
            continue
        if ws.title in OLD_TABS or ws.title not in TAB_ORDER:
            if len(wb.worksheets()) <= 1:
                break
            try:
                print(f"Removing old tab: {ws.title}")
                wb.del_worksheet(ws)
            except Exception as e:
                print(f"  skip delete {ws.title}: {e}")

    # Reorder tabs
    requests = []
    for idx, title in enumerate(TAB_ORDER):
        try:
            ws = wb.worksheet(title)
        except Exception:
            continue
        requests.append(
            {
                "updateSheetProperties": {
                    "properties": {"sheetId": ws.id, "index": idx},
                    "fields": "index",
                }
            }
        )
    if requests:
        wb.batch_update({"requests": requests})

    cfg["tabs"] = {ws.title: {"gid": str(ws.id), "name": ws.title} for ws in wb.worksheets()}
    cfg["googleSheetsId"] = wb.id
    cfg["googleSheetsUrl"] = f"https://docs.google.com/spreadsheets/d/{wb.id}/edit"
    save_config(cfg)

    print("\nDone — human-friendly Hebrew layout.")
    print(cfg["googleSheetsUrl"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
