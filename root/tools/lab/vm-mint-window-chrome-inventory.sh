#!/usr/bin/env bash
# Inventaire chrome fenêtre Muffin (Cinnamon SSD) — VM Linux Mint.
# Usage : DISPLAY=:0 bash vm-mint-window-chrome-inventory.sh
# Depuis l'hôte : ssh capsule@IP 'DISPLAY=:0 bash -s' < vm-mint-window-chrome-inventory.sh
set -uo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import re
import subprocess
import time
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

def frame_extents(wid):
    for prop in ("_NET_FRAME_EXTENTS", "_GTK_FRAME_EXTENTS"):
        out = run("xprop -id %s %s" % (wid, prop))
        m = re.search(r"=\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)", out)
        if m:
            left, right, top, bottom = map(int, m.groups())
            return {
                "property": prop,
                "left": left,
                "right": right,
                "top": top,
                "bottom": bottom,
            }
    return None

def xwininfo_metrics(wid):
    out = run("xwininfo -id %s" % wid)
    data = {}
    for line in out.splitlines():
        line = line.strip()
        if "Absolute upper-left X:" in line:
            data["absoluteX"] = int(line.split(":")[1].strip())
        elif "Absolute upper-left Y:" in line:
            data["absoluteY"] = int(line.split(":")[1].strip())
        elif "Relative upper-left X:" in line:
            data["relativeX"] = int(line.split(":")[1].strip())
        elif "Relative upper-left Y:" in line:
            data["relativeY"] = int(line.split(":")[1].strip())
        elif "Width:" in line and "Border" not in line:
            data["width"] = int(line.split(":")[1].strip())
        elif "Height:" in line and "Border" not in line:
            data["height"] = int(line.split(":")[1].strip())
        elif "Border width:" in line:
            data["borderWidth"] = int(line.split(":")[1].strip())
    return data

def classify(wm_class, title):
    c = wm_class.lower()
    t = title.lower()
    if "nemo-desktop" in c:
        return None
    if "nemo" in c or "fichiers" in t or "dossier" in t:
        return "nemo"
    if "firefox" in c or "navigator" in c:
        return "firefox"
    if "mintupdate" in c or "mise à jour" in t or "mise a jour" in t:
        return "update_manager"
    if "terminal" in c or "terminal" in t:
        return "terminal"
    if "file-roller" in c or "archives" in t:
        return "file_roller"
    if "calculator" in c or "calculatrice" in t:
        return "calculator"
    return None

def ensure_windows():
    """Ouvre des fenêtres SSD si absentes (best effort)."""
    slots = {
        "nemo": "nemo /home/capsule",
        "firefox": None,
        "update_manager": "mintupdate",
    }
    present = set()
    for line in run("wmctrl -lx").splitlines():
        parts = line.split(None, 4)
        if len(parts) < 5:
            continue
        slot = classify(parts[2], parts[4])
        if slot:
            present.add(slot)
    if "nemo" not in present:
        subprocess.Popen(["nemo", "/home/capsule"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1.8)
    if "update_manager" not in present:
        subprocess.Popen(["mintupdate"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(2.0)

ensure_windows()

windows = []
seen = set()
for line in run("wmctrl -lx").splitlines():
    parts = line.split(None, 4)
    if len(parts) < 5:
        continue
    wid, desk, wm_class, host, title = parts[0], parts[1], parts[2], parts[3], parts[4]
    slot = classify(wm_class, title)
    if not slot or slot in seen:
        continue
    seen.add(slot)
    fe = frame_extents(wid)
    xwi = xwininfo_metrics(wid)
    windows.append({
        "slot": slot,
        "wid": wid,
        "wmClass": wm_class,
        "title": title[:120],
        "frameExtents": fe,
        "xwininfo": xwi,
        "decorationModel": "muffin-ssd" if fe and fe.get("property") == "_NET_FRAME_EXTENTS" else "gtk-csd",
    })

ssd = [w for w in windows if w.get("decorationModel") == "muffin-ssd"]
titlebar_tops = [w["frameExtents"]["top"] for w in ssd if w.get("frameExtents")]

payload = {
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "source": "vm-mint-window-chrome-inventory.sh",
    "display": ":0",
    "mint": run("grep RELEASE= /etc/linuxmint/info 2>/dev/null | cut -d= -f2 | tr -d '\"'"),
    "themes": {
        "cinnamon": gget("org.cinnamon.theme", "name"),
        "gtk": gget("org.cinnamon.desktop.interface", "gtk-theme"),
        "icons": gget("org.cinnamon.desktop.interface", "icon-theme"),
    },
    "muffin": {
        "buttonLayout": gget("org.cinnamon.desktop.wm.preferences", "button-layout"),
        "actionDoubleClickTitlebar": gget("org.cinnamon.desktop.wm.preferences", "action-double-click-titlebar"),
        "theme": gget("org.cinnamon.desktop.wm.preferences", "theme"),
    },
    "displayMetrics": {
        "dimensions": run("xdpyinfo | awk '/dimensions:/{print $2; exit}'"),
        "resolutionDpi": run("xdpyinfo | awk '/resolution:/{print $2; exit}'"),
    },
    "windows": windows,
    "aggregates": {
        "ssdTitlebarTopPx": titlebar_tops,
        "ssdTitlebarTopMedian": sorted(titlebar_tops)[len(titlebar_tops) // 2] if titlebar_tops else None,
        "buttonLayout": gget("org.cinnamon.desktop.wm.preferences", "button-layout"),
    },
    "notes": [
        "SSD Muffin : _NET_FRAME_EXTENTS.top ≈ hauteur barre titre (typ. 32 px sur Mint 22.3 Zena).",
        "GTK CSD (Calculatrice, File Roller) : _GTK_FRAME_EXTENTS — ombre client, pas barre Muffin.",
        "CapsuleOS Mint simule SSD Muffin pour tous les slots (y compris File Roller).",
    ],
}

print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
