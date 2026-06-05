#!/usr/bin/env bash
# Inventaire JSON KDE Neon / Plasma (VM) — ground truth CapsuleOS.
# Usage VM : DISPLAY=:0 bash vm-kde-neon-inventory.sh
# Depuis l'hôte : ssh -i ~/.ssh/capsuleos-lab goupil@IP 'bash -s' < vm-kde-neon-inventory.sh
set -uo pipefail
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR}/bus}"
if [[ -z "${XAUTHORITY:-}" ]]; then
  XAUTH_FILE=$(ls "${XDG_RUNTIME_DIR}"/xauth_* 2>/dev/null | head -1)
  [[ -n "$XAUTH_FILE" ]] && export XAUTHORITY="$XAUTH_FILE"
fi
export DISPLAY="${DISPLAY:-:1}"

python3 <<'PY'
import json
import os
import subprocess
from datetime import datetime, timezone

def run(cmd, shell=False):
    env = os.environ.copy()
    env.setdefault("PATH", "/usr/bin:/bin")
    try:
        return subprocess.check_output(
            cmd, shell=shell, stderr=subprocess.DEVNULL, text=True, env=env
        ).strip()
    except Exception:
        return ""

def kread(file, group, key):
    return run(["kreadconfig6", "--file", file, "--group", group, "--key", key])

def desktop_entry(name):
    path = f"/usr/share/applications/{name}"
    if not os.path.isfile(path):
        return None
    data = {"desktop": name}
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.startswith("Name=") and "name" not in data:
                data["name"] = line[5:].strip()
            elif line.startswith("Icon=") and "icon" not in data:
                data["icon"] = line[5:].strip()
            elif line.startswith("Exec=") and "exec" not in data:
                data["exec"] = line[5:].strip().split()[0]
    return data

os_release = {}
if os.path.isfile("/etc/os-release"):
    with open("/etc/os-release", encoding="utf-8") as f:
        for line in f:
            if "=" in line:
                k, v = line.strip().split("=", 1)
                os_release[k] = v.strip().strip('"')

panel_core = []
for desktop in (
    "org.kde.dolphin.desktop",
    "firefox.desktop",
    "org.kde.konsole.desktop",
    "org.kde.discover.desktop",
    "org.kde.systemsettings.desktop",
):
    entry = desktop_entry(desktop)
    if entry:
        panel_core.append(entry)

kickoff = {"popupWidth": None, "popupHeight": None, "favorites": []}
cfg_path = os.path.expanduser("~/.config/plasma-org.kde.plasma.desktop-appletsrc")
if os.path.isfile(cfg_path):
    with open(cfg_path, encoding="utf-8") as f:
        cfg_text = f.read()
    import re
    m = re.search(
        r"\[Containments\]\[2\]\[Applets\]\[3\]\[Configuration\]\n(.*?)(?=\n\[Containments\]\[2\]\[Applets\]\[4\])",
        cfg_text,
        re.S,
    )
    if m:
        block = m.group(1)
        for key in ("popupWidth", "popupHeight"):
            km = re.search(rf"^{key}=(.+)$", block, re.M)
            if km:
                kickoff[key] = int(km.group(1).strip())

db_path = os.path.expanduser("~/.local/share/kactivitymanagerd/resources/database")
if os.path.isfile(db_path):
    import sqlite3
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        cur = conn.cursor()
        for row in cur.execute(
            """
            SELECT targettedResource FROM ResourceLink
            WHERE initiatingAgent = 'org.kde.plasma.favorites.applications'
            ORDER BY rowid
            """
        ):
            fav = row[0]
            item = {"resource": fav}
            if fav == "preferred://browser":
                item["name"] = "Firefox"
                item["desktop"] = "firefox.desktop"
            elif fav.startswith("applications:"):
                desk = fav.split(":", 1)[1]
                item["desktop"] = desk
                meta = desktop_entry(desk)
                if meta:
                    item.update(meta)
            else:
                item["desktop"] = fav
                meta = desktop_entry(fav)
                if meta:
                    item.update(meta)
            kickoff["favorites"].append(item)
    except Exception:
        pass

wallpapers = []
bg_dir = "/usr/share/wallpapers"
if os.path.isdir(bg_dir):
    for name in sorted(os.listdir(bg_dir))[:30]:
        wallpapers.append(name)

payload = {
    "registryId": "linux-kde-neon",
    "toolkit": "kde",
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "os": {
        "prettyName": os_release.get("PRETTY_NAME", ""),
        "name": os_release.get("NAME", ""),
        "versionId": os_release.get("VERSION_ID", ""),
        "version": os_release.get("VERSION", ""),
        "codename": os_release.get("VERSION_CODENAME", ""),
        "id": os_release.get("ID", ""),
    },
    "versions": {
        "plasmashell": run("plasmashell --version"),
        "dolphin": run("dolphin --version"),
        "firefox": run("firefox --version"),
        "konsole": run("konsole --version"),
    },
    "themes": {
        "icons": kread("kdeglobals", "Icons", "Theme"),
        "widgetStyle": kread("kdeglobals", "KDE", "widgetStyle"),
        "colorScheme": kread("kdeglobals", "General", "ColorScheme"),
        "plasmaTheme": kread("plasmarc", "Theme", "name"),
        "lookAndFeel": kread("kscreenlockerrc", "Greeter", "LookAndFeelPackage"),
    },
    "session": {
        "display": os.environ.get("DISPLAY", ""),
        "xdgRuntimeDir": os.environ.get("XDG_RUNTIME_DIR", ""),
        "sessionType": run("loginctl show-session $(loginctl | awk '/tty|seat/ {print $1; exit}') -p Type --value 2>/dev/null", shell=True),
    },
    "apps": {
        "panelCore": panel_core,
        "wallpaperDirs": wallpapers,
        "kickoff": kickoff,
    },
    "branding": {
        "logoCandidates": [
            p for p in (
                "/usr/share/icons/hicolor/scalable/apps/start-here-kde-neon.svg",
                "/usr/share/icons/breeze/apps/48/start-here-kde.svg",
            ) if os.path.isfile(p)
        ],
    },
}

print(json.dumps(payload, indent=2, ensure_ascii=False))
PY
