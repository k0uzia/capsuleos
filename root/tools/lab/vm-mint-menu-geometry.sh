#!/usr/bin/env bash
# Mesure géométrie panel + menu Cinnamon sur VM Mint (DISPLAY=:0).
set -euo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import subprocess
import time

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL, text=True).strip()
    except Exception:
        return ""

def parse_wmctrl():
    out = []
    raw = run("wmctrl -lG")
    for line in raw.splitlines():
        parts = line.split(None, 7)
        if len(parts) < 8:
            continue
        out.append({
            "id": parts[0],
            "x": int(parts[2]),
            "y": int(parts[3]),
            "w": int(parts[4]),
            "h": int(parts[5]),
            "title": parts[7],
        })
    return out

# Toggle menu closed then open (bottom-left ~20,790 on 1280x800)
subprocess.run("xdotool mousemove 22 788", shell=True)
time.sleep(0.2)
subprocess.run("xdotool click 1", shell=True)
time.sleep(0.5)
subprocess.run("xdotool click 1", shell=True)
time.sleep(0.3)
before = parse_wmctrl()

subprocess.run("xdotool mousemove 22 788 click 1", shell=True)
time.sleep(1.0)
after = parse_wmctrl()

new_windows = [w for w in after if w not in before]
menu_candidates = [
    w for w in after
    if w["w"] >= 400 and w["h"] >= 300 and w["y"] >= 50 and w["y"] < 760
]
menu_candidates.sort(key=lambda w: (-w["h"], w["x"]))

screen = run('xdpyinfo | awk "/dimensions:/{print \\$2; exit}"')
panel_h = run("gsettings get org.cinnamon panels-height")
zone = run("gsettings get org.cinnamon panel-zone-icon-sizes")

# Screenshot menu open
shot = "/tmp/capsuleos-vm-menu.png"
subprocess.run(f"import -window root {shot}", shell=True)

result = {
    "screen": screen,
    "panelHeightGsettings": panel_h,
    "zoneIconSizes": zone,
    "menuCandidates": menu_candidates[:3],
    "newWindows": new_windows,
    "screenshot": shot if run(f"test -f {shot} && echo ok") == "ok" else None,
}
print(json.dumps(result, indent=2))
PY
