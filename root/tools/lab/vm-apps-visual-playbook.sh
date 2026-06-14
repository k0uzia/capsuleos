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

KWIN_DISCOVER_JS = r"""/**
 * KWin script — fermer « Problème de mises à jour » et focaliser Discover.
 */
var ws = workspace;
var windows = ws.windowList();
var discover = null;
var discoverFallback = null;

for (var i = 0; i < windows.length; i++) {
    var w = windows[i];
    var cap = w.caption || "";
    if (cap === "Problème de mises à jour" || cap.indexOf("Update problem") === 0) {
        w.closeWindow();
        continue;
    }
    if (cap.indexOf("Discover") >= 0 && cap.indexOf("Problème") < 0) {
        discoverFallback = w;
        if (cap.indexOf("VLC") < 0) {
            discover = w;
        }
    }
}

var target = discover || discoverFallback;
if (target) {
    target.minimized = false;
    ws.activeWindow = target;
}
"""

KWIN_FIREFOX_JS = r"""/**
 * KWin script — fermer modales Discover et focaliser Firefox (Navigator).
 */
var ws = workspace;
var windows = ws.windowList();
var firefox = null;

for (var i = 0; i < windows.length; i++) {
    var w = windows[i];
    var cap = w.caption || "";
    var cls = (w.windowClass || "").toLowerCase();
    if (cap === "Problème de mises à jour" || cap.indexOf("Update problem") === 0) {
        w.closeWindow();
        continue;
    }
    if (cap.indexOf("Discover") >= 0 && cap.indexOf("Firefox") < 0) {
        w.closeWindow();
        continue;
    }
    if (cls.indexOf("firefox") >= 0 || cls.indexOf("navigator") >= 0
        || cap.indexOf("Firefox") >= 0 || cap.indexOf("Mozilla") >= 0) {
        firefox = w;
    }
}

if (firefox) {
    firefox.minimized = false;
    ws.activeWindow = firefox;
}
"""

KWIN_KONSOLE_JS = r"""/**
 * KWin script — focaliser Konsole.
 */
var ws = workspace;
var windows = ws.windowList();
var konsole = null;

for (var i = 0; i < windows.length; i++) {
    var w = windows[i];
    var cap = w.caption || "";
    var cls = (w.windowClass || "").toLowerCase();
    if (cls.indexOf("konsole") >= 0 || cap.indexOf("Konsole") >= 0) {
        konsole = w;
    }
}

if (konsole) {
    konsole.minimized = false;
    ws.activeWindow = konsole;
}
"""

KWIN_VLC_JS = r"""/**
 * KWin script — focaliser VLC (fenêtre lecteur, pas dialogue vie privée).
 */
var ws = workspace;
var windows = ws.windowList();
var vlc = null;

for (var i = 0; i < windows.length; i++) {
    var w = windows[i];
    var cap = w.caption || "";
    var cls = (w.windowClass || "").toLowerCase();
    if (cap.indexOf("Vie privée") >= 0 || cap.indexOf("Privacy") >= 0
        || cap.indexOf("Réseau") >= 0 && cap.indexOf("VLC") < 0) {
        continue;
    }
    if (cls.indexOf("vlc") >= 0 || cap.indexOf("VLC") >= 0) {
        vlc = w;
    }
}

if (vlc) {
    vlc.minimized = false;
    ws.activeWindow = vlc;
}
"""


def prepare_vlc_qt_config() -> None:
    cfg = Path.home() / ".config/vlc/vlcrc"
    cfg.parent.mkdir(parents=True, exist_ok=True)
    text = cfg.read_text(encoding="utf-8", errors="ignore") if cfg.is_file() else ""
    if "qt-privacy-ask" not in text:
        if text and not text.endswith("\n"):
            text += "\n"
        if "[qt]" not in text:
            text += "[qt]\n"
        text += "qt-privacy-ask=0\n"
    else:
        import re
        text = re.sub(r"qt-privacy-ask=\d+", "qt-privacy-ask=0", text)
    cfg.write_text(text, encoding="utf-8")


def run_kwin_discover_dismiss(script_id: str = "capsuleos-apps-visual-discover") -> None:
    script_path = Path("/tmp/capsuleos-discover-capture-kwin.js")
    try:
        script_path.write_text(KWIN_DISCOVER_JS, encoding="utf-8")
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.unloadScript", script_id],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            [
                "qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.loadScript",
                str(script_path), script_id,
            ],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.start"],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(0.4)
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.unloadScript", script_id],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass


