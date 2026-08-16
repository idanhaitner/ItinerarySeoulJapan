# Seoul + Japan Trip 2026

אתר המסלול של עידן ושחר — **סיאול → יפן** (27 באוגוסט – 23/24 בספטמבר 2026).

## Live site

**https://idanhaitner.github.io/ItinerarySeoulJapan/**

## מבנה הפרויקט

```
docs/          ← האתר (GitHub Pages)
scripts/       ← סקריפטי בנייה + Google Sheets sync
collab/        ← הגדרות שיתוף פעולה (Google Sheets)
reference/     ← אקסל השראה מהמשפחה
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

## עדכון תוכן האתר

1. עדכנו את Google Sheets (או ערכו ישירות את `scripts/build_data.py`)
2. הריצו `python3 scripts/build_data.py`
3. עדכנו עברית ב־`docs/js/he-data.js` אם צריך
4. Commit + push ל־`main` → GitHub Pages מתעדכן

רשימת קפה מ־Naver (סיאול):

```bash
python3 scripts/build_cafes.py
```

## הערות

- האתר בעברית (`he-data.js` מונח מעל `data.js`)
- קובץ האקסל ב־`reference/` הוא השראה בלבד — לא מקור האמת של המסלול
- מקור האמת של המסלול החי: `docs/js/data.js` + `docs/js/he-data.js`
