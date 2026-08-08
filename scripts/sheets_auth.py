#!/usr/bin/env python3
"""Authorize Google access (browser login) for read/write to the collab Sheet."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sheets_client import get_credentials  # noqa: E402


def main() -> int:
    creds = get_credentials(interactive=True)
    print("Google Sheets access OK.")
    print(f"Token valid: {bool(creds and creds.valid)}")
    print("Next: python3 scripts/push_collab_sheets.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