def run_kwin_firefox_focus(script_id: str = "capsuleos-apps-visual-firefox") -> None:
    script_path = Path("/tmp/capsuleos-firefox-capture-kwin.js")
    try:
        script_path.write_text(KWIN_FIREFOX_JS, encoding="utf-8")
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.unloadScript", script_id],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            [
                "qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.loadScript",
                str(script_path), script_id,
            ],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.start"],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(0.45)
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.unloadScript", script_id],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass


def run_kwin_konsole_focus(script_id: str = "capsuleos-apps-visual-konsole") -> None:
    script_path = Path("/tmp/capsuleos-konsole-capture-kwin.js")
    try:
        script_path.write_text(KWIN_KONSOLE_JS, encoding="utf-8")
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.unloadScript", script_id],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            [
                "qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.loadScript",
                str(script_path), script_id,
            ],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.start"],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(0.45)
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.unloadScript", script_id],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass


def run_kwin_vlc_focus(script_id: str = "capsuleos-apps-visual-vlc") -> None:
    script_path = Path("/tmp/capsuleos-vlc-capture-kwin.js")
    try:
        script_path.write_text(KWIN_VLC_JS, encoding="utf-8")
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.unloadScript", script_id],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            [
                "qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.loadScript",
                str(script_path), script_id,
            ],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.start"],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(0.45)
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/Scripting", "org.kde.kwin.Scripting.unloadScript", script_id],
            check=False,
            timeout=5,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass


def focus_window(pattern: str) -> None:
    if not pattern:
        return
    if "discover" in pattern.lower() and "KDE" in os.environ.get("XDG_CURRENT_DESKTOP", "").upper():
        run_kwin_discover_dismiss()
        return
    if "firefox" in pattern.lower():
        run_kwin_firefox_focus()
        return
    if "konsole" in pattern.lower():
        run_kwin_konsole_focus()
        return
    if "vlc" in pattern.lower():
        run_kwin_vlc_focus()
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


def looks_like_discover_png(outfile: Path) -> bool:
    try:
        from PIL import Image
    except Exception:
        return False
    try:
        img = Image.open(outfile).convert("RGB")
        w, h = img.size
        y = min(140, h - 1)
        left = img.getpixel((min(90, w - 1), y))
        right = img.getpixel((min(520, w - 1), y))
        if abs(sum(left) - sum(right)) > 90:
            return True
        accent = img.getpixel((min(110, w - 1), min(130, h - 1)))
        if accent[2] > 210 and accent[0] < 80 and accent[1] > 150:
            return True
    except Exception:
        return False
    return False


