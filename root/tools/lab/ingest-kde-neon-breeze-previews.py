#!/usr/bin/env python3
"""Ingère previews Breeze clair/sombre pour cartes thème KDE Neon System Settings."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
THEME_DIR = ROOT / 'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/theme-previews'
ARCHIVE_DIR = ROOT / 'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/source-previews'

DERIVED = {
    'hub-breeze-vm.png': ('light', (600, 337)),
    'hub-dark-vm.png': ('dark', (600, 337)),
    'appearance-breeze-vm.png': ('light', (200, 130)),
    'appearance-dark-vm.png': ('dark', (200, 130)),
    'plasma-breeze-vm.png': ('light', (600, 337)),
    'plasma-light-vm.png': ('light', (600, 337)),
    'plasma-dark-vm.png': ('dark', (600, 337)),
    'colors-breeze-dark-vm.png': ('dark', (600, 337)),
}


def cover_resize(src: Path, size: tuple[int, int]) -> Image.Image:
    w, h = size
    im = Image.open(src).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(bg, im).convert('RGB')
    src_ratio = im.width / im.height
    dst_ratio = w / h
    if src_ratio > dst_ratio:
        new_h = h
        new_w = round(h * src_ratio)
    else:
        new_w = w
        new_h = round(w / src_ratio)
    im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - w) // 2
    top = (new_h - h) // 2
    return im.crop((left, top, left + w, top + h))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--light', type=Path, required=True, help='Capture desktop Breeze clair')
    parser.add_argument('--dark', type=Path, required=True, help='Capture desktop Breeze sombre')
    args = parser.parse_args()

    for label, src in (('light', args.light), ('dark', args.dark)):
        if not src.is_file():
            raise SystemExit(f'Fichier introuvable : {src}')

    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    THEME_DIR.mkdir(parents=True, exist_ok=True)
    archive = {
        'light': ARCHIVE_DIR / 'breeze-light-capsule-desktop.png',
        'dark': ARCHIVE_DIR / 'breeze-dark-capsule-desktop.png',
    }
    if args.light.resolve() != archive['light'].resolve():
        shutil.copy2(args.light, archive['light'])
    if args.dark.resolve() != archive['dark'].resolve():
        shutil.copy2(args.dark, archive['dark'])

    sources = {'light': archive['light'], 'dark': archive['dark']}
    for out_name, (kind, size) in DERIVED.items():
        img = cover_resize(sources[kind], size)
        out_path = THEME_DIR / out_name
        img.save(out_path, format='PNG', optimize=True)
        print(f'✓ {out_name} {size} ({out_path.stat().st_size} o)')


if __name__ == '__main__':
    main()
