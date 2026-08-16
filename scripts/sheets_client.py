#!/usr/bin/env python3
"""Shared Google Sheets auth + client for the Japan trip collab workbook."""
from __future__ import annotations

import json
import re
from pathlib import Path

import gspread
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "collab" / "config.json"
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
]


def load_config() -> dict:
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def save_config(cfg: dict) -> None:
    CONFIG.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _auth_paths(cfg: dict | None = None) -> tuple[Path, Path]:
    cfg = cfg or load_config()
    access = cfg.get("access") or {}
    client_file = ROOT / access.get("oauthClientFile", "collab/google_oauth_client.json")
    token_file = ROOT / access.get("tokenFile", "collab/google_token.json")
    return client_file, token_file


def get_credentials(*, interactive: bool = True) -> Credentials:
    client_file, token_file = _auth_paths()
    creds = None
    if token_file.exists():
        creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            token_file.write_text(creds.to_json(), encoding="utf-8")
            return creds
        except Exception:
            creds = None
            if token_file.exists():
                token_file.unlink()
    if not interactive:
        raise SystemExit(
            "Google access not authorized yet. Run:\n  python3 scripts/sheets_auth.py"
        )
    if not client_file.exists():
        raise SystemExit(
            f"Missing OAuth client file: {client_file}\n\n"
            "Quick setup (once):\n"
            "1. Open https://console.cloud.google.com/apis/library/sheets.googleapis.com\n"
            "2. Enable Google Sheets API (+ Google Drive API)\n"
            "3. OAuth consent screen → External → add yourself as test user\n"
            "4. Credentials → Create OAuth client ID → Desktop app → Download JSON\n"
            "5. Save download as collab/google_oauth_client.json\n"
            "6. Re-run: python3 scripts/sheets_auth.py"
        )
    flow = InstalledAppFlow.from_client_secrets_file(str(client_file), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")
    token_file.parent.mkdir(parents=True, exist_ok=True)
    token_file.write_text(creds.to_json(), encoding="utf-8")
    print(f"Saved token → {token_file}")
    return creds


def client() -> gspread.Client:
    return gspread.authorize(get_credentials(interactive=False))


def extract_sheet_id(url: str) -> str:
    m = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", url or "")
    return m.group(1) if m else ""


def open_workbook(cfg: dict | None = None):
    cfg = cfg or load_config()
    gc = client()
    sheet_id = (cfg.get("googleSheetsId") or "").strip()
    url = (cfg.get("googleSheetsUrl") or "").strip()
    if sheet_id:
        return gc.open_by_key(sheet_id)
    if url:
        return gc.open_by_url(url)
    raise SystemExit(
        "No spreadsheet configured. Run python3 scripts/push_collab_sheets.py "
        "or set googleSheetsUrl in collab/config.json"
    )
