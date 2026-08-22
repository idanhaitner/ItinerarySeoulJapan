#!/usr/bin/env python3
"""Rebuild ימים from לוח זמנים (simple) and restyle both tabs."""
from __future__ import annotations

import re
import sys
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from push_collab_sheets import (  # noqa: E402
    CITY_COLORS,
    FONT_FAMILY,
    HEADER_BG,
    HEADER_FG,
    WHITE,
    ZEBRA,
    BORDER,
    apply_spreadsheet_theme,
    color_by_city,
    format_date_columns,
    get_credentials,
    load_config,
    open_workbook,
    set_basic_format,
    style_tab,
)

TAB_TIMELINE = "לוח זמנים"
TAB_DAYS = "ימים"
DAYS_HEADER = ["תאריך", "יום", "עיר", "כותרת", "מה בתוכנית", "מלון", "הערות"]

# Skip these booking types from day notes (not time-scoped attractions)
SKIP_BOOKING_PREFIXES = (
    "ביטוח",
    "Visit Japan",
    "K-ETA",
    "רישיון",
    "מלון",
    "IDP",
)

# Prefer matching timeline titles containing these when attaching times to bookings
BOOKING_MATCH = [
    ("Changdeokgung|גן סודי", "Changdeokgung|צ'אנגדוק|גן הסודי"),
    ("Unni", "Unni"),
    ("Moclock|שיער|טיפולי שיער", "Moclock"),
    ("Forena|טיפול פנים|ייעוץ וטיפול", "Forena"),
    ("Yeonnam|Chwihyang|צהריים בסיאול", "Chwihyang"),
    ("Lotte", "לוטה וורלד|Lotte World"),
    ("N Seoul", "N Seoul|מגדל N"),
    ("Shibuya Sky", "Shibuya Sky"),
    ("teamLab Planets", "teamLab Planets"),
    ("Street Kart", "Street Kart|קארטינג"),
    ("Fuji-Q", "Fuji-Q"),
    ("אוטובוס.*קוואגוצ|בין-עירוני", "אוטובוס ל-Kawaguchiko"),
    ("Hikari|שינקנסן Hikari", "שינקנסן לקיוטו"),
    ("Biovortex", "Biovortex"),
    ("USJ|Universal|Express Pass|Studio Pass", "Universal Studios|כניסה ל-Universal"),
    ("Cup Noodles|ראמן", "Cup Noodles|מוזיאון הראמן"),
    ("בשר קובה|Kobe beef", "בשר קובה"),
    ("פנקייקים", "פנקייק|panel"),
    ("טונה|maguro", "טונה|maguro"),
    ("Nozomi", "Nozomi"),
    ("Spacia", "Spacia"),
    ("Emirates|אמירייטס|EK319|EK2478", "Emirates|EK319|EK2478"),
    ("ET0419|ET0672|טיסת יציאה", "ET0419|ET0672"),
    ("YP7321|Air Premia", "YP7321|Air Premia"),
    ("המבורגר|KITAN", "המבורגר|KITAN|HIBIKI"),
]


def parse_date(raw: str) -> date | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    if re.match(r"^\d{4}-\d{2}-\d{2}$", raw):
        return datetime.strptime(raw, "%Y-%m-%d").date()
    parts = raw.split("/")
    if len(parts) != 3:
        return None
    a, b, y = int(parts[0]), int(parts[1]), int(parts[2])
    cands: list[date] = []
    if a > 12:
        cands.append(date(y, b, a))
    elif b > 12:
        cands.append(date(y, a, b))
    else:
        cands.append(date(y, b, a))
        cands.append(date(y, a, b))
    trip = [d for d in cands if date(2026, 8, 26) <= d <= date(2026, 9, 26)]
    return trip[0] if trip else cands[0]


def fmt_time(t: str) -> str:
    t = (t or "").strip()
    m = re.match(r"^(\d{1,2}):(\d{2})$", t)
    if not m:
        return t
    return f"{int(m.group(1)):02d}:{m.group(2)}"


def time_range(start: str, end: str) -> str:
    s, e = fmt_time(start), fmt_time(end)
    if s and e:
        return f"{s} עד {e}"
    return s or e


