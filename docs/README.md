# Korea + Japan 2026 Trip Guide

Dark travel-app UI for the Haitner trip (**Aug 27 – Sep 25, 2026**).

**Live:** https://idanhaitner.github.io/ItinerarySeoulJapan/

## Features

- Hour-by-hour timelines with category icons
- Day carousel + city/category filters
- Inter-city transfer banners
- Booking checklist with localStorage progress
- Maps links (Google / Kakao / Naver / Yahoo! / Apple)
- Currency converter, taxi cards, transit tips
- Complete / favorite stops (persisted locally)

## Local preview

```bash
cd docs
python3 -m http.server 8080
```

## Edit content

1. Update `js/_build_data.py`
2. Run `python3 js/_build_data.py`
3. Commit & push (`main` + redeploy `gh-pages`)
