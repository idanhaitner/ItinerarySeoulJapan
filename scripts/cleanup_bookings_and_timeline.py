#!/usr/bin/env python3
"""Normalize להזמין notes (time + place) and add missing booked items to לוח זמנים."""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fix_sheet_cities import color_cities, is_real_city, normalize_apostrophe, restyle_days_full
from push_collab_sheets import apply_spreadsheet_theme, get_credentials, load_config, open_workbook
from reformat_days_from_timeline import (
    DAYS_HEADER,
    day_title,
    group_timeline,
    hotel_for_night,
    load_bookings,
    load_hotels,
    main_city,
    notes_text,
    plan_text,
)

# (name_match substring or exact start, date ISO, status, note)
# Notes: time + place only; short extra tip when useful. No dates.
BOOKING_NOTES: list[tuple[str, str, str, str]] = [
    ("רישיון נהיגה", "2026-09-06", "לטפל", "חובה ל-Street Kart | להנפיק בארץ"),
    ("ביטוח נסיעות", "2026-08-26", "לטפל", "לפני היציאה"),
    ("Visit Japan Web", "2026-09-02", "לטפל", "לפני נחיתה בנריטה"),
    ("USJ Studio Pass", "2026-09-16", "לטפל", "כרטיס כניסה | בנפרד מ-Express Pass"),
    ("Shibuya Sky", "2026-09-03", "לטפל", "שקיעה | נפתח 28 ימים מראש"),
    ("Street Kart", "2026-09-06", "לטפל", "19:00 Street Kart Tokyo | צריך IDP פיזי"),
    ("teamLab Planets", "2026-09-04", "לטפל", "כרטיס מתוזמן"),
    ("Fuji-Q", "2026-09-08", "לטפל", "Freepass | יום מלא"),
    ("Changdeokgung", "2026-08-29", "לטפל", "סיור מודרך בגן הסודי"),
    ("Unni Guide", "2026-08-29", "לטפל", "15:00-16:00 Unni Guide Center, Gangnam"),
    ("ארוחת צהריים Yeonnam", "2026-08-30", "הוזמן", "15:00 Yeonnam Chwihyang"),
    ("אוטובוס בין-עירוני", "2026-09-07", "לטפל", "Busta Shinjuku → Kawaguchiko | מושב שמור"),
    ("Hikari 653", "2026-09-10", "לטפל", "18:07-20:12 Odawara → Kyoto | קנייה במכונות ~17:45"),
    ("Nozomi", "2026-09-21", "לטפל", "Shin-Osaka → Tokyo | SmartEX"),
    ("Tobu Spacia", "2026-09-22", "לטפל", "~06:30 Asakusa → Nikko"),
    ("ארוחת פרידה", "2026-09-24", "לטפל", "וואגיו / אומקאסה"),
    ("טיסת אמירייטס", "2026-09-25", "הוזמן", "22:30 Narita (EK319 → DXB → EK2478 TIA)"),
    ("USJ Express Pass", "2026-09-16", "הוזמן", "Universal Studios Japan | Express Pass 7"),
    ("teamLab Biovortex", "2026-09-14", "הוזמן", "18:00-18:30 teamLab Biovortex Kyoto"),
    ("טיפולי שיער", "2026-08-29", "הוזמן", "16:30 Moclock Gangnam"),
    ("ייעוץ וטיפול פנים", "2026-08-30", "הוזמן", "10:30 Forena Clinic"),
    ("N Seoul Tower", "2026-09-01", "הוזמן", "שקיעה N Seoul Tower"),
    ("Lotte World", "2026-08-31", "הוזמן", "Lotte World, Jamsil"),
    ("מלון בהאקונה", "2026-09-09", "הוזמן", "Hotel Zagakukan"),
    ("מלון בקיוטו", "2026-09-10", "הוזמן", "KABIN Koji"),
    ("ארוחת בשר קובה", "2026-09-20", "הוזמן", "19:30 Kobe beef Gennkichi"),
    ("טיסת יציאה ET0419", "2026-08-26", "הוזמן", "ET0419 TLV→ADD + ET0672 ADD→ICN"),
    ("טיסת סיאול לטוקיו", "2026-09-02", "הוזמן", "08:50 YP7321 ICN→NRT (Air Premia)"),
    ("פנקייקים", "2026-09-15", "הוזמן", "10:00 Panel Cafe Kyoto"),
    ("ארוחת טונה", "2026-09-21", "הוזמן", "20:45 Maguro Mart (מזומן בלבד)"),
    ("ארוחת צהריים בסיאול", "2026-08-30", "הוזמן", "15:00 Yeonnam Chwihyang"),
    ("ארוחת ערב קוואוגוצ", "2026-09-07", "הוזמן", "18:00 Beef Cutlet Restaurant Koushiya"),
    ("המבורגר", "2026-09-19", "לטפל", "KITAN HIBIKI, Osaka"),
]


