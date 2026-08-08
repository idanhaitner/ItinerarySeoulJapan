# Collaborative itinerary (Google Sheets)

Shared Hebrew workbook for Idan + boyfriend.

**Live Sheet:** see `config.json` → `googleSheetsUrl`

## Tabs

| Tab | Purpose |
|---|---|
| לוח זמנים | Main editor |
| ימים | Day summaries |
| מלונות / להזמין / רעיונות | Trackers |

## Commands

```bash
python3 scripts/sheets_auth.py           # one-time Google login
python3 scripts/push_collab_sheets.py    # refresh Sheet from website data
python3 scripts/fetch_collab_sheets.py   # pull Sheet → local for sync
```

OAuth secrets (`google_oauth_client.json`, `google_token.json`) are gitignored.
