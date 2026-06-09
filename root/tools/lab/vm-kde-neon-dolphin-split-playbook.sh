#!/usr/bin/env bash
# Playbook point 6 — capture VM Dolphin vue scindée.
# Sortie : vm-dolphin-split-only.png (paire capsule-dolphin-split.png)
# Menu hamburger VM : vm-dolphin-split-hamburger.png (capture manuelle ou session live existante).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="${1:-$ROOT/home/public/Images/screen_KDE-Neon}"
exec bash "$ROOT/root/tools/lab/vm-kde-neon-capture-host.sh" --dolphin-split "$DEST"
