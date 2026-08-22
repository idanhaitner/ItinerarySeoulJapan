#!/usr/bin/env python3
"""Normalize city names on לוח זמנים + ימים, color every city, trim & restyle."""
from __future__ import annotations

import re
import sys
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from push_collab_sheets import (  # noqa: E402
    FONT_FAMILY,
    apply_spreadsheet_theme,
    color_by_city,
    format_date_columns,
    get_credentials,
    load_config,
    open_workbook,
    set_basic_format,
    style_tab,
)
from reformat_days_from_timeline import (  # noqa: E402
    DAYS_HEADER,
    day_title,
    group_timeline,
    hotel_for_night,
    load_bookings,
    load_hotels,
    main_city,
    notes_text,
    parse_date,
    plan_text,
    restyle_days,
)

# Soft distinct fills per city (no neon)
CITY_COLORS = {
    "תל אביב": {"red": 0.90, "green": 0.93, "blue": 0.97},
    "אדיס אבבה": {"red": 0.95, "green": 0.92, "blue": 0.88},
    "סיאול": {"red": 0.96, "green": 0.91, "blue": 0.97},
    "טוקיו": {"red": 0.90, "green": 0.94, "blue": 0.99},
    "קוואגוצ׳יקו": {"red": 0.90, "green": 0.95, "blue": 0.96},
    "גוטמבה": {"red": 0.94, "green": 0.94, "blue": 0.90},
    "הקונה": {"red": 0.98, "green": 0.94, "blue": 0.88},
    "אודאווארה": {"red": 0.93, "green": 0.93, "blue": 0.95},
    "קיוטו": {"red": 1.00, "green": 0.94, "blue": 0.90},
    "אוג'י": {"red": 0.93, "green": 0.96, "blue": 0.92},
    "אוג׳י": {"red": 0.93, "green": 0.96, "blue": 0.92},
    "אוסקה": {"red": 0.99, "green": 0.91, "blue": 0.93},
    "נארה": {"red": 0.95, "green": 0.93, "blue": 0.90},
    "איקדה": {"red": 0.92, "green": 0.95, "blue": 0.93},
    "קובה": {"red": 0.93, "green": 0.91, "blue": 0.96},
    "ניקו": {"red": 0.91, "green": 0.95, "blue": 0.91},
    "קמאקורה": {"red": 0.90, "green": 0.94, "blue": 0.95},
    "אנושימה": {"red": 0.90, "green": 0.93, "blue": 0.96},
    "דובאי": {"red": 0.97, "green": 0.93, "blue": 0.88},
    "טירנה": {"red": 0.94, "green": 0.92, "blue": 0.96},
}

FAKE_CITIES = {
    "נסיעה",
    "מעבר",
    "טיסה",
    "טיסה / קונקשן",
    "שדה התעופה",
    "קונקשן",
}

# Title → destination city for travel rows
TITLE_DEST = [
    (r"Kawaguchiko|קוואגוצ", "קוואגוצ׳יקו"),
    (r"גוטמבה|Gotemba", "גוטמבה"),
    (r"הקונה-יומוטו|להקונה|Hakone|Zagakukan", "הקונה"),
    (r"אודאווארה|Odawara", "אודאווארה"),
    (r"שינקנסן לקיוטו|לקיוטו", "קיוטו"),
    (r"Kiyomizu|גיון|פושימי|ארשיאמה|קיבונה|Biovortex|Nishiki|נישיקי", "קיוטו"),
    (r"לאוסקה|Shinsaibashi|Universal|Dotonbori|דוטונבורי", "אוסקה"),
    (r"לנארה|Nara", "נארה"),
    (r"לאיקדה|Ikeda|Cup Noodles", "איקדה"),
    (r"לקובה|Kobe|סנומיה", "קובה"),
    (r"לניקו|Nikko|Spacia|Toshogu|קגון", "ניקו"),
    (r"לקמאקורה|Kamakura|Kotoku", "קמאקורה"),
    (r"אנושימה|Enoshima|Enoden", "אנושימה"),
    (r"לטוקיו|נריטה|N'EX|Narita|Ginza|נאקאנו|Azabudai|Nozomi", "טוקיו"),
    (r"מאינצ'און|להונגדה|לסיאול|ICN|אינצ", "סיאול"),
    (r"דובאי|DXB|Emirates EK2478", "דובאי"),
    (r"טירנה|TIA|Tirana", "טירנה"),
    (r"לאדיס|ADD", "אדיס אבבה"),
]


def normalize_apostrophe(s: str) -> str:
    return (s or "").replace("'", "׳").replace("'", "׳").strip()


def pick_from_slash(raw: str) -> str:
    """אוסקה/טוקיו → destination (last part)."""
    parts = [normalize_apostrophe(p) for p in re.split(r"[/／]", raw) if p.strip()]
    if not parts:
        return ""
    return parts[-1]


def is_real_city(name: str) -> bool:
    name = normalize_apostrophe(name)
    if not name or name in FAKE_CITIES:
        return False
    if "/" in name or "／" in name:
        return False
    if name.startswith("טיסה"):
        return False
    return True


def city_from_title(title: str, note: str = "") -> str:
    blob = f"{title} {note}"
    for pat, city in TITLE_DEST:
        if re.search(pat, blob, re.I):
            return city
    return ""


def resolve_city(raw: str, title: str, note: str, prev: str) -> str:
    raw = normalize_apostrophe(raw)
    if "/" in raw or "／" in raw:
        # Prefer destination side
        picked = pick_from_slash(raw)
        if is_real_city(picked):
            return picked
    if is_real_city(raw):
        return raw
    # Fake / travel label → infer from title, else carry forward
    inferred = city_from_title(title, note)
    if inferred:
        return inferred
    if prev:
        return prev
    return "טוקיו"  # last resort


