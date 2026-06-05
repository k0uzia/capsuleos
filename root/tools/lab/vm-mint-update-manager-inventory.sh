#!/usr/bin/env bash
# Inventaire Update Manager (mintupdate) — VM Linux Mint.
# Usage : DISPLAY=:0 bash vm-mint-update-manager-inventory.sh
# Depuis l'hôte : ssh capsule@IP 'DISPLAY=:0 bash -s' < vm-mint-update-manager-inventory.sh
set -uo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import subprocess
import time
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

def um_windows():
    out = []
    for line in run("wmctrl -lx").splitlines():
        if "mintupdate" not in line.lower():
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
    for line in run("xdotool getwindowgeometry --shell " + wid).splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            geom[k.lower()] = v
    return geom

wins = um_windows()
if not wins:
    subprocess.Popen(["mintupdate"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2.5)
    wins = um_windows()

sample_geom = window_geometry(wins[0]["id"]) if wins else {}

payload = {
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "mintupdateVersion": run("mintupdate --version"),
    "package": run("dpkg-query -W -f='${Package} ${Version}\\n' mintupdate 2>/dev/null"),
    "desktopEntry": {
        "path": "/usr/share/applications/mintupdate.desktop",
        "nameFr": run("grep -m1 '^Name\\[fr\\]=' /usr/share/applications/mintupdate.desktop | cut -d= -f2-"),
        "name": run("grep -m1 '^Name=' /usr/share/applications/mintupdate.desktop | cut -d= -f2-"),
        "exec": run("grep -m1 '^Exec=' /usr/share/applications/mintupdate.desktop | cut -d= -f2-"),
        "icon": run("grep -m1 '^Icon=' /usr/share/applications/mintupdate.desktop | cut -d= -f2-"),
    },
    "themes": {
        "cinnamon": gget("org.cinnamon.theme", "name"),
        "gtk": gget("org.cinnamon.desktop.interface", "gtk-theme"),
        "icons": gget("org.cinnamon.desktop.interface", "icon-theme"),
    },
    "windowManager": {
        "windows": wins[:5],
        "sampleGeometry": sample_geom,
        "wmClass": "mintUpdate.py.MintUpdate.py",
    },
    "sourcePaths": run("find /usr/lib/linuxmint/mintUpdate /usr/share/linuxmint/mintupdate -type f 2>/dev/null | head -25").splitlines(),
    "iconPaths": run("find /usr/share/icons/Mint-Y/apps -name 'mintupdate*.png' 2>/dev/null | head -10").splitlines(),
    "notes": [
        "mintupdate 7.x — interface GTK/Python (mintUpdate.py), pas libadwaita headerbar.",
        "Titre fenêtre FR : Gestionnaire de mise à jour.",
        "Barre menu Fichier/Édition/Affichage/Aide + toolbar Effacer/Tout sélectionner/Actualiser/Installer.",
    ],
}

print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
