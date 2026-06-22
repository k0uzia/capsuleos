#!/usr/bin/env python3
"""Ingère previews Breeze clair/sombre pour cartes thème KDE Neon System Settings."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image, ImageDraw

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

HUB_AUTO_SIZE = (600, 337)
APPEARANCE_SIZE = (200, 130)
OXYGEN_ARCHIVE = ARCHIVE_DIR / 'oxygen-lnf-vm-preview.png'
TWILIGHT_ARCHIVE = ARCHIVE_DIR / 'twilight-lnf-vm-preview.png'


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


def diagonal_auto_composite(light: Image.Image, dark: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Carte Automatique : clair haut-gauche / sombre bas-droite (diagonale TR→BL, comme LnF twilight KDE)."""
    w, h = size
    light_rgb = light.convert('RGB')
    dark_rgb = dark.convert('RGB')
    mask = Image.new('L', size, 0)
    # Triangle clair : (0,0) — (w,0) — (0,h) ; hypotenuse (w,0)→(0,h)
    ImageDraw.Draw(mask).polygon([(0, 0), (w, 0), (0, h)], fill=255)
    return Image.composite(light_rgb, dark_rgb, mask)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--light', type=Path, required=True, help='Capture desktop Breeze clair')
    parser.add_argument('--dark', type=Path, required=True, help='Capture desktop Breeze sombre')
    parser.add_argument(
        '--twilight-preview',
        type=Path,
        default=TWILIGHT_ARCHIVE,
        help='Preview LnF org.kde.breezetwilight (clair-obscur violet, défaut : archive source-previews/)',
    )
    parser.add_argument(
        '--oxygen-preview',
        type=Path,
        default=OXYGEN_ARCHIVE,
        help='Preview LnF org.kde.oxygen (défaut : archive source-previews/)',
    )
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
    resized = {}
    for kind in ('light', 'dark'):
        resized[kind] = cover_resize(sources[kind], HUB_AUTO_SIZE)

    for out_name, (kind, size) in DERIVED.items():
        img = cover_resize(sources[kind], size)
        out_path = THEME_DIR / out_name
        img.save(out_path, format='PNG', optimize=True)
        print(f'✓ {out_name} {size} ({out_path.stat().st_size} o)')

    auto_path = THEME_DIR / 'hub-auto-vm.png'
    auto_img = diagonal_auto_composite(resized['light'], resized['dark'], HUB_AUTO_SIZE)
    auto_img.save(auto_path, format='PNG', optimize=True)
    print(f'✓ hub-auto-vm.png {HUB_AUTO_SIZE} ({auto_path.stat().st_size} o) [diagonal light/dark]')

    if args.twilight_preview.is_file():
        twilight_path = THEME_DIR / 'appearance-twilight-vm.png'
        twilight_img = cover_resize(args.twilight_preview, APPEARANCE_SIZE)
        twilight_img.save(twilight_path, format='PNG', optimize=True)
        print(f'✓ appearance-twilight-vm.png {APPEARANCE_SIZE} ({twilight_path.stat().st_size} o) [LnF breezetwilight]')
    else:
        print(f'→ appearance-twilight-vm.png omis (¬{args.twilight_preview})')

    if args.oxygen_preview.is_file():
        oxygen_path = THEME_DIR / 'appearance-oxygen-vm.png'
        oxygen_img = cover_resize(args.oxygen_preview, APPEARANCE_SIZE)
        oxygen_img.save(oxygen_path, format='PNG', optimize=True)
        print(f'✓ appearance-oxygen-vm.png {APPEARANCE_SIZE} ({oxygen_path.stat().st_size} o) [LnF oxygen]')
    else:
        print(f'→ appearance-oxygen-vm.png omis (¬{args.oxygen_preview})')


if __name__ == '__main__':
    main()