def main_city(items: list[dict]) -> str:
    skip = {"נסיעה", "טיסה", "טיסה / קונקשן", "מעבר", "שדה התעופה"}
    counts: dict[str, int] = defaultdict(int)
    for it in items:
        c = (it.get("city") or "").strip()
        if not c or c in skip or "/" in c:
            continue
        counts[c] += 1
    if counts:
        return max(counts, key=counts.get)
    # fallback: last concrete-ish city
    for it in reversed(items):
        c = (it.get("city") or "").strip()
        if c and c not in skip:
            return c.split("/")[-1]
    return ""


def day_title(d: date, city: str, items: list[dict]) -> str:
    titles = [it["title"] for it in items if it.get("title")]
    # Hand-tuned short titles for key days
    special = {
        date(2026, 8, 26): "טיסה לתל אביב → סיאול דרך אדיס",
        date(2026, 8, 27): "נחיתה בסיאול וצ׳ק־אין בהונגדה",
        date(2026, 8, 28): "ארמונות, אינסאדונג ואולג׳ירו",
        date(2026, 8, 29): "גן סודי, גנגנאם ודונגדאמון",
        date(2026, 8, 30): "Forena, יונאם ומערב סיאול",
        date(2026, 8, 31): "לוטה וורלד וג׳ימג׳ילבאנג",
        date(2026, 9, 1): "נאמדאמון, סאונגסו ומגדל N",
        date(2026, 9, 2): "טיסה לטוקיו וערב בשינג׳וקו",
        date(2026, 9, 3): "Meiji, Harajuku ו־Shibuya Sky",
        date(2026, 9, 4): "צוקיג׳י, teamLab ואודאיבה",
        date(2026, 9, 5): "אסאקוסה, Skytree ואקיהברה",
        date(2026, 9, 6): "קיצ׳וג׳י, שימוקיטזאווה ו־Street Kart",
        date(2026, 9, 7): "מעבר לקוואגוצ׳יקו ואגם פוג׳י",
        date(2026, 9, 8): "צ׳ורייטו ו־Fuji-Q",
        date(2026, 9, 9): "גוטמבה והגעה להקונה",
        date(2026, 9, 10): "מעגל הקונה ושינקנסן לקיוטו",
        date(2026, 9, 11): "קיומיזו וגיון",
        date(2026, 9, 12): "פושימי אינארי ואוג׳י",
        date(2026, 9, 13): "ארשיאמה",
        date(2026, 9, 14): "קיבונה, קורמה ו־Biovortex",
        date(2026, 9, 15): "מקדשי קיוטו ומעבר לאוסקה",
        date(2026, 9, 16): "Universal Studios Japan",
        date(2026, 9, 17): "טיול יום לנארה",
        date(2026, 9, 18): "מוזיאון הראמן וקורומון",
        date(2026, 9, 19): "טירה, שינסקאי ו־Umeda",
        date(2026, 9, 20): "טיול יום לקובה",
        date(2026, 9, 21): "חזרה לטוקיו, נאקאנו ומגדל טוקיו",
        date(2026, 9, 22): "טיול יום לניקו",
        date(2026, 9, 23): "גינזה וחג לאומי",
        date(2026, 9, 24): "קמאקורה ואנושימה",
        date(2026, 9, 25): "יום אחרון ונריטה",
        date(2026, 9, 26): "דובאי → טירנה",
    }
    if d in special:
        return special[d]
    # fallback: first 2 activity titles
    picks = [t for t in titles if not t.startswith("נסיעה") and "צ'ק" not in t and "צ׳ק" not in t][:2]
    if picks:
        return " · ".join(picks)
    return city or "יום טיול"


def plan_text(items: list[dict]) -> str:
    """Chronological bullets of what we do — titles only, no clock times."""
    lines = []
    for it in items:
        title = (it.get("title") or "").strip()
        if not title:
            continue
        lines.append(f"• {title}")
    return "\n".join(lines)


def hotel_for_night(d: date, hotels: list[dict]) -> str:
    """Hotel slept that night: stay start <= D < stay end (end = checkout morning)."""
    if d == date(2026, 8, 26):
        return "טיסת לילה"
    if d >= date(2026, 9, 25):
        return "—"
    for h in hotels:
        # Seoul sheet range starts 26/8 (flight day) — first sleep is 27/8
        start = h["start"]
        if start == date(2026, 8, 26) and "Brick" in h["name"]:
            start = date(2026, 8, 27)
        if start <= d < h["end"]:
            return h["name"]
    return "—"


