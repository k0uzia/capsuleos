#!/usr/bin/env bash
# Passe gsettings approfondie VM — clés secondaires liées aux contrôles P0 documentés.
set -uo pipefail

export DISPLAY="${DISPLAY:-:0}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"

python3 <<'PY'
import json
import subprocess
from datetime import datetime, timezone


def gget(schema, key):
    try:
        return subprocess.check_output(
            ["gsettings", "get", schema, key], stderr=subprocess.DEVNULL, text=True
        ).strip()
    except Exception:
        return None


def cluster(schema, keys):
    return {k: gget(schema, k) for k in keys}


out = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "source": "vm-gnome-settings-gsettings-deep-pass.sh",
    "probes": {
        "theme": {
            "primary": cluster("org.gnome.desktop.interface", ["color-scheme", "gtk-theme"]),
            "linked": cluster(
                "org.gnome.desktop.background",
                ["picture-uri", "picture-uri-dark", "picture-options"],
            ),
            "notes": "color-scheme pilote GTK/Shell ; fonds jour/nuit peuvent rester identiques sur RL10.",
        },
        "night-light": {
            "primary": cluster(
                "org.gnome.settings-daemon.plugins.color",
                ["night-light-enabled", "night-light-temperature", "night-light-schedule-from", "night-light-schedule-to"],
            ),
            "linked": cluster("org.gnome.desktop.notifications", ["show-banners"]),
            "notes": "Exclusion top bar = rendu gsd-color, pas de clé gsettings dédiée.",
        },
        "dynamic-workspaces": {
            "primary": cluster("org.gnome.mutter", ["dynamic-workspaces", "workspaces-only-on-primary"]),
            "notes": "Bascule booléenne ; animation overview = gnome-shell/mutter.",
        },
        "dnd": {
            "primary": {"shell-session": "no-gsettings-key"},
            "linked": cluster("org.gnome.desktop.notifications", ["show-banners", "show-in-lock-screen"]),
            "notes": "DND = session gnome-shell (_dndToggle) ; bannières indépendantes de DND.",
        },
    },
}

print(json.dumps(out, indent=2, ensure_ascii=False))
PY
