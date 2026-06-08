#!/usr/bin/env bash
# Inventaire Firefox — VM KDE Neon (ground truth toolbar + packaging).
# Usage VM : bash vm-kde-neon-firefox-inventory.sh
# Depuis l'hôte : ssh -i ~/.ssh/capsuleos-lab goupil@IP 'bash -s' < vm-kde-neon-firefox-inventory.sh
set -uo pipefail
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR}/bus}"
export DISPLAY="${DISPLAY:-:1}"

python3 <<'PY'
import glob
import json
import os
import subprocess
from datetime import datetime, timezone


def run(cmd, timeout=20):
    try:
        return subprocess.check_output(
            cmd, shell=True, stderr=subprocess.DEVNULL, text=True, timeout=timeout
        ).strip()
    except Exception:
        return ""


def kread(file, group, key):
    try:
        return subprocess.check_output(
            ["kreadconfig6", "--file", file, "--group", group, "--key", key],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip().strip("'")
    except Exception:
        return ""


def read_distribution_ini():
    path = "/usr/lib/firefox/distribution/distribution.ini"
    prefs = {}
    if not os.path.isfile(path):
        return prefs
    section = ""
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("[") and line.endswith("]"):
                section = line[1:-1]
            elif "=" in line and section == "Preferences":
                k, v = line.split("=", 1)
                prefs[k.strip()] = v.strip().strip('"')
    return prefs


def firefox_windows():
    out = []
    for line in run("wmctrl -lx").splitlines():
        if "navigator.firefox" not in line.lower():
            continue
        parts = line.split(None, 4)
        if len(parts) >= 5:
            out.append({
                "id": parts[0],
                "wm_class": parts[2],
                "title": parts[4],
            })
    return out


def window_geometry(wid):
    geom = {}
    for line in run(f"xdotool getwindowgeometry --shell {wid}").splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            geom[k.lower()] = v
    return geom


wins = firefox_windows()
if not wins:
    subprocess.Popen(
        ["kstart", "firefox"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    import time
    time.sleep(5)
    wins = firefox_windows()

sample_geom = window_geometry(wins[0]["id"]) if wins else {}

payload = {
    "registryId": "linux-kde-neon",
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "firefoxVersion": run("firefox --version"),
    "package": run("rpm -q firefox 2>/dev/null || dpkg-query -W -f='${Package} ${Version}\\n' firefox 2>/dev/null"),
    "distribution": {
        "iniPath": "/usr/lib/firefox/distribution/distribution.ini",
        "preferences": read_distribution_ini(),
        "langpacks": [
            os.path.basename(p)
            for p in glob.glob("/usr/lib/firefox/distribution/extensions/langpack-*.xpi")
        ],
    },
    "desktopEntry": {
        "path": "/usr/share/applications/firefox.desktop",
        "nameFr": run("grep -m1 '^Name\\[fr\\]=' /usr/share/applications/firefox.desktop | cut -d= -f2-"),
        "name": run("grep -m1 '^Name=' /usr/share/applications/firefox.desktop | cut -d= -f2-"),
        "exec": run("grep -m1 '^Exec=' /usr/share/applications/firefox.desktop | cut -d= -f2-"),
        "icon": run("grep -m1 '^Icon=' /usr/share/applications/firefox.desktop | cut -d= -f2-"),
    },
    "themes": {
        "icons": kread("kdeglobals", "Icons", "Theme"),
        "widgetStyle": kread("kdeglobals", "KDE", "widgetStyle"),
        "colorScheme": kread("kdeglobals", "General", "ColorScheme"),
    },
    "windowManager": {
        "windows": wins[:5],
        "sampleGeometry": sample_geom,
        "wmClass": "Navigator.firefox",
    },
    "iconPaths": run(
        "find /usr/share/icons -name firefox.png 2>/dev/null | head -8"
    ).splitlines(),
    "notes": [
        "KDE Neon — barre titre Muffin/KWin séparée du chrome Proton (browser.tabs.inTitlebar=0 typique).",
        "Compare Capsule : baseline 04-firefox + smoke-kde-neon-firefox.mjs.",
    ],
}

print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