def load_hotels(wb) -> list[dict]:
    ws = wb.worksheet("מלונות")
    rows = ws.get_all_values()
    out = []
    for r in rows[1:]:
        if len(r) < 4:
            continue
        start, end = parse_date(r[1]), parse_date(r[2])
        if not start or not end:
            continue
        out.append({"start": start, "end": end, "name": (r[3] or "").strip()})
    return out


def load_bookings(wb) -> dict[date, list[dict]]:
    """Only already-booked items (הוזמן) from להזמין — no hotels / paperwork."""
    ws = wb.worksheet("להזמין")
    rows = ws.get_all_values()
    by: dict[date, list[dict]] = defaultdict(list)
    for r in rows[1:]:
        if len(r) < 3:
            continue
        name = (r[0] or "").strip().lstrip("— ").strip()
        status = (r[2] or "").strip()
        if not name or status != "הוזמן":
            continue
        if name.startswith("מלון") or name.startswith("ביטוח") or "Visit Japan" in name or "רישיון" in name:
            continue
        d = parse_date(r[1])
        if not d:
            d = parse_date((r[1] or "").replace(".", "/"))
        if not d:
            continue
        by[d].append(
            {
                "name": name,
                "status": status,
                "note": ((r[3] if len(r) > 3 else "") or "").strip(),
            }
        )
    return by


def timeline_time_for_booking(booking_name: str, items: list[dict]) -> str:
    """Match booking → timeline title (not notes) so nearby mentions don't steal the time."""
    for keys, pattern in BOOKING_MATCH:
        if not re.search(keys, booking_name, re.I):
            continue
        matches = []
        for it in items:
            title = it.get("title") or ""
            if re.search(pattern, title, re.I):
                matches.append(it)
        if not matches:
            continue
        matches.sort(
            key=lambda it: (
                0 if (it.get("end") or "") else 1,
                0 if not re.search(r"יציאה|נסיעה ל", it.get("title") or "") else 1,
            )
        )
        best = matches[0]
        return time_range(best.get("start") or "", best.get("end") or "")
    return ""


def notes_text(d: date, items: list[dict], bookings_by_day: dict[date, list[dict]]) -> str:
    """הערות: רק דברים שכבר הוזמנו מטאב להזמין (+ שעה / הערה חשובה)."""
    lines = []
    seen: set[str] = set()
    for b in bookings_by_day.get(d, []):
        name = b["name"]
        fuzzy = "yeonnam" if re.search(r"yeonnam|chwihyang|צהריים בסיאול", name, re.I) else re.sub(r"\s+", "", name.lower())[:24]
        if fuzzy in seen:
            continue
        seen.add(fuzzy)

        tr = timeline_time_for_booking(name, items)
        note = b["note"]
        if not tr:
            m = re.search(r"(\d{1,2}:\d{2})(?:\s*[–\-→]\s*(\d{1,2}:\d{2}))?", note)
            if m:
                tr = time_range(m.group(1), m.group(2) or "")

        # Clean display name — English in parentheses, no em-dashes (breaks RTL)
        display = name
        if re.search(r"שיער|Moclock", name, re.I):
            display = "טיפול שיער (Moclock)"
        elif re.search(r"טיפול פנים|Forena", name, re.I):
            display = "ייעוץ וטיפול (Forena Clinic)"
        elif re.search(r"צהריים בסיאול|Yeonnam|Chwihyang", name, re.I):
            display = "צהריים (Yeonnam Chwihyang)"
        elif re.search(r"בשר קובה", name, re.I):
            display = "ארוחת בשר קובה"
        elif re.search(r"טונה|maguro", name, re.I):
            display = "ארוחת טונה (Maguro Mart, מזומן בלבד)"
        elif re.search(r"פנקייקים", name, re.I):
            display = "פנקייקים (Panel Cafe Kyoto)"
        elif re.search(r"קוואוגוצ|Kawaguchiko|Koushiya", name, re.I):
            display = "ארוחת ערב (Koushiya)"
        elif re.search(r"Biovortex", name, re.I):
            display = "teamLab Biovortex"
        elif re.search(r"Express Pass", name, re.I):
            display = "USJ Express Pass"
        elif re.search(r"Lotte", name, re.I):
            display = "Lotte World"
        elif re.search(r"N Seoul", name, re.I):
            display = "שקיעה במגדל N"
        elif re.search(r"Emirates|אמירייטס", name, re.I):
            display = "טיסות Emirates (EK319 + EK2478)"
        elif re.search(r"ET0419|ET0672", name, re.I):
            display = "טיסות Ethiopian (ET0419 + ET0672)"
        elif re.search(r"YP7321|Air Premia", name, re.I):
            display = "טיסת Air Premia (YP7321)"

        # Important note only (short) — skip if it just repeats the time we already show
        important = ""
        note_clean = note
        if tr:
            note_clean = re.sub(r"\d{1,2}:\d{2}(?:\s*[–\-→]\s*\d{1,2}:\d{2})?", "", note_clean)
            note_clean = re.sub(r"\s{2,}", " ", note_clean).strip(" ·,-")
        if re.search(r"מזומן|cash|Oversized|Economy", note_clean, re.I) and "מזומן" not in display:
            important = note_clean
        elif re.search(r"Gennkichi", note_clean, re.I):
            important = "Gennkichi"
        elif note_clean and len(note_clean) <= 40 and not re.search(
            r"^(Forena|Moclock|Yeonnam|16/9|Lotte|panel|Air Premia|Ethiopian|Koushiya|maguro|Beef)",
            note_clean,
            re.I,
        ):
            important = note_clean
        if important and len(important) > 80:
            important = important[:77] + "…"
        if important and re.search(r"panel cafe|maguro mart", important, re.I):
            important = ""
        if "מזומן" in display and important and "מזומן" in important:
            important = ""

        # RTL-friendly: bullet + time + middle-dot + text (no em-dash)
        if tr:
            line = f"• {tr} · {display}"
        else:
            line = f"• {display}"
        if important and important not in line:
            line += f" · {important}"
        lines.append(line)

    return "\n".join(lines)