def match_booking_spec(name: str) -> tuple[str, str, str, str] | None:
    name = (name or "").strip().lstrip("— ").strip()
    for key, d, status, note in BOOKING_NOTES:
        if key in name:
            return key, d, status, note
    return None


def weekday_he(d: date) -> str:
    names = ["שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת", "ראשון"]
    return names[d.weekday()]


def _row_date(r: list[str]) -> date | None:
    from reformat_days_from_timeline import parse_date

    return parse_date(r[0] if r else "")


def patch_timeline(ws, rows: list[list[str]]) -> list[str]:
    """Update/insert booked items that are missing or generic in לוח זמנים."""
    from reformat_days_from_timeline import parse_date

    changes: list[str] = []
    header = rows[0]
    body = [list(r) + [""] * (9 - len(r)) for r in rows[1:]]
    names = ["שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת", "ראשון"]

    def find_indices(pred):
        return [i for i, r in enumerate(body) if pred(r)]

    # Normalize every date to ISO (avoids DD/MM flip on rewrite)
    for r in body:
        d = parse_date(r[0])
        if d:
            r[0] = d.isoformat()
            r[1] = names[d.weekday()]

    for i in find_indices(lambda r: "Moclock" in (r[5] or "") and _row_date(r) == date(2026, 8, 29)):
        body[i][3] = "16:30"
        body[i][4] = "18:00"
        body[i][6] = "תור שהוזמן. תחנת Nonhyeon יציאה 3, Yeongdong Bldg קומה 2."
        changes.append("Moclock → 16:30-18:00")

    for i in find_indices(
        lambda r: _row_date(r) == date(2026, 9, 7)
        and ((r[5] or "").strip() == "ארוחת ערב" or "Koushiya" in (r[5] or ""))
        and "קוואגוצ" in (r[2] or "")
    ):
        body[i][0] = "2026-09-07"
        body[i][3] = "18:00"
        body[i][5] = "ארוחת ערב ב-Koushiya (Beef Cutlet)"
        body[i][6] = "הזמנה ל-18:00 | Beef Cutlet Restaurant Koushiya."
        changes.append("07/09 ארוחת ערב → Koushiya 18:00")

    has_pancakes = any("Panel Cafe" in (r[5] or "") or "פנקייק" in (r[5] or "") for r in body)
    if not has_pancakes:
        insert_at = None
        for i, r in enumerate(body):
            if _row_date(r) == date(2026, 9, 15) and "Philosopher" in (r[5] or ""):
                insert_at = i + 1
                break
        if insert_at is None:
            for i, r in enumerate(body):
                if _row_date(r) == date(2026, 9, 15) and "גינקאקו" in (r[5] or ""):
                    insert_at = i + 1
                    break
        row = [
            "2026-09-15",
            "שלישי",
            "קיוטו",
            "10:00",
            "",
            "פנקייקים ב-Panel Cafe Kyoto",
            "הזמנה ל-10:00.",
            "Panel Cafe Kyoto",
            "",
        ]
        if insert_at is not None:
            body.insert(insert_at, row)
            changes.append("15/09 הוספת פנקייקים Panel Cafe 10:00")
        else:
            changes.append("FAILED: could not find 15/09 insert point")

    for i in find_indices(lambda r: _row_date(r) == date(2026, 9, 20) and "בשר קובה" in (r[5] or "")):
        body[i][3] = "19:30"
        body[i][5] = "ארוחת ערב: בשר קובה ב-Gennkichi"
        body[i][6] = "הזמנה ל-19:30 | Kobe beef Gennkichi (Sannomiya)."
        body[i][7] = "Gennkichi"
        changes.append("20/09 בשר קובה → Gennkichi 19:30")

    for i in find_indices(
        lambda r: _row_date(r) == date(2026, 9, 21)
        and ((r[5] or "").strip() == "ארוחת ערב" or "Maguro" in (r[5] or ""))
    ):
        body[i][3] = "20:45"
        body[i][5] = "ארוחת טונה ב-Maguro Mart"
        body[i][6] = "הזמנה ל-20:45 | תשלום במזומן בלבד."
        body[i][7] = "Maguro Mart"
        changes.append("21/09 ארוחת ערב → Maguro Mart 20:45")

    out = [header] + body
    ws.clear()
    ws.update(out, value_input_option="USER_ENTERED")
    return changes


