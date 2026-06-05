#!/usr/bin/env bash
# Inventaire File Roller — VM Linux Mint (ground truth UI + packaging).
# Usage : DISPLAY=:0 bash vm-mint-file-roller-inventory.sh
# Depuis l'hôte : ssh capsule@IP 'DISPLAY=:0 bash -s' < vm-mint-file-roller-inventory.sh
set -uo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import os
import subprocess
import glob
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

def fr_windows():
    out = []
    for line in run("wmctrl -lx").splitlines():
        if "file-roller" not in line.lower():
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

wins = fr_windows()
if not wins:
    subprocess.Popen(["file-roller"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)
    wins = fr_windows()

sample_geom = window_geometry(wins[0]["id"]) if wins else {}

gschema_path = "/usr/share/glib-2.0/schemas/org.gnome.FileRoller.gschema.xml"
gschema_keys = []
if os.path.isfile(gschema_path):
    with open(gschema_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if 'key name="' in line or "<default>" in line:
                gschema_keys.append(line[:120])

payload = {
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "fileRollerVersion": run("file-roller --version"),
    "package": run("dpkg-query -W -f='${Package} ${Version}\\n' file-roller 2>/dev/null"),
    "desktopEntry": {
        "path": "/usr/share/applications/org.gnome.FileRoller.desktop",
        "nameFr": run("grep -m1 '^Name\\[fr\\]=' /usr/share/applications/org.gnome.FileRoller.desktop | cut -d= -f2-"),
        "name": run("grep -m1 '^Name=' /usr/share/applications/org.gnome.FileRoller.desktop | cut -d= -f2-"),
        "exec": run("grep -m1 '^Exec=' /usr/share/applications/org.gnome.FileRoller.desktop | cut -d= -f2-"),
        "icon": run("grep -m1 '^Icon=' /usr/share/applications/org.gnome.FileRoller.desktop | cut -d= -f2-"),
    },
    "themes": {
        "cinnamon": gget("org.cinnamon.theme", "name"),
        "gtk": gget("org.cinnamon.desktop.interface", "gtk-theme"),
        "icons": gget("org.cinnamon.desktop.interface", "icon-theme"),
    },
    "windowManager": {
        "windows": wins[:5],
        "sampleGeometry": sample_geom,
        "wmClass": "file-roller.File-roller",
    },
    "gschemaDefaults": {
        "windowWidth": gget("org.gnome.FileRoller", "window-width"),
        "windowHeight": gget("org.gnome.FileRoller", "window-height"),
        "listingMode": gget("org.gnome.FileRoller", "listing-mode"),
        "sortMethod": gget("org.gnome.FileRoller", "sort-method"),
        "sortType": gget("org.gnome.FileRoller", "sort-type"),
        "showPath": gget("org.gnome.FileRoller", "show-path"),
        "sidebarWidth": gget("org.gnome.FileRoller", "sidebar-width"),
    },
    "iconPaths": run("find /usr/share/icons/Mint-Y -name 'org.gnome.FileRoller.png' 2>/dev/null | head -8").splitlines(),
    "uiFiles": run("find /usr/share/file-roller -type f 2>/dev/null | head -30").splitlines(),
    "gschemaSnippet": gschema_keys[:40],
    "notes": [
        "File Roller 43 = GTK4/libadwaita, headerbar (Extraire, +, titre, recherche, menu).",
        "Archive ouverte : barre navigation (retour, avant, accueil, Emplacement: /).",
        "Colonnes liste : Nom, Taille, Type, Modifié (gschema listing-mode as-list).",
    ],
}

print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