def group_timeline(rows: list[list[str]]) -> list[tuple[date, str, list[dict]]]:
    by: dict[date, list[dict]] = defaultdict(list)
    weekday: dict[date, str] = {}
    for r in rows[1:]:
        if len(r) < 6:
            continue
        d = parse_date(r[0])
        if not d:
            continue
        weekday[d] = (r[1] or "").strip()
        by[d].append(
            {
                "city": (r[2] or "").strip(),
                "start": (r[3] or "").strip(),
                "end": (r[4] or "").strip(),
                "title": (r[5] or "").strip(),
                "note": (r[6] or "").strip() if len(r) > 6 else "",
            }
        )
    out = []
    for d in sorted(by.keys()):
        out.append((d, weekday.get(d, ""), by[d]))
    return out


def restyle_timeline(wb, ws, values: list[list[str]]):
    nrows = len(values)
    ncols = max(len(r) for r in values)
    set_basic_format(wb, ws, nrows, ncols)
    format_date_columns(wb, ws, [0], nrows)
    color_by_city(wb, ws, values, city_col=2, ncols=ncols)
    style_tab(wb, ws, TAB_TIMELINE)
    # Column widths: date, weekday, city, time, until, activity, details, place, notes
    widths = [110, 70, 110, 70, 70, 280, 360, 200, 140]
    reqs = []
    for i, w in enumerate(widths[:ncols]):
        reqs.append(
            {
                "updateDimensionProperties": {
                    "range": {
                        "sheetId": ws.id,
                        "dimension": "COLUMNS",
                        "startIndex": i,
                        "endIndex": i + 1,
                    },
                    "properties": {"pixelSize": w},
                    "fields": "pixelSize",
                }
            }
        )
    # Activity + details right/top aligned
    for col in (5, 6):
        reqs.append(
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
                            "horizontalAlignment": "CENTER",
                            "verticalAlignment": "MIDDLE",
                            "wrapStrategy": "WRAP",
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)",
                }
            }
        )
    # Row height body
    reqs.append(
        {
            "updateDimensionProperties": {
                "range": {
                    "sheetId": ws.id,
                    "dimension": "ROWS",
                    "startIndex": 1,
                    "endIndex": nrows,
                },
                "properties": {"pixelSize": 48},
                "fields": "pixelSize",
            }
        }
    )
    for i in range(0, len(reqs), 80):
        wb.batch_update({"requests": reqs[i : i + 80]})


