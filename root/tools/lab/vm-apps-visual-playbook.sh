#!/usr/bin/env bash
# Enquête visuelle VM — applications P0 (captures ground truth par slot).
#
# Usage VM :
#   CAPSULE_APPS_VISUAL_OUT=/tmp/capsule-apps-visual bash root/tools/lab/vm-apps-visual-playbook.sh
#
# Depuis l'hôte :
#   node usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs --id linux-rocky --filter P0
set -uo pipefail

export DISPLAY="${DISPLAY:-:0}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export XDG_CURRENT_DESKTOP="${XDG_CURRENT_DESKTOP:-GNOME}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MATRIX_PATH="${CAPSULE_APPS_VISUAL_MATRIX:-$SCRIPT_DIR/apps-visual-investigation-matrix.json}"
OUT_DIR="${CAPSULE_APPS_VISUAL_OUT:-/tmp/capsuleos-apps-visual}"
FILTER="${CAPSULE_APPS_VISUAL_FILTER:-P0}"

mkdir -p "$OUT_DIR"

launch_app_slot() {
  local desktop="$1"
  pkill -f "$desktop" 2>/dev/null || true
  sleep 0.3
  gtk-launch "$desktop" 2>/dev/null || "$desktop" &
  sleep 1.2
}

capture_app_window() {
  local control_id="$1"
  local outfile="$OUT_DIR/${control_id}-vm.png"
  if command -v gnome-screenshot >/dev/null 2>&1; then
    gnome-screenshot -w -f "$outfile" 2>/dev/null || gnome-screenshot -f "$outfile"
  elif command -v import >/dev/null 2>&1; then
    import -window root "$outfile"
  else
    echo "Aucun outil capture (gnome-screenshot/import)" >&2
    return 1
  fi
  echo "$outfile"
}

python3 <<'PY'
import json
import os
import subprocess
from pathlib import Path

MATRIX_PATH = os.environ["CAPSULE_APPS_VISUAL_MATRIX"]
OUT_DIR = Path(os.environ["CAPSULE_APPS_VISUAL_OUT"])
FILTER = os.environ.get("CAPSULE_APPS_VISUAL_FILTER", "P0")

with open(MATRIX_PATH, encoding="utf-8") as f:
    matrix = json.load(f)

for item in matrix.get("investigations", []):
    if item.get("parityPriority") != FILTER:
        continue
    control_id = item["controlId"]
    desktop = item.get("vmDesktop", "")
    print(f"[apps-visual] {control_id} — {item.get('labelFr', '')}")
    if desktop:
        subprocess.run(["bash", "-c", f'source "{os.environ.get("BASH_SOURCE", "/dev/null")}" 2>/dev/null; launch_app_slot "{desktop}"'], check=False)
    out = OUT_DIR / f"{control_id}-vm.png"
    subprocess.run(
        ["bash", "-c", f'capture_app_window "{control_id}"'],
        env={**os.environ, "OUT_DIR": str(OUT_DIR)},
        check=False,
    )
    if not out.exists():
        print(f"  ○ capture VM absente pour {control_id} (à compléter sur VM)")
PY

echo "OK apps-visual playbook → $OUT_DIR"
