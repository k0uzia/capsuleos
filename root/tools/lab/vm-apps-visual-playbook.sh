#!/usr/bin/env bash
# Enquête visuelle VM — applications P0–P2 (gtk-launch + capture fenêtre active).
#
# Rocky 10 : org.gnome.Shell.Screenshot D-Bus (gnome-screenshot absent du CRB).
# Repli : gnome-screenshot -w si installé, sinon capture plein écran D-Bus.
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
if [[ -z "${XAUTHORITY:-}" ]] && compgen -G "/run/user/$(id -u)/.mutter-Xwaylandauth.*" >/dev/null; then
  export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
fi
if [[ -z "${XAUTHORITY:-}" ]] && compgen -G "/run/user/$(id -u)/xauth_*" >/dev/null; then
  export XAUTHORITY=$(ls /run/user/$(id -u)/xauth_* 2>/dev/null | head -1)
fi
export PATH="${HOME}/.local/bin:${PATH}"

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


def shell_screenshot_status(path: Path) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        res = subprocess.run(
            [
                "gdbus", "call", "--session",
                "--dest", "org.gnome.Shell.Screenshot",
                "--object-path", "/org/gnome/Shell/Screenshot",
                "--method", "org.gnome.Shell.Screenshot.Screenshot",
                "false", "false", str(path),
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )
        if res.returncode == 0 and path.is_file() and path.stat().st_size > 0:
            return "ok"
        if "AccessDenied" in (res.stderr or "") or "not allowed" in (res.stderr or "").lower():
            return "access-denied"
    except Exception:
        pass
    return "failed"


def shell_window_screenshot(path: Path) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        res = subprocess.run(
            [
                "gdbus", "call", "--session",
                "--dest", "org.gnome.Shell.Screenshot",
                "--object-path", "/org/gnome/Shell/Screenshot",
                "--method", "org.gnome.Shell.Screenshot.ScreenshotWindow",
                "true", "false", "false", str(path),
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )
        return res.returncode == 0 and path.is_file() and path.stat().st_size > 0
    except Exception:
        return False


def spectacle_capture(outfile: Path, active_window: bool = True) -> bool:
    outfile.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["spectacle", "-b", "-n", "-o", str(outfile)]
    if active_window:
        cmd = ["spectacle", "-b", "-a", "-n", "-o", str(outfile)]
    try:
        res = subprocess.run(["timeout", "20", *cmd], capture_output=True, text=True, timeout=25)
        return res.returncode == 0 and outfile.is_file() and outfile.stat().st_size > 0
    except Exception:
        return False


def probe_backend() -> str | None:
    desktop = os.environ.get("XDG_CURRENT_DESKTOP", "")
    if "KDE" in desktop.upper():
        if subprocess.call(["which", "spectacle"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
            return "spectacle"
    probe = out_dir / "_screenshot-probe.png"
    status = shell_screenshot_status(probe)
    if status == "ok":
        try:
            probe.unlink()
        except OSError:
            pass
        return "org.gnome.Shell.Screenshot"
    if subprocess.call(["which", "gnome-screenshot"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
        return "gnome-screenshot"
    return None


BACKEND = probe_backend()
if not BACKEND:
    print("○ aucun backend capture (Shell.Screenshot / gnome-screenshot)", flush=True)


def focus_window(pattern: str) -> None:
    if not pattern:
        return
    try:
        res = subprocess.run(["wmctrl", "-lx"], capture_output=True, text=True, check=False, timeout=8)
    except Exception:
        return
    pat = pattern.lower()
    for line in (res.stdout or "").splitlines():
        if pat not in line.lower():
            continue
        win_id = line.split(None, 1)[0]
        subprocess.run(["wmctrl", "-ia", win_id], check=False, timeout=5)
        time.sleep(0.7)
        return


def launch_app(desktop: str) -> None:
    resource = desktop.replace(".desktop", "")
    if BACKEND == "spectacle":
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/KWin", "org.kde.KWin.showDesktop", "true"],
            check=False,
            timeout=5,
        )
        time.sleep(0.35)
        subprocess.run(["gtk-launch", desktop], check=False, timeout=10)
        if "systemsettings" in desktop or "discover" in desktop or "dolphin" in desktop:
            time.sleep(3.5)
        elif "firefox" in desktop:
            time.sleep(5.0)
        else:
            time.sleep(2.5)
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/KWin", "org.kde.KWin.showDesktop", "false"],
            check=False,
            timeout=5,
        )
        time.sleep(0.5)
        return
    subprocess.run(["pkill", "-f", resource], check=False)
    time.sleep(0.35)
    subprocess.run(["gtk-launch", desktop], check=False, timeout=10)
    time.sleep(1.2)


def launch_app_slot(desktop: str) -> None:
    launch_app(desktop)


def capture_window(outfile: Path, desktop: str) -> bool:
    focus_window(desktop.replace(".desktop", ""))
    if BACKEND == "org.gnome.Shell.Screenshot":
        if shell_window_screenshot(outfile):
            return True
        if shell_screenshot_status(outfile) == "ok":
            return True
        return False
    if BACKEND == "gnome-screenshot":
        r = subprocess.run(["gnome-screenshot", "-w", "-f", str(outfile)], check=False, timeout=15)
        if r.returncode != 0:
            subprocess.run(["gnome-screenshot", "-f", str(outfile)], check=False, timeout=15)
        return outfile.exists() and outfile.stat().st_size > 0
    if BACKEND == "spectacle":
        return spectacle_capture(outfile, active_window=True)
    return False


def capture_app_window(outfile: Path, desktop: str) -> bool:
    if BACKEND == "spectacle":
        time.sleep(0.45)
    return capture_window(outfile, desktop)


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
    print(f"[apps-visual] {control_id} — {item.get('labelFr', '')} (backend={BACKEND})", flush=True)
    if desktop:
        launch_app_slot(desktop)
    default_out = out_dir / f"{control_id}-vm.png"
    captured = capture_app_window(default_out, desktop) if BACKEND else False
    if captured:
        print(f"  ✓ {default_out.name} (fenêtre)", flush=True)
    else:
        print(f"  ○ capture fenêtre absente {control_id}", flush=True)
    for shot in shots:
        shot_out = slot_dir / f"{shot}-vm.png"
        if shot_out.exists() and shot_out.stat().st_size > 0:
            continue
        if captured:
            shot_out.write_bytes(default_out.read_bytes())
            print(f"  ✓ {control_id}/{shot_out.name}", flush=True)
        else:
            print(f"  ○ shot absent {shot}", flush=True)
PY

echo "OK apps-visual playbook → $OUT_DIR (backend Shell.Screenshot / gnome-screenshot / spectacle)"
