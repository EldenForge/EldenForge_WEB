#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Download Elden Ring banner images from sources.json into static/art/banners/.

STDLIB ONLY. Run with: py download_banners.py

Reads EldenForge_WEB/static/art/sources.json and downloads every entry whose
`type` is in KEEP_TYPES. Generates EldenForge_WEB/src/lib/art/banners.ts with
the list of locally-hosted banners (path + name + source URL + copyright).

Idempotent: skips files that already exist on disk.
"""

import io
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

try:
    from PIL import Image
    PIL_OK = True
except ImportError:
    PIL_OK = False

# Banniers : on les sert max 1920px wide, JPEG q85 = compromis poids/qualité raisonnable.
MAX_WIDTH = 1920
JPEG_QUALITY = 85

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "static" / "art" / "sources.json"
OUT_DIR = ROOT / "static" / "art" / "banners"
TS_OUT = ROOT / "src" / "lib" / "art" / "banners.ts"

# Types qu'on garde : screenshots de jeu + hero shots + promo art (Messmer collector).
# On retire backgrounds (Steam pages), wallpapers, key_arts (= boxart-ish) trop statiques.
KEEP_TYPES = {"screenshot", "hero", "promo_art"}

# Skip explicites par pattern d'URL.
SKIP_NAME_PATTERNS = [
    re.compile(r"hero_capsule", re.IGNORECASE),
    re.compile(r"library_hero_2x", re.IGNORECASE),
    re.compile(r"page_bg_generated", re.IGNORECASE),
    re.compile(r"apps/2778580/ss_", re.IGNORECASE),  # SOTE Steam screenshot : on garde uniquement les screenshots Bandai
]


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60]


def deduce_ext(url: str) -> str:
    m = re.search(r"\.([a-zA-Z0-9]{2,4})(?:\?|$)", url.split("/")[-1])
    if m:
        ext = m.group(1).lower()
        if ext in {"jpg", "jpeg", "png", "webp"}:
            return "." + ext
    return ".jpg"


def fetch(url: str) -> bytes | None:
    headers = {"User-Agent": "Mozilla/5.0 (EldenForge banner importer)"}
    last_err = None
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
            if not data:
                raise ValueError("empty body")
            return data
        except Exception as e:  # noqa: BLE001
            last_err = e
            if attempt == 0:
                time.sleep(1.0)
    print(f"  FAIL: {url}  ({type(last_err).__name__}: {last_err})", file=sys.stderr)
    return None


def save_compressed(data: bytes, dest_jpg: Path) -> bool:
    """Resize (max width MAX_WIDTH) and re-encode as JPEG quality JPEG_QUALITY."""
    if not PIL_OK:
        dest_jpg.write_bytes(data)
        return True
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ("RGBA", "P", "LA"):
            bg = Image.new("RGB", img.size, (0, 0, 0))
            bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        if img.width > MAX_WIDTH:
            new_h = int(img.height * (MAX_WIDTH / img.width))
            img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)
        dest_jpg.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest_jpg, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        return True
    except Exception as e:  # noqa: BLE001
        print(f"  COMPRESS FAIL: {dest_jpg.name}  ({type(e).__name__}: {e})", file=sys.stderr)
        return False


def main() -> int:
    if not SOURCES.exists():
        print(f"sources.json not found: {SOURCES}", file=sys.stderr)
        return 1

    raw = json.loads(SOURCES.read_text(encoding="utf-8"))
    legal = raw.get("legal", {})

    # Aggregate all entries with a copyright tag attached.
    entries: list[dict] = []
    er = raw.get("elden_ring", {})
    sote = raw.get("shadow_of_the_erdtree", {})

    for section in ("steam_screenshots", "steam_assets"):
        for it in er.get(section, []):
            entries.append({**it, "copyright": legal.get("notice_base_game", ""), "game": "elden_ring"})
    for section in ("bandai_screenshots", "bandai_assets", "steam_assets"):
        for it in sote.get(section, []):
            entries.append({**it, "copyright": legal.get("notice_dlc", ""), "game": "shadow_of_the_erdtree"})

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    kept: list[dict] = []
    skipped = 0

    for e in entries:
        t = e.get("type", "")
        name = e.get("name", "")
        url = e.get("url", "")
        if t not in KEEP_TYPES:
            skipped += 1
            continue
        if any(p.search(url) for p in SKIP_NAME_PATTERNS):
            skipped += 1
            continue
        slug = slugify(name)
        # On normalise tout en .jpg compressé (cf. save_compressed).
        dest = OUT_DIR / f"{slug}.jpg"
        rel = f"/art/banners/{slug}.jpg"

        if dest.exists() and dest.stat().st_size > 0:
            kept.append({"path": rel, "name": name, "source": url, "copyright": e["copyright"], "game": e["game"], "type": t})
            print(f"  SKIP (cached): {dest.name}")
            continue

        print(f"  GET: {name}  -> {dest.name}")
        data = fetch(url)
        if data is None:
            continue
        if save_compressed(data, dest):
            kept.append({"path": rel, "name": name, "source": url, "copyright": e["copyright"], "game": e["game"], "type": t})

    print(f"\nDownloaded/cached: {len(kept)}  Skipped (wrong type): {skipped}")

    # Generate banners.ts
    TS_OUT.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "// AUTO-GENERATED by scripts/download_banners.py — do not edit by hand.",
        "// Re-run the script to refresh.",
        "",
        "export interface Banner {",
        "\tpath: string;",
        "\tname: string;",
        "\tsource: string;",
        "\tcopyright: string;",
        "\tgame: 'elden_ring' | 'shadow_of_the_erdtree';",
        "\ttype: string;",
        "}",
        "",
        "export const BANNERS: Banner[] = [",
    ]
    for b in kept:
        lines.append("\t{")
        lines.append(f"\t\tpath: {json.dumps(b['path'])},")
        lines.append(f"\t\tname: {json.dumps(b['name'])},")
        lines.append(f"\t\tsource: {json.dumps(b['source'])},")
        lines.append(f"\t\tcopyright: {json.dumps(b['copyright'])},")
        lines.append(f"\t\tgame: {json.dumps(b['game'])},")
        lines.append(f"\t\ttype: {json.dumps(b['type'])}")
        lines.append("\t},")
    lines.append("];")
    lines.append("")
    lines.append("/** Stable hash → pick a banner deterministically from a string (e.g. pseudo). */")
    lines.append("export function pickBanner(key: string): Banner {")
    lines.append("\tif (BANNERS.length === 0) throw new Error('No banners available');")
    lines.append("\tlet h = 2166136261;")
    lines.append("\tfor (let i = 0; i < key.length; i++) {")
    lines.append("\t\th ^= key.charCodeAt(i);")
    lines.append("\t\th = Math.imul(h, 16777619);")
    lines.append("\t}")
    lines.append("\treturn BANNERS[Math.abs(h) % BANNERS.length];")
    lines.append("}")
    lines.append("")

    TS_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {TS_OUT.relative_to(ROOT)}  ({len(kept)} banners)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
