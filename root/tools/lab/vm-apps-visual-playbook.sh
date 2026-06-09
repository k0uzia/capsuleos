#!/usr/bin/env bash
# Enquête visuelle VM — applications P0 (captures par slot + componentShots).
#
# Usage VM :
#   CAPSULE_APPS_VISUAL_OUT=/tmp/capsuleos-apps-visual bash root/tools/lab/vm-apps-visual-playbook.sh
#
# Depuis l'hôte :
#   node usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs --id linux-rocky --filter P0 --ssh
set -uo pipefail

export DISPLAY="${DISPLAY:-:0}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export XDG_CURRENT_DESKTOP="${XDG_CURRENT_DESKTOP:-GNOME}"

MATRIX_PATH="${CAPSULE_APPS_VISUAL_MATRIX:-}"
OUT_DIR="${CAPSULE_APPS_VISUAL_OUT:-/tmp/capsuleos-apps-visual}"
FILTER="${CAPSULE_APPS_VISUAL_FILTER:-P0}"

if [[ -z "$MATRIX_PATH" || ! -f "$MATRIX_PATH" ]]; then
  echo "CAPSULE_APPS_VISUAL_MATRIX manquant" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

python3 <<'PY'
import json
import os
import subprocess
import time
from pathlib import Path

matrix_path = os.environ["CAPSULE_APPS_VISUAL_MATRIX"]
out_dir = Path(os.environ["CAPSULE_APPS_VISUAL_OUT"])
filt = os.environ.get("CAPSULE_APPS_VISUAL_FILTER", "P0")


def launch_app(desktop: str) -> None:
    subprocess.run(["pkill", "-f", desktop], check=False)
    time.sleep(0.3)
    subprocess.run(["gtk-launch", desktop], check=False, timeout=8)
    time.sleep(0.9)


def capture_window(outfile: Path) -> bool:
    if subprocess.run(["which", "gnome-screenshot"], capture_output=True).returncode == 0:
        r = subprocess.run(["gnome-screenshot", "-w", "-f", str(outfile)], check=False)
        if r.returncode != 0:
            subprocess.run(["gnome-screenshot", "-f", str(outfile)], check=False)
    elif subprocess.run(["which", "import"], capture_output=True).returncode == 0:
        subprocess.run(["import", "-window", "root", str(outfile)], check=False)
    else:
        return False
    return outfile.exists() and outfile.stat().st_size > 0


with open(matrix_path, encoding="utf-8") as f:
    matrix = json.load(f)

for item in matrix.get("investigations", []):
    if item.get("parityPriority") != filt:
        continue
    control_id = item["controlId"]
    desktop = item.get("vmDesktop", "")
    shots = item.get("componentShots") or ["default"]
    slot_dir = out_dir / control_id
    slot_dir.mkdir(parents=True, exist_ok=True)
    print(f"[apps-visual] {control_id} — {item.get('labelFr', '')}")
    if desktop:
        launch_app(desktop)
    default_out = out_dir / f"{control_id}-vm.png"
    captured = capture_window(default_out)
    if captured:
        print(f"  ✓ {default_out.name}")
    for shot in shots:
        shot_out = slot_dir / f"{shot}-vm.png"
        if shot_out.exists() and shot_out.stat().st_size > 0:
            continue
        if captured:
            shot_out.write_bytes(default_out.read_bytes())
            print(f"  ✓ {control_id}/{shot_out.name}")
        else:
            print(f"  ○ capture absente {shot}")
PY

echo "OK apps-visual playbook → $OUT_DIR"