def update_bookings_tab(ws) -> list[str]:
    rows = ws.get_all_values()
    header = rows[0][:4]
    new_rows = [header]
    changes = []
    for r in rows[1:]:
        name = (r[0] if r else "").strip()
        if not name:
            continue
        pad = list(r) + [""] * (4 - len(r))
        spec = match_booking_spec(name)
        if not spec:
            new_rows.append(pad[:4])
            changes.append(f"UNMATCHED: {name}")
            continue
        _key, d_iso, status, note = spec
        # Keep name tidy (strip leading dashes)
        clean_name = name.lstrip("— ").strip()
        if clean_name.startswith("טיפולי שיער"):
            clean_name = "טיפולי שיער (Moclock)"
        new_rows.append([clean_name, d_iso, status, note])
        if pad[1] != d_iso or (pad[3] or "").strip() != note or (pad[2] or "").strip() != status:
            changes.append(f"{clean_name}: notes/date/status updated")
    ws.clear()
    ws.update(new_rows, value_input_option="USER_ENTERED")
    return changes


def rebuild_days(wb) -> None:
    tl = wb.worksheet("לוח זמנים").get_all_values()
    hotels, bookings = load_hotels(wb), load_bookings(wb)
    days_rows = [DAYS_HEADER]
    for d, wd, items in group_timeline(tl):
        city = normalize_apostrophe(main_city(items) or "")
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
    ws = wb.worksheet("ימים")
    ws.clear()
    ws.update(days_rows, value_input_option="USER_ENTERED")
    restyle_days_full(wb, ws, days_rows)
    wb.batch_update(
        {
            "requests": [
                {
                    "repeatCell": {
                        "range": {
                            "sheetId": ws.id,
                            "startRowIndex": 1,
                            "endRowIndex": len(days_rows),
                            "startColumnIndex": 0,
                            "endColumnIndex": 7,
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
            ]
        }
    )
    color_cities(wb, ws, days_rows, 2, 7)


def main() -> None:
    get_credentials(interactive=False)
    cfg = load_config()
    wb = open_workbook(cfg)

    book_ws = wb.worksheet("להזמין")
    b_changes = update_bookings_tab(book_ws)
    print("=== להזמין ===")
    for c in b_changes:
        print(" ", c)

    tl_ws = wb.worksheet("לוח זמנים")
    tl_rows = tl_ws.get_all_values()
    t_changes = patch_timeline(tl_ws, tl_rows)
    print("=== לוח זמנים ===")
    for c in t_changes:
        print(" ", c)

    apply_spreadsheet_theme(wb)
    rebuild_days(wb)
    print("=== ימים rebuilt ===")

    # Show sample booking notes
    print("=== sample notes ===")
    for r in book_ws.get_all_values()[1:]:
        if (r[2] if len(r) > 2 else "") == "הוזמן":
            print(f"  {r[1]} | {r[0]} → {r[3] if len(r)>3 else ''}")


if __name__ == "__main__":
    main()
