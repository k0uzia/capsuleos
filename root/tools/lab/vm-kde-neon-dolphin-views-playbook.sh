#!/usr/bin/env bash
# Playbook point 5 — captures VM Dolphin (icônes + synthétique + détails).
# Délègue à vm-kde-neon-capture-host.sh (--dolphin-views).
#
# Usage :
#   bash root/tools/lab/vm-kde-neon-dolphin-views-playbook.sh [dest-dir]
#
# Prérequis : VM KDE-Neon démarrée, SSH capsuleos-lab, virsh screenshot.
# Sorties (paires Capsule ↔ VM) :
#   vm-dolphin.png            ↔ capsule-dolphin.png
#   vm-dolphin-compact.png    ↔ capsule-dolphin-compact.png
#   vm-dolphin-list.png       ↔ capsule-dolphin-list.png
#
# Mécanisme : qdbus6 org.kde.dolphin-* /dolphin/Dolphin_1/actions/{icons|compact|details}
#             org.qtproject.Qt.QAction.trigger — repli Ctrl+1/2/3 (wtype / ydotool).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="${1:-$ROOT/home/public/Images/screen_KDE-Neon}"

exec bash "$ROOT/root/tools/lab/vm-kde-neon-capture-host.sh" --dolphin-views "$DEST"