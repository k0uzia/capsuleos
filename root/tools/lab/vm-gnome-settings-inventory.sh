#!/usr/bin/env bash
# Inventaire Paramètres GNOME (VM) — matrice contrôle ↔ gsettings pour parité CapsuleOS.
# Usage VM : DISPLAY=:0 bash vm-gnome-settings-inventory.sh > /tmp/gnome-settings-parity.json
# Depuis l'hôte :
#   ssh -i ~/.ssh/capsuleos-lab capsule@IP 'bash -s' < root/tools/lab/vm-gnome-settings-inventory.sh
set -uo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import subprocess
from datetime import datetime, timezone

def gget(schema, key):
    try:
        return subprocess.check_output(
            ["gsettings", "get", schema, key],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except Exception:
        return ""

def glist(schema):
    try:
        raw = subprocess.check_output(
            ["gsettings", "list-recursively", schema],
            stderr=subprocess.DEVNULL,
            text=True,
        )
        out = {}
        for line in raw.splitlines():
            parts = line.split(None, 2)
            if len(parts) >= 3:
                out[parts[1]] = parts[2]
        return out
    except Exception:
        return {}

# Aligné sur usr/lib/capsuleos/shells/linux/gnome-settings-parity.js
controls = {
    "switches": {
        "night-light": {"vm": "org.gnome.settings-daemon.plugins.color night-light-enabled", "value": gget("org.gnome.settings-daemon.plugins.color", "night-light-enabled")},
        "notifications": {"vm": "org.gnome.desktop.notifications show-banners", "value": gget("org.gnome.desktop.notifications", "show-banners")},
        "lock-notifications": {"vm": "org.gnome.desktop.notifications show-in-lock-screen", "value": gget("org.gnome.desktop.notifications", "show-in-lock-screen")},
        "touchpad": {"vm": "org.gnome.desktop.peripherals.touchpad send-events", "value": gget("org.gnome.desktop.peripherals.touchpad", "send-events")},
        "tap-to-click": {"vm": "org.gnome.desktop.peripherals.touchpad tap-to-click", "value": gget("org.gnome.desktop.peripherals.touchpad", "tap-to-click")},
        "auto-lock": {"vm": "org.gnome.desktop.screensaver lock-enabled", "value": gget("org.gnome.desktop.screensaver", "lock-enabled")},
        "camera": {"vm": "org.gnome.desktop.privacy disable-camera", "value": gget("org.gnome.desktop.privacy", "disable-camera")},
        "microphone": {"vm": "org.gnome.desktop.privacy disable-microphone", "value": gget("org.gnome.desktop.privacy", "disable-microphone")},
    },
    "selects": {
        "dynamic-workspaces": {"vm": "org.gnome.mutter dynamic-workspaces", "value": gget("org.gnome.mutter", "dynamic-workspaces")},
        "hot-corner": {"vm": "org.gnome.desktop.interface enable-hot-corners", "value": gget("org.gnome.desktop.interface", "enable-hot-corners")},
        "apps-all-workspaces": {"vm": "org.gnome.shell app-switcher current-workspace-only", "value": gget("org.gnome.shell.app-switcher", "current-workspace-only")},
        "mouse-handedness": {"vm": "org.gnome.desktop.peripherals.mouse left-handed", "value": gget("org.gnome.desktop.peripherals.mouse", "left-handed")},
        "scroll-direction": {"vm": "org.gnome.desktop.peripherals.touchpad natural-scroll", "value": gget("org.gnome.desktop.peripherals.touchpad", "natural-scroll")},
        "keyboard-layout": {"vm": "org.gnome.desktop.input-sources sources", "value": gget("org.gnome.desktop.input-sources", "sources")},
        "keyboard-repeat": {"vm": "org.gnome.desktop.peripherals.keyboard delay", "value": gget("org.gnome.desktop.peripherals.keyboard", "delay")},
        "lock-delay": {"vm": "org.gnome.desktop.screensaver lock-delay", "value": gget("org.gnome.desktop.screensaver", "lock-delay")},
        "power-dim": {"vm": "org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout", "value": gget("org.gnome.settings-daemon.plugins.power", "sleep-inactive-ac-timeout")},
        "power-sleep": {"vm": "org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type", "value": gget("org.gnome.settings-daemon.plugins.power", "sleep-inactive-ac-type")},
        "sound-alert": {"vm": "org.gnome.desktop.sound theme-name", "value": gget("org.gnome.desktop.sound", "theme-name")},
        "display-scale": {"vm": "org.gnome.desktop.interface text-scaling-factor", "value": gget("org.gnome.desktop.interface", "text-scaling-factor")},
    },
    "sliders": {
        "volume": {"vm": "org.gnome.settings-daemon.plugins.media-keys volume-step", "value": gget("org.gnome.settings-daemon.plugins.media-keys", "volume-step")},
        "pointer-speed": {"vm": "org.gnome.desktop.peripherals.mouse speed", "value": gget("org.gnome.desktop.peripherals.mouse", "speed")},
    },
    "appearance": {
        "color-scheme": gget("org.gnome.desktop.interface", "color-scheme"),
        "accent-color": gget("org.gnome.desktop.interface", "accent-color"),
        "gtk-theme": gget("org.gnome.desktop.interface", "gtk-theme"),
        "icon-theme": gget("org.gnome.desktop.interface", "icon-theme"),
        "picture-uri": gget("org.gnome.desktop.background", "picture-uri"),
        "picture-uri-dark": gget("org.gnome.desktop.background", "picture-uri-dark"),
    },
    "search-providers": {
        "disabled": gget("org.gnome.desktop.search-providers", "disabled"),
    },
    "schemas": {
        "org.gnome.mutter": glist("org.gnome.mutter"),
        "org.gnome.desktop.notifications": glist("org.gnome.desktop.notifications"),
        "org.gnome.desktop.peripherals.mouse": glist("org.gnome.desktop.peripherals.mouse"),
        "org.gnome.desktop.peripherals.touchpad": glist("org.gnome.desktop.peripherals.touchpad"),
        "org.gnome.settings-daemon.plugins.power": glist("org.gnome.settings-daemon.plugins.power"),
    },
}

out = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "source": "vm-gnome-settings-inventory.sh",
    "controls": controls,
}

print(json.dumps(out, indent=2, ensure_ascii=False))
PY
