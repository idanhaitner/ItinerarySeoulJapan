# Korea + Japan 2026 Trip Guide

Static mobile + desktop website for the Haitner trip (**Aug 27 – Sep 25, 2026**).

## Features

- **30 days** with hour-by-hour timelines (Seoul + Japan)
- Search across days, places, and timeline stops
- City filters
- Maps:
  - **Google Maps** everywhere
  - **Kakao Map / Naver Map** in Korea
  - **Yahoo! MAP / Apple Maps** in Japan
- Plain HTML/CSS/JS — no build step

## Run locally

```bash
cd docs
python3 -m http.server 8080
```

Open http://localhost:8080

## Edit the trip

1. Edit `js/_build_data.py` (source of truth for days/places/timelines)
2. Run `python3 js/_build_data.py`
3. Refresh the site

Or edit `js/data.js` directly.

## Host on GitHub Pages

Settings → Pages → branch `main` → folder `/docs`