def color_cities(wb, ws, values, city_col: int, ncols: int):
    """Color city column using expanded palette (overrides push_collab_sheets map)."""
    requests = []
    for r_idx, row in enumerate(values[1:], start=1):
        if len(row) <= city_col:
            continue
        city = normalize_apostrophe(row[city_col])
        color = CITY_COLORS.get(city)
        if not color:
            continue
        requests.append(
            {
                "repeatCell": {
                    "range": {
                        "sheetId": ws.id,
                        "startRowIndex": r_idx,
                        "endRowIndex": r_idx + 1,
                        "startColumnIndex": city_col,
                        "endColumnIndex": city_col + 1,
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


def restyle_timeline(wb, ws, values):
    nrows = len(values)
    ncols = 9
    set_basic_format(wb, ws, nrows, ncols)
    format_date_columns(wb, ws, [0], nrows)
    color_cities(wb, ws, values, 2, ncols)
    style_tab(wb, ws, "לוח זמנים")
    widths = [105, 65, 110, 65, 65, 260, 340, 40, 40]
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
    # Hide unused place/notes columns if empty-ish — keep them narrow
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
                            "horizontalAlignment": "RIGHT",
                            "verticalAlignment": "TOP",
                            "wrapStrategy": "WRAP",
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)",
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
                "properties": {"pixelSize": 44},
                "fields": "pixelSize",
            }
        }
    )
    # Trim grid: keep small buffer only
    reqs.append(
        {
            "updateSheetProperties": {
                "properties": {
                    "sheetId": ws.id,
                    "gridProperties": {
                        "rowCount": max(nrows + 5, 40),
                        "columnCount": 9,
                    },
                },
                "fields": "gridProperties.rowCount,gridProperties.columnCount",
            }
        }
    )
    for i in range(0, len(reqs), 80):
        wb.batch_update({"requests": reqs[i : i + 80]})


def restyle_days_full(wb, ws, values):
    nrows = len(values)
    ncols = len(DAYS_HEADER)
    set_basic_format(wb, ws, nrows, ncols)
    format_date_columns(wb, ws, [0], nrows)
    color_cities(wb, ws, values, 2, ncols)
    style_tab(wb, ws, "ימים")
    widths = [105, 65, 110, 220, 400, 200, 300]
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
                            "horizontalAlignment": "RIGHT",
                            "verticalAlignment": "TOP",
                            "wrapStrategy": "WRAP",
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)",
                }
            }
        )
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
                        "textFormat": {"fontFamily": FONT_FAMILY, "fontSize": 11, "bold": True}
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
                "properties": {"pixelSize": 110},
                "fields": "pixelSize",
            }
        }
    )
    reqs.append(
        {
            "updateSheetProperties": {
                "properties": {
                    "sheetId": ws.id,
                    "gridProperties": {
                        "rowCount": max(nrows + 5, 40),
                        "columnCount": ncols,
                    },
                },
                "fields": "gridProperties.rowCount,gridProperties.columnCount",
            }
        }
    )
    for i in range(0, len(reqs), 80):
        wb.batch_update({"requests": reqs[i : i + 80]})


def main() -> int:
    get_credentials(interactive=False)
    wb = open_workbook(load_config())
    apply_spreadsheet_theme(wb)

    tl = wb.worksheet("לוח זמנים")
    raw = tl.get_all_values()
    header = raw[0][:9]
    fixed = [header]
    prev = ""
    changed = 0
    for r in raw[1:]:
        if not any((c or "").strip() for c in r):
            continue
        row = (r + [""] * 9)[:9]
        d = parse_date(row[0])
        if d:
            row[0] = d.isoformat()
        old = row[2]
        new = resolve_city(row[2], row[5], row[6], prev)
        new = normalize_apostrophe(new)
        if new != normalize_apostrophe(old):
            changed += 1
        row[2] = new
        if is_real_city(new):
            prev = new
        row[5] = row[5].replace("טoyiוסו", "טויוסו")
        row[6] = row[6].replace("טoyiוסו", "טויוסו")
        fixed.append(row)

    tl.clear()
    tl.update(fixed, value_input_option="USER_ENTERED")
    restyle_timeline(wb, tl, fixed)

    # Rebuild ימים cities from cleaned timeline
    hotels = load_hotels(wb)
    bookings = load_bookings(wb)
    days_rows = [DAYS_HEADER]
    for d, wd, items in group_timeline(fixed):
        city = main_city(items)
        city = normalize_apostrophe(city)
        # If main_city somehow empty, use last item city
        if not city:
            for it in reversed(items):
                if is_real_city(it.get("city") or ""):
                    city = normalize_apostrophe(it["city"])
                    break
        days_rows.append(
            [
                d.isoformat(),
                wd,
                city,
                day_title(d, city, items),
                plan_text(items),
                hotel_for_night(d, hotels),
                notes_text(d, items, bookings),
            ]
        )

    days_ws = wb.worksheet("ימים")
    days_ws.clear()
    days_ws.update(days_rows, value_input_option="USER_ENTERED")
    restyle_days_full(wb, days_ws, days_rows)

    # Report cities
    from collections import Counter

    c_tl = Counter(r[2] for r in fixed[1:])
    c_d = Counter(r[2] for r in days_rows[1:])
    print(f"לוח זמנים: {len(fixed)-1} rows, city cells changed: {changed}")
    print("Cities (timeline):", dict(c_tl))
    print("Cities (days):", dict(c_d))
    bad = [c for c in c_tl if c in FAKE_CITIES or "/" in c]
    print("Bad leftover:", bad)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
