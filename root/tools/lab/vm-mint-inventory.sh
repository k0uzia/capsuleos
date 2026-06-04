#!/usr/bin/env bash
# Inventaire JSON Mint réel (VM) — assets, panel, apps, thèmes, versions.
# Usage : DISPLAY=:0 bash vm-mint-inventory.sh
# Depuis l'hôte : ssh capsule@IP 'DISPLAY=:0 bash -s' < vm-mint-inventory.sh
set -uo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import os
import subprocess
from datetime import datetime, timezone

def gget(schema, key):
    try:
        out = subprocess.check_output(
            ["gsettings", "get", schema, key],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
        return out
    except Exception:
        return ""

def mint_info():
    info = {}
    path = "/etc/linuxmint/info"
    if os.path.isfile(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line:
                    k, v = line.strip().split("=", 1)
                    info[k] = v.strip().strip('"')
    return {
        "release": info.get("RELEASE", ""),
        "codename": info.get("CODENAME", ""),
        "edition": info.get("EDITION", ""),
        "description": info.get("DESCRIPTION", ""),
    }

def ver(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL, text=True).strip().split("\n")[0]
    except Exception:
        return ""

def desktop_entry(name):
    path = f"/usr/share/applications/{name}"
    if not os.path.isfile(path):
        return None
    data = {"desktop": name}
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("Name="):
                data["name"] = line[5:].strip()
            elif line.startswith("Icon="):
                data["icon"] = line[5:].strip()
            elif line.startswith("Exec=") and "exec" not in data:
                data["exec"] = line[5:].strip().split()[0]
    return data

def tray_applets():
    raw = gget("org.cinnamon", "enabled-applets")
    out = []
    for part in raw.replace("[", "").replace("]", "").replace("'", "").split(","):
        part = part.strip()
        if "@" in part:
            out.append(part.split("@")[0].split(":")[-1])
    return [x for x in out if x and x not in ("menu", "separator", "grouped-window-list")]

panel_core = []
for desktop in ("nemo.desktop", "firefox.desktop", "org.gnome.Terminal.desktop"):
    entry = desktop_entry(desktop)
    if entry:
        panel_core.append(entry)

branding_dirs = []
if os.path.isdir("/usr/share/linuxmint"):
    branding_dirs = sorted(os.listdir("/usr/share/linuxmint"))

logo_candidates = []
for p in ("/usr/share/linuxmint/logo.png",):
    if os.path.isfile(p):
        logo_candidates.append(p)

def menu_visible_apps():
    out = []
    apps_dir = "/usr/share/applications"
    if not os.path.isdir(apps_dir):
        return out
    for fname in sorted(os.listdir(apps_dir)):
        if not fname.endswith(".desktop"):
            continue
        path = os.path.join(apps_dir, fname)
        name = None
        hidden = False
        nodisplay = False
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if line.startswith("Name["):
                        continue
                    if line.startswith("Name=") and name is None:
                        name = line[5:].strip()
                    if line.startswith("Hidden=true"):
                        hidden = True
                    if line.startswith("NoDisplay=true"):
                        nodisplay = True
        except OSError:
            continue
        if name and not hidden and not nodisplay:
            out.append({"name": name, "desktop": fname})
    out.sort(key=lambda e: e["name"].lower())
    return out

payload = {
    "toolkit": "cinnamon",
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "os": mint_info(),
    "versions": {
        "cinnamon": ver("cinnamon --version"),
        "nemo": ver("nemo --version"),
        "firefox": ver("firefox --version"),
    },
    "panel": {
        "height": gget("org.cinnamon", "panels-height"),
        "applets": gget("org.cinnamon", "enabled-applets"),
        "launchers": ["menu", "grouped-window-list"],
        "zoneIconSizes": gget("org.cinnamon", "panel-zone-icon-sizes"),
    },
    "themes": {
        "cinnamon": gget("org.cinnamon.theme", "name").strip("'"),
        "gtk": gget("org.cinnamon.desktop.interface", "gtk-theme").strip("'"),
        "icons": gget("org.cinnamon.desktop.interface", "icon-theme").strip("'"),
        "wallpaper": gget("org.cinnamon.desktop.background", "picture-uri").strip("'"),
    },
    "tray": tray_applets(),
    "apps": {
        "panelCore": panel_core,
        "favorites": gget("org.cinnamon", "favorite-apps"),
        "desktopCount": len([f for f in os.listdir("/usr/share/applications") if f.endswith(".desktop")]),
        "menuVisible": menu_visible_apps(),
    },
    "branding": {
        "linuxmintDirs": branding_dirs,
        "logoCandidates": logo_candidates,
    },
}

print(json.dumps(payload, ensure_ascii=False))
PY
