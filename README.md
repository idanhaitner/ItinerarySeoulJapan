# Seoul + Japan Trip 2026

מתכנן הטיול של עידן ושחר — **סיאול → יפן** (26 באוגוסט – 26 בספטמבר 2026).

## Live site

**https://idanhaitner.github.io/ItinerarySeoulJapan/**

## מה יש באתר

- מסלול יומי מפורט עם שעות, הזמנות, מלונות וטיפים
- מפה כרונולוגית ומפות לכל יום
- טיסות, מדריכי יעד, המלצות וכלי דרך
- ממשק עברי מלא ורספונסיבי

## מבנה הפרויקט

```
docs/          ← אתר GitHub Pages וקבצי runtime
scripts/       ← בניית נתונים, Google Sheets ו-My Maps
collab/        ← הגדרות Sheet ויצואי My Maps
reference/     ← חומרי השראה בלבד
```

## תצוגה מקומית

```bash
cd docs
python3 -m http.server 8080
```

Open http://localhost:8080

## שיתוף פעולה במסלול (Google Sheets)

טיוטת התכנון המשותפת: Google Sheets. פרטים ב־`collab/README.md`.

```bash
python3 scripts/fetch_collab_sheets.py   # משיכת ה־Sheet
python3 scripts/push_collab_sheets.py    # ריענון/עיצוב ה־Sheet מהמסלול
python3 scripts/export_mymaps_attractions.py  # אטרקציות → Google My Maps (CSV/KML + טאב בשיט)
```

## עדכון המסלול והאתר

Google Sheets הוא מקור התכנון המשותף. האתר נבנה מנתונים מובנים ב־`scripts/build_data.py`.

```bash
# 1. משיכת השינויים האחרונים מה-Sheet
python3 scripts/fetch_collab_sheets.py

# 2. אחרי סנכרון build_data.py + he-data.js + checklist.js
python3 scripts/build_data.py

# 3. אם נוספו/השתנו מקומות
python3 scripts/export_mymaps_attractions.py

# 4. בדיקות תחביר
python3 -m py_compile scripts/*.py
node --check docs/js/app.js
node --check docs/js/data.js
```

Push ל־`main` מפעיל את GitHub Pages. `docs/js/data.js` הוא קובץ generated אך חייב להישאר ב־Git, כי תהליך הפריסה מפרסם את `docs/` כפי שהוא.

רשימת קפה מ־Naver (סיאול):

```bash
python3 scripts/build_cafes.py
```

## הערות

- האתר בעברית (`he-data.js` מונח מעל `data.js`)
- קובץ האקסל ב־`reference/` הוא השראה בלבד — לא מקור האמת של המסלול
- אין לערוך ידנית את `docs/js/data.js`; מייצרים אותו מחדש דרך `build_data.py`
- `push_collab_sheets.py` הוא כיוון הפוך: נתוני האתר → Google Sheets. יש להריץ אותו רק כשבכוונה רוצים לרענן את ה־Sheet מהקוד
