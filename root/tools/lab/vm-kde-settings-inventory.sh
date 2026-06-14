#!/usr/bin/env bash
# Inventaire intégral Paramètres KDE Plasma (VM) — modules KCM + catégories sidebar.
# Usage VM : DISPLAY=:1 bash vm-kde-settings-inventory.sh
# Depuis l'hôte :
#   node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-inventory.mjs --id linux-kde-neon --write
set -uo pipefail
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR}/bus}"
if [[ -z "${XAUTHORITY:-}" ]]; then
  XAUTH_FILE=$(ls "${XDG_RUNTIME_DIR}"/xauth_* 2>/dev/null | head -1)
  [[ -n "$XAUTH_FILE" ]] && export XAUTHORITY="$XAUTH_FILE"
fi
export DISPLAY="${DISPLAY:-:1}"

python3 <<'PY'
import glob
import json
import os
import subprocess
from datetime import datetime, timezone

P0_KEYWORDS = {
    "lookandfeel", "access", "kscreen", "notifications", "about-distro",
    "colors", "componentchooser", "keys", "workspace", "kwinoptions",
    "kwin_virtualdesktops", "wallpaper", "desktoptheme", "icons", "style",
    "nightlight", "powerdevilprofilesconfig", "regionandlang", "keyboard",
    "mouse", "fontinst", "networkmanagement",
}

HUB_CATEGORIES = [
    {"id": "appearance", "labelFr": "Apparence", "kcmKeywords": ["lookandfeel", "colors", "icons", "wallpaper", "desktoptheme", "style", "cursortheme"]},
    {"id": "workspace", "labelFr": "Espace de travail", "kcmKeywords": ["workspace", "kwinoptions", "kwin_virtualdesktops", "kwinrules", "kwintabbox"]},
    {"id": "accessibility", "labelFr": "Accessibilité", "kcmKeywords": ["access"]},
    {"id": "display-config", "labelFr": "Affichage et écran", "kcmKeywords": ["kscreen", "nightlight", "kgamma"]},
    {"id": "notifications", "labelFr": "Notifications", "kcmKeywords": ["notifications"]},
    {"id": "applications", "labelFr": "Applications", "kcmKeywords": ["componentchooser", "filetypes", "autostart"]},
    {"id": "network", "labelFr": "Connexion", "kcmKeywords": ["networkmanagement", "mobile_wifi", "bluetooth", "proxy"]},
    {"id": "about", "labelFr": "À propos de ce système", "kcmKeywords": ["about-distro"]},
]


def kread(file, group, key):
    try:
        return subprocess.check_output(
            ["kreadconfig6", "--file", file, "--group", group, "--key", key],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except Exception:
        return ""


modules = []
for path in sorted(glob.glob("/usr/share/applications/kcm*.desktop")):
    data = {
        "file": os.path.basename(path),
        "name": "",
        "nameFr": "",
        "exec": "",
        "keyword": "",
        "vmLaunch": "",
        "surface": "kcm",
    }
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.startswith("Name[fr]="):
                data["nameFr"] = line.split("=", 1)[1].strip()
            elif line.startswith("Name=") and not data["name"]:
                data["name"] = line.split("=", 1)[1].strip()
            elif line.startswith("Exec="):
                data["exec"] = line.split("=", 1)[1].strip()
            elif line.startswith("X-KDE-PluginInfo-Keyword="):
                data["keyword"] = line.split("=", 1)[1].strip()
    base = data["file"].replace(".desktop", "")
    if not data["keyword"]:
        data["keyword"] = base.replace("kcm_", "")
    if not data["nameFr"]:
        data["nameFr"] = data["name"]
    if data["exec"].startswith("systemsettings"):
        data["vmLaunch"] = f"systemsettings {base}"
    elif data["exec"].startswith("kcmshell6"):
        parts = data["exec"].split()
        data["vmLaunch"] = f"{parts[0]} {base}" if len(parts) > 1 else f"kcmshell6 {base}"
    else:
        data["vmLaunch"] = data["exec"].split()[0] if data["exec"] else base
    kw = data["keyword"]
    if "_x11" in base or base.endswith("_x11"):
        data["priority"] = "P2"
    elif kw in P0_KEYWORDS or base in (
        "kcm_lookandfeel", "kcm_access", "kcm_kscreen", "kcm_notifications",
        "kcm_about-distro", "kcm_colors", "kcm_componentchooser", "kcm_keys",
        "kcm_workspace", "kcm_kwinoptions", "kcm_kwin_virtualdesktops",
    ):
        data["priority"] = "P0"
    else:
        data["priority"] = "P1"
    modules.append(data)

for cat in HUB_CATEGORIES:
    cat["modules"] = [m for m in modules if m["keyword"] in cat["kcmKeywords"] or any(
        m["file"].replace(".desktop", "").endswith(kw.replace("-", "_")) for kw in cat["kcmKeywords"]
    )]
    cat["moduleCount"] = len(cat["modules"])

out = {
    "version": 1,
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "source": "vm-kde-settings-inventory.sh",
    "registryId": os.environ.get("CAPSULE_REGISTRY_ID", "linux-kde-neon"),
    "moduleCount": len(modules),
    "p0Count": sum(1 for m in modules if m["priority"] == "P0"),
    "p1Count": sum(1 for m in modules if m["priority"] == "P1"),
    "p2Count": sum(1 for m in modules if m["priority"] == "P2"),
    "hubCategories": HUB_CATEGORIES,
    "modules": modules,
    "kconfigSample": {
        "ColorScheme": kread("kdeglobals", "General", "ColorScheme"),
        "ContrastEffect": kread("kdeglobals", "KDE", "ContrastEffect"),
        "AnimationDurationFactor": kread("kdeglobals", "KDE", "AnimationDurationFactor"),
        "FocusPolicy": kread("kwinrc", "Windows", "FocusPolicy"),
        "FocusStealingPreventionLevel": kread("kwinrc", "Windows", "FocusStealingPreventionLevel"),
    },
    "coverage": {
        "vmModulesListed": len(modules),
        "hubCategories": len(HUB_CATEGORIES),
    },
}

print(json.dumps(out, indent=2, ensure_ascii=False))
PY
