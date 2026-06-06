#!/usr/bin/env bash
# Inventaire Nemo — VM Linux Mint (ground truth UI sombre Mint-Y-Dark-Aqua).
# Usage : DISPLAY=:0 bash vm-mint-nemo-inventory.sh
# Depuis l'hôte : ssh capsule@IP 'DISPLAY=:0 bash -s' < vm-mint-nemo-inventory.sh
set -uo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import re
import subprocess
from datetime import datetime, timezone

def run(cmd, timeout=25):
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

def gtk_nemo_colors():
    path = "/usr/share/themes/Mint-Y-Dark-Aqua/gtk-3.0/gtk-dark.css"
    try:
        text = open(path, encoding="utf-8").read()
    except OSError:
        return {}
    colors = {}
    patterns = {
        "sidebarBg": r"\.nemo-window \.sidebar \{\s*color:[^;]+;\s*background-color:\s*(#[0-9a-fA-F]+)",
        "contentBg": r"\.nemo-window \.nemo-inactive-pane \.view[^}]*background-color:\s*(#[0-9a-fA-F]+)",
        "pathbarBg": r"\.nemo-window \.nemo-window-pane widget\.entry[^}]*background-color:\s*(#[0-9a-fA-F]+)",
        "pathbarBorder": r"\.nemo-window \.nemo-window-pane widget\.entry[^}]*border-color:\s*(#[0-9a-fA-F]+)",
        "pathbarText": r"\.nemo-window \.nemo-window-pane widget\.entry[^}]*color:\s*(#[0-9a-fA-F]+)",
        "sidebarSelected": r"\.nemo-window \.sidebar \.view\.cell:selected[^}]*background-color:\s*(#[0-9a-fA-F]+)",
        "separator": r"\.nemo-window grid > paned > separator[^}]*#([0-9a-fA-F]{6})",
    }
    for key, pat in patterns.items():
        m = re.search(pat, text, re.S)
        if m:
            val = m.group(1)
            colors[key] = val if val.startswith("#") else "#" + val
    return colors

prefs = {}
for schema, keys in [
    ("org.nemo.preferences", [
        "default-folder-viewer", "default-sort-order", "show-hidden-files", "click-policy",
    ]),
    ("org.nemo.window-state", [
        "side-pane-view", "start-with-sidebar", "sidebar-width",
    ]),
]:
    for k in keys:
        prefs[f"{schema}/{k}"] = gget(schema, k)

wid = ""
for line in run("wmctrl -lx").splitlines():
    if "nemo.Nemo" in line and "Nemo-desktop" not in line:
        wid = line.split()[0]
        break

geom = {}
if wid:
    xw = run(f"xwininfo -id {wid}")
    for label, pat in [("width", r"Width:\s*(\d+)"), ("height", r"Height:\s*(\d+)")]:
        m = re.search(pat, xw)
        if m:
            geom[label] = int(m.group(1))

payload = {
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "source": "vm-mint-nemo-inventory.sh",
    "nemoVersion": run("dpkg-query -W -f='${Version}' nemo 2>/dev/null"),
    "themes": {
        "cinnamon": gget("org.cinnamon.theme", "name"),
        "gtk": gget("org.cinnamon.desktop.interface", "gtk-theme"),
    },
    "preferences": prefs,
    "geometry": geom,
    "gtkDarkNemo": gtk_nemo_colors(),
    "capsuleMapping": {
        "sidebarBg": "--nemo-sidebar-bg: #2c2c31",
        "contentBg": "--nemo-bg-primary: #222226",
        "toolbarBg": "--nemo-toolbar-bg: #222226",
        "pathbarBg": "--nemo-pathbar-bg: #2e2e33",
        "sidebarWidthPx": 170,
        "sidebarSelection": "solid #1f9ede + text #fff",
        "sidebarHover": "rgba(255,255,255,0.12)",
    },
    "notes": [
        "VM campagne thème sombre Mint-Y-Dark-Aqua (gtk + cinnamon).",
        "Sidebar places : sélection pleine aqua, pas surlignage semi-transparent.",
        "Zone fichiers (inactive pane) plus sombre (#222226) que sidebar (#2c2c31).",
    ],
}

print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
