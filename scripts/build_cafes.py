#!/usr/bin/env python3
"""Fetch Naver Map shared Cafe folder → docs/js/cafes.js

Source: https://naver.me/GudF9QEv
Share ID: 908ce219ad474757a55689b9d11729ac
"""

from __future__ import annotations

import json
import re
import subprocess
import time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS_JS = ROOT / "docs" / "js"
CACHE = ROOT / "scripts" / "cache"
SHARE_ID = "908ce219ad474757a55689b9d11729ac"
SOURCE = "https://naver.me/GudF9QEv"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

AREA_HE = {
    "마포구": "מאפו / הונגדה",
    "용산구": "יונגסאן / איטאוון",
    "종로구": "ג׳ונגנו",
    "서대문구": "סאודאמון",
    "성동구": "סאונגדונג / סונגסו",
    "성북구": "סאונגבוק",
    "중구": "ג׳ונג",
    "강남구": "גנגנאם",
    "영등포구": "יונגדנגפו",
    "동작구": "דונגג׳אק",
    "강북구": "גנגבוק",
    "강서구": "גנגסו",
    "서초구": "סאוצ׳ו",
    "기타": "אחר",
}


def curl_json(url: str) -> dict:
    for attempt in range(3):
        r = subprocess.run(
            [
                "curl",
                "-sL",
                "--max-time",
                "25",
                "-A",
                UA,
                "-H",
                "Accept: application/json",
                "-H",
                "Referer: https://map.naver.com/",
                url,
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if r.returncode == 0 and r.stdout.strip().startswith("{"):
            return json.loads(r.stdout)
        time.sleep(0.8 * (attempt + 1))
    return {}


def district_from_address(addr: str | None, road: str | None = "") -> tuple[str, str]:
    text = f"{addr or ''} {road or ''}"
    m = re.search(r"(서울|제주|부산|전북|경기|인천)\s*([가-힣]+구|[가-힣]+시|[가-힣]+군)", text)
    if m:
        return m.group(1), m.group(2)
    for eng, (city, gu) in {
        "Mapo-gu": ("서울", "마포구"),
        "Yongsan-gu": ("서울", "용산구"),
        "Jongno-gu": ("서울", "종로구"),
        "Seongdong-gu": ("서울", "성동구"),
        "Seodaemun-gu": ("서울", "서대문구"),
        "Jung-gu": ("서울", "중구"),
        "Gangnam-gu": ("서울", "강남구"),
        "Seongbuk-gu": ("서울", "성북구"),
        "Yeongdeungpo-gu": ("서울", "영등포구"),
        "Dongjak-gu": ("서울", "동작구"),
        "Gangbuk-gu": ("서울", "강북구"),
        "Gangseo-gu": ("서울", "강서구"),
        "Seocho-gu": ("서울", "서초구"),
    }.items():
        if eng in text:
            return city, gu
    if "Seoul" in text or "서울" in text:
        return "서울", "기타"
    return "", "기타"


def build_cafe(bookmark: dict, summary: dict) -> dict:
    sid = str(bookmark["sid"])
    pd = (summary.get("data") or {}).get("placeDetail") if isinstance(summary, dict) else None
    if not pd:
        city, gu = district_from_address(bookmark.get("address"))
        return {
            "id": sid,
            "name": bookmark.get("name"),
            "nameKo": bookmark.get("name"),
            "lat": bookmark.get("py"),
            "lng": bookmark.get("px"),
            "address": bookmark.get("address") or "",
            "roadAddress": "",
            "district": gu,
            "districtHe": AREA_HE.get(gu, gu or "אחר"),
            "city": "Seoul" if city == "서울" or "Seoul" in (bookmark.get("address") or "") else "Other",
            "score": None,
            "reviewText": "",
            "reviewCount": None,
            "category": bookmark.get("mcidName") or "카페",
            "photos": [],
            "naverUrl": f"https://map.naver.com/p/entry/place/{sid}",
            "hours": "",
        }

    city, gu = district_from_address(
        (pd.get("address") or {}).get("address"),
        (pd.get("address") or {}).get("roadAddress"),
    )
    if not city:
        city, gu = district_from_address(bookmark.get("address"))
    vr = pd.get("visitorReviews") or {}
    imgs = ((pd.get("images") or {}).get("images") or [])[:4]
    photos = [im.get("origin") for im in imgs if im.get("origin")]
    dt = vr.get("displayText") or ""
    rc = None
    m = re.search(r"(\d[\d,]*)", dt.replace(",", ""))
    if m:
        rc = int(m.group(1).replace(",", ""))
    coord = pd.get("coordinate") or {}
    is_seoul = (
        city == "서울"
        or "서울" in ((pd.get("address") or {}).get("address") or "")
        or "Seoul" in (bookmark.get("address") or "")
    )
    return {
        "id": sid,
        "name": pd.get("name") or bookmark.get("name"),
        "nameKo": pd.get("name") or bookmark.get("name"),
        "lat": coord.get("latitude") if coord.get("latitude") is not None else bookmark.get("py"),
        "lng": coord.get("longitude") if coord.get("longitude") is not None else bookmark.get("px"),
        "address": (pd.get("address") or {}).get("formattedAddress") or bookmark.get("address") or "",
        "roadAddress": (pd.get("address") or {}).get("roadAddress") or "",
        "district": gu,
        "districtHe": AREA_HE.get(gu, gu or "אחר"),
        "city": "Seoul" if is_seoul else "Other",
        "score": vr.get("score"),
        "reviewText": dt,
        "reviewCount": rc,
        "category": (pd.get("category") or {}).get("category") or bookmark.get("mcidName") or "카페",
        "photos": photos,
        "naverUrl": f"https://map.naver.com/p/entry/place/{sid}",
        "hours": ((pd.get("businessHours") or {}).get("description") or ""),
    }


def main() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    folder_url = (
        f"https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/"
        f"{SHARE_ID}/bookmarks?start=0&limit=5000&sort=lastUseTime"
    )
    print("Fetching shared folder…")
    raw = curl_json(folder_url)
    if not raw.get("bookmarkList"):
        raise SystemExit("Failed to load shared folder bookmarks")

    raw_path = CACHE / "cafes_raw.json"
    raw_path.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")

    bookmarks = [b for b in raw["bookmarkList"] if b.get("available") and b.get("sid")]
    print(f"Enriching {len(bookmarks)} places (ratings + photos)…")

    cafes: list[dict] = []
    for i, b in enumerate(bookmarks, 1):
        summary = curl_json(f"https://map.naver.com/p/api/place/summary/{b['sid']}")
        cafes.append(build_cafe(b, summary))
        if i % 20 == 0 or i == len(bookmarks):
            scored = sum(1 for c in cafes if c.get("score") is not None)
            photos = sum(1 for c in cafes if c.get("photos"))
            print(f"  {i}/{len(bookmarks)} scored={scored} photos={photos}")
        time.sleep(0.12)

    cafes.sort(
        key=lambda c: (
            0 if c["city"] == "Seoul" else 1,
            -(c["score"] or 0),
            -(c["reviewCount"] or 0),
            c["name"] or "",
        )
    )

    meta = {
        "source": SOURCE,
        "shareId": SHARE_ID,
        "folderName": (raw.get("folder") or {}).get("name") or "Cafe",
        "author": ((raw.get("folder") or {}).get("placeUserProfile") or {}).get("nick") or "oddspkce",
        "count": len(cafes),
        "fetchedAt": time.strftime("%Y-%m-%d"),
    }
    payload = {"meta": meta, "cafes": cafes}

    enriched = CACHE / "cafes_enriched.json"
    enriched.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    out = DOCS_JS / "cafes.js"
    out.write_text(
        "/* Seoul cafe recommendations from Naver Map shared folder — generated, do not hand-edit */\n"
        f"window.CAFE_LIST = {json.dumps(payload, ensure_ascii=False)};\n",
        encoding="utf-8",
    )

    print("districts", Counter(c["district"] for c in cafes).most_common(8))
    print("wrote", out.relative_to(ROOT), f"({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