def restyle_days(wb, ws, values: list[list[str]]):
    nrows = len(values)
    ncols = len(DAYS_HEADER)
    set_basic_format(wb, ws, nrows, ncols)
    format_date_columns(wb, ws, [0], nrows)
    color_by_city(wb, ws, values, city_col=2, ncols=ncols)
    style_tab(wb, ws, TAB_DAYS)
    widths = [110, 70, 100, 220, 420, 200, 320]
    reqs = []
    for i, w in enumerate(widths):
        reqs.append(
            {
                "updateDimensionProperties": {
                    "range": {
                        "sheetId": ws.id,
                        "dimension": "COLUMNS",
                        "startIndex": i,
                        "endIndex": i + 1,
                    },
                    "properties": {"pixelSize": w},
                    "fields": "pixelSize",
                }
            }
        )
    # Plan + notes + title: centered wrap (RTL-safe)
    for col in (3, 4, 6):
        reqs.append(
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
                            "horizontalAlignment": "CENTER",
                            "verticalAlignment": "MIDDLE",
                            "wrapStrategy": "WRAP",
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)",
                }
            }
        )
    # Title bold
    reqs.append(
        {
            "repeatCell": {
                "range": {
                    "sheetId": ws.id,
                    "startRowIndex": 1,
                    "endRowIndex": nrows,
                    "startColumnIndex": 3,
                    "endColumnIndex": 4,
                },
                "cell": {
                    "userEnteredFormat": {
                        "textFormat": {
                            "fontFamily": FONT_FAMILY,
                            "fontSize": 11,
                            "bold": True,
                        }
                    }
                },
                "fields": "userEnteredFormat.textFormat",
            }
        }
    )
    reqs.append(
        {
            "updateDimensionProperties": {
                "range": {
                    "sheetId": ws.id,
                    "dimension": "ROWS",
                    "startIndex": 1,
                    "endIndex": nrows,
                },
                "properties": {"pixelSize": 120},
                "fields": "pixelSize",
            }
        }
    )
    for i in range(0, len(reqs), 80):
        wb.batch_update({"requests": reqs[i : i + 80]})


def main() -> int:
    get_credentials(interactive=False)
    cfg = load_config()
    wb = open_workbook(cfg)
    apply_spreadsheet_theme(wb)

    tl_ws = wb.worksheet(TAB_TIMELINE)
    tl_values = tl_ws.get_all_values()
    hotels = load_hotels(wb)
    bookings = load_bookings(wb)

    days_rows = [DAYS_HEADER]
    for d, wd, items in group_timeline(tl_values):
        city = main_city(items)
        title = day_title(d, city, items)
        plan = plan_text(items)
        hotel = hotel_for_night(d, hotels)
        notes = notes_text(d, items, bookings)
        days_rows.append(
            [
                d.isoformat(),
                wd,
                city,
                title,
                plan,
                hotel,
                notes,
            ]
        )

    # Write ימים
    days_ws = wb.worksheet(TAB_DAYS)
    days_ws.clear()
    try:
        days_ws.resize(rows=max(len(days_rows) + 10, 40), cols=10)
    except Exception:
        pass
    days_ws.update(days_rows, value_input_option="USER_ENTERED")
    restyle_days(wb, days_ws, days_rows)

    # Restyle לוח זמנים (normalize dates to ISO without rewriting content otherwise)
    # Re-read and lightly normalize date col only
    fixed = [tl_values[0]]
    for r in tl_values[1:]:
        row = (r + [""] * 9)[:9]
        dd = parse_date(row[0])
        if dd:
            row[0] = dd.isoformat()
        # fix Toyosu typo if present
        row[5] = row[5].replace("טoyiוסו", "טויוסו")
        row[6] = row[6].replace("טoyiוסו", "טויוסו")
        fixed.append(row)
    tl_ws.clear()
    tl_ws.update(fixed, value_input_option="USER_ENTERED")
    restyle_timeline(wb, tl_ws, fixed)

    print(f"ימים: {len(days_rows) - 1} days")
    print(f"לוח זמנים: restyled {len(fixed) - 1} rows")
    for r in days_rows[1:4]:
        print("-", r[0], r[2], r[3])
        if r[6]:
            print("  notes:", r[6][:100].replace("\n", " | "))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