def looks_like_vlc_privacy_png(outfile: Path) -> bool:
    try:
        from PIL import Image
    except Exception:
        return False
    try:
        img = Image.open(outfile).convert("RGB")
        w, h = img.size
        br = img.getpixel((max(0, w - 90), max(0, h - 55)))
        if br[2] > 170 and br[0] < 130 and br[1] > 120:
            return True
        title = img.getpixel((w // 2, min(120, h - 1)))
        body = img.getpixel((w // 2, min(int(h * 0.34), h - 1)))
        if sum(title) > 700 and sum(body) > 680:
            return True
    except Exception:
        return False
    return False


def capture_bytes_ok(outfile: Path, desktop: str) -> bool:
    if not outfile.is_file() or outfile.stat().st_size < 1:
        return False
    if desktop and "discover" in desktop:
        # Discover Kirigami : capture < 45 Ko = fenêtre vide (QML pas prêt)
        return outfile.stat().st_size >= 45000
    if desktop and "firefox" in desktop:
        try:
            res = subprocess.run(["wmctrl", "-lx"], capture_output=True, text=True, check=False, timeout=8)
            lines = (res.stdout or "").lower()
            if lines.strip() and "navigator.firefox" not in lines and " firefox." not in lines:
                return False
        except Exception:
            pass
        return outfile.stat().st_size >= 28000
    if desktop and "firefox" in desktop and looks_like_discover_png(outfile):
        return False
    if desktop and "vlc" in desktop:
        if looks_like_vlc_privacy_png(outfile):
            return False
        return outfile.stat().st_size >= 12000
    return True


def dismiss_discover_dialogs() -> None:
    """Ferme les modales Discover (PackageKit) via KWin — wmctrl/xdotool absents sur Neon Wayland."""
    for _ in range(5):
        run_kwin_discover_dismiss()
        time.sleep(0.55)


def launch_app(desktop: str) -> None:
    resource = desktop.replace(".desktop", "")
    if BACKEND == "spectacle" and "firefox" in desktop:
        subprocess.run(["killall", "plasma-discover"], check=False, timeout=5)
        subprocess.run(["killall", "firefox"], check=False, timeout=5)
        time.sleep(0.55)
        dismiss_discover_dialogs()
        subprocess.run(["gtk-launch", desktop], check=False, timeout=10)
        time.sleep(7.0)
        run_kwin_firefox_focus()
        time.sleep(1.0)
        return
    if BACKEND == "spectacle" and "konsole" in desktop:
        subprocess.run(["killall", "plasma-discover"], check=False, timeout=5)
        subprocess.run(["killall", "konsole"], check=False, timeout=5)
        time.sleep(0.55)
        dismiss_discover_dialogs()
        subprocess.run(["gtk-launch", desktop], check=False, timeout=10)
        time.sleep(4.5)
        run_kwin_konsole_focus()
        time.sleep(1.0)
        return
    if BACKEND == "spectacle" and "vlc" in desktop:
        prepare_vlc_qt_config()
        subprocess.run(["killall", "plasma-discover"], check=False, timeout=5)
        subprocess.run(["killall", "vlc"], check=False, timeout=5)
        time.sleep(0.55)
        dismiss_discover_dialogs()
        subprocess.run(["gtk-launch", desktop], check=False, timeout=10)
        time.sleep(4.5)
        run_kwin_vlc_focus()
        time.sleep(1.0)
        return
    if BACKEND == "spectacle":
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/KWin", "org.kde.KWin.showDesktop", "true"],
            check=False,
            timeout=5,
        )
        time.sleep(0.35)
        if "discover" in desktop and "KDE" in os.environ.get("XDG_CURRENT_DESKTOP", "").upper():
            subprocess.run(["killall", "plasma-discover"], check=False, timeout=5)
            time.sleep(0.35)
            subprocess.run(["kstart", "plasma-discover"], check=False, timeout=10)
        else:
            subprocess.run(["gtk-launch", desktop], check=False, timeout=10)
        if "discover" in desktop:
            time.sleep(10.0)
        elif "systemsettings" in desktop:
            time.sleep(5.0)
        elif "dolphin" in desktop:
            time.sleep(3.5)
        else:
            time.sleep(2.5)
        subprocess.run(
            ["qdbus6", "org.kde.KWin", "/KWin", "org.kde.KWin.showDesktop", "false"],
            check=False,
            timeout=5,
        )
        time.sleep(0.5)
        if "discover" in desktop:
            focus_window("discover")
            time.sleep(1.2)
            dismiss_discover_dialogs()
            time.sleep(0.6)
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
    custom_launch = item.get("launch", "")
    if custom_launch and "gtk-launch" not in custom_launch:
        if BACKEND == "spectacle":
            subprocess.run(
                ["qdbus6", "org.kde.KWin", "/KWin", "org.kde.KWin.showDesktop", "true"],
                check=False,
                timeout=5,
            )
            time.sleep(0.35)
        subprocess.run(["bash", "-lc", custom_launch], check=False, timeout=10)
        if "dolphin" in custom_launch:
            time.sleep(8.0)
            subprocess.run(
                [
                    "bash",
                    "-lc",
                    'SVC=$(qdbus6 | grep "org.kde.dolphin-" | head -1); '
                    '[ -n "$SVC" ] && qdbus6 "$SVC" /dolphin/Dolphin_1/actions/view_redisplay trigger || true',
                ],
                check=False,
                timeout=10,
            )
            time.sleep(2.0)
        elif BACKEND == "spectacle":
            time.sleep(2.5)
        if BACKEND == "spectacle":
            subprocess.run(
                ["qdbus6", "org.kde.KWin", "/KWin", "org.kde.KWin.showDesktop", "false"],
                check=False,
                timeout=5,
            )
            time.sleep(0.5)
    elif desktop:
        launch_app_slot(desktop)
    default_out = out_dir / f"{control_id}-vm.png"
    attempts = 4 if desktop and "discover" in desktop else (
        4 if desktop and "firefox" in desktop else (
            4 if desktop and "vlc" in desktop else 1
        )
    )
    captured = False
    for attempt in range(attempts):
        if attempt and desktop and "discover" in desktop:
            focus_window("discover")
            dismiss_discover_dialogs()
            time.sleep(2.0)
        if attempt and desktop and "firefox" in desktop:
            focus_window("firefox")
            time.sleep(1.2)
        if attempt and desktop and "vlc" in desktop:
            focus_window("vlc")
            time.sleep(1.2)
        captured = capture_app_window(default_out, desktop) if BACKEND else False
        if captured and capture_bytes_ok(default_out, desktop):
            break
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
