# Seoul + Japan Trip 2026

אתר המסלול של עידן ושחר — **סיאול → יפן** (27 באוגוסט – 23/24 בספטמבר 2026).

## Live site

**https://idanhaitner.github.io/ItinerarySeoulJapan/**

## מבנה הפרויקט

```
docs/          ← האתר (GitHub Pages)
scripts/       ← סקריפטי בנייה
reference/     ← אקסל השראה מהמשפחה
```

## תצוגה מקומית

```bash
cd docs
python3 -m http.server 8080
```

Open http://localhost:8080

## עדכון תוכן האתר

1. ערכו את `scripts/build_data.py` (מבנה ימים / מקומות)
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
