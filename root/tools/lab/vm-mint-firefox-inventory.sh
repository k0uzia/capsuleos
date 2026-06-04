#!/usr/bin/env bash
# Inventaire Firefox — VM Linux Mint (ground truth UI + packaging).
# Usage : DISPLAY=:0 bash vm-mint-firefox-inventory.sh
# Depuis l'hôte : ssh capsule@IP 'DISPLAY=:0 bash -s' < vm-mint-firefox-inventory.sh
set -uo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import os
import subprocess
import glob
from datetime import datetime, timezone

def run(cmd, timeout=20):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL, text=True, timeout=timeout).strip()
    except Exception:
        return ""

def gget(schema, key):
    try:
        return subprocess.check_output(
            ["gsettings", "get", schema, key],
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

# Ensure one Firefox window for geometry sample
wins = firefox_windows()
if not wins:
    subprocess.Popen(["firefox"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    import time
    time.sleep(3)
    wins = firefox_windows()

sample_geom = window_geometry(wins[0]["id"]) if wins else {}

payload = {
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "firefoxVersion": run("firefox --version"),
    "package": run("dpkg-query -W -f='${Package} ${Version}\\n' firefox 2>/dev/null"),
    "distribution": {
        "iniPath": "/usr/lib/firefox/distribution/distribution.ini",
        "preferences": read_distribution_ini(),
        "langpacks": [os.path.basename(p) for p in glob.glob("/usr/lib/firefox/distribution/extensions/langpack-*.xpi")],
    },
    "desktopEntry": {
        "path": "/usr/share/applications/firefox.desktop",
        "nameFr": run("grep -m1 '^Name\\[fr\\]=' /usr/share/applications/firefox.desktop | cut -d= -f2-"),
        "name": run("grep -m1 '^Name=' /usr/share/applications/firefox.desktop | cut -d= -f2-"),
        "exec": run("grep -m1 '^Exec=' /usr/share/applications/firefox.desktop | cut -d= -f2-"),
        "icon": run("grep -m1 '^Icon=' /usr/share/applications/firefox.desktop | cut -d= -f2-"),
    },
    "themes": {
        "cinnamon": gget("org.cinnamon.theme", "name"),
        "gtk": gget("org.cinnamon.desktop.interface", "gtk-theme"),
        "icons": gget("org.cinnamon.desktop.interface", "icon-theme"),
    },
    "windowManager": {
        "windows": wins[:5],
        "sampleGeometry": sample_geom,
        "wmClass": "Navigator.firefox",
    },
    "iconPaths": run("find /usr/share/icons/Mint-Y -name firefox.png 2>/dev/null | head -5").splitlines(),
    "notes": [
        "browser.tabs.inTitlebar=0 → barre de titre Muffin séparée (pas d’onglets dans le chrome WM).",
        "Profil utilisateur lab souvent absent sur live ISO → prefs utilisateur non collectées ici.",
    ],
}

print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
