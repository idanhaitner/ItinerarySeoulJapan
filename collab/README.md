# Collaborative itinerary (Google Sheets)

Shared Hebrew workbook for Idan + Shahar. This is the collaborative planning
source of truth; the deployed site is generated from the synchronized builder.

**Live Sheet:** see `config.json` → `googleSheetsUrl`

## Tabs

| Tab | Purpose |
|---|---|
| לוח זמנים | Main editor |
| ימים | Day summaries |
| מלונות / להזמין / רעיונות | Trackers |
| אטרקציות | Import into Google My Maps (Tag = `attraction`) |

## Commands

```bash
python3 scripts/sheets_auth.py           # one-time Google login
python3 scripts/fetch_collab_sheets.py   # pull Sheet → local for sync
python3 scripts/build_data.py             # rebuild docs/js/data.js after sync
python3 scripts/export_mymaps_attractions.py  # sights → אטרקציות + CSV/KML
python3 scripts/push_collab_sheets.py    # website data → Sheet (intentional overwrite)
```

`fetch_collab_sheets.py` records whether the Sheet changed since the last
website sync. It does not rewrite the builder automatically: reconcile the
timeline, bookings, hotels, Hebrew copy and place IDs first, then regenerate
the website data.

Do not run `push_collab_sheets.py` immediately after collaborators edit the
Sheet. It rebuilds tabs from the website data and is therefore the reverse
direction.

## Google My Maps (attractions layer)

Google cannot add pins to a shared My Map from here (no write API). Import the prepared layer:

1. Open [Google My Maps](https://www.google.com/mymaps) → your shared map (or **Create a new map** and Share it).
2. **Add layer** → name it `Attractions` → **Import**.
3. Pick **Google Drive** → this spreadsheet → tab **אטרקציות**  
   (or upload `collab/mymaps/attractions.csv` / `attractions.kml`).
4. Position: **Latitude** + **Longitude**. Title: **Name**.
5. Click **Uniform style** → **Group places by** → **Tag** → **Categories**.  
   All pins share the tag `attraction`. Set a landmark/camera icon on that group.

Re-run `export_mymaps_attractions.py` after itinerary changes, then in My Maps: layer ⋮ → **Reimport and merge**.

OAuth secrets (`google_oauth_client.json`, `google_token.json`) are gitignored.
