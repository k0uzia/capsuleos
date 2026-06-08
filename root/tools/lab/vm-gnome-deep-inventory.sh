#!/usr/bin/env bash
# Inventaire profond GNOME (VM) — workspaces, raccourcis, polices, thèmes, extensions.
# Usage VM : DISPLAY=:0 bash vm-gnome-deep-inventory.sh
# Depuis l'hôte :
#   ssh -i ~/.ssh/capsuleos-lab capsule@IP 'export DISPLAY=:0 XAUTHORITY=…; bash -s' < root/tools/lab/vm-gnome-deep-inventory.sh
#   node usr/lib/capsuleos/tools/lab/collect-vm-deep-audit.mjs --id linux-rocky --phase static
set -uo pipefail
export DISPLAY="${DISPLAY:-:0}"

python3 <<'PY'
import json
import os
import re
import subprocess
from datetime import datetime, timezone

def run(cmd, timeout=30):
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

def os_release():
    data = {}
    try:
        with open("/etc/os-release", encoding="utf-8") as f:
            for line in f:
                if "=" in line:
                    k, v = line.strip().split("=", 1)
                    data[k] = v.strip().strip('"')
    except OSError:
        pass
    return data

DESKTOP_DIRS = (
    "/usr/share/applications",
    "/var/lib/snapd/desktop/applications",
    os.path.expanduser("~/.local/share/applications"),
)

def desktop_entry(name):
    path = None
    for base in DESKTOP_DIRS:
        candidate = os.path.join(base, name)
        if os.path.isfile(candidate):
            path = candidate
            break
    if not path:
        return {
            "desktop": name,
            "name": name.replace(".desktop", ""),
            "icon": None,
            "exec": None,
            "unresolved": True,
        }
    data = {"desktop": name, "path": path}
    with open(path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            if line.startswith("Name=") and "name" not in data:
                data["name"] = line[5:].strip()
            elif line.startswith("Icon="):
                data["icon"] = line[5:].strip()
            elif line.startswith("Exec=") and "exec" not in data:
                data["exec"] = line[5:].strip().split()[0]
    return data

def resolve_icon_path(icon_name):
    if not icon_name:
        return []
    candidates = []
    theme = gget("org.gnome.desktop.interface", "icon-theme").strip("'") or "Adwaita"
    sizes = ("scalable", "48x48", "256x256", "32x32")
    contexts = ("apps", "places", "devices", "status")
    for base in (f"/usr/share/icons/{theme}", "/usr/share/icons/hicolor"):
        for ctx in contexts:
            for size in sizes:
                for ext in ("svg", "png"):
                    p = f"{base}/{size}/{ctx}/{icon_name}.{ext}"
                    if os.path.isfile(p):
                        candidates.append(p)
    return candidates[:5]

def fonts_catalog():
    raw = run("fc-list --format '%{family}\\t%{style}\\t%{file}\\n' 2>/dev/null | sort -u")
    families = {}
    for line in raw.splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        fam, style, path = parts[0], parts[1], parts[2]
        families.setdefault(fam, []).append({"style": style, "file": path})
    ui = []
    for fam in ("Cantarell", "Adwaita Sans", "Ubuntu", "Noto Sans"):
        if fam in families:
            ui.append({"family": fam, "variants": families[fam][:8]})
    mono = []
    for fam in ("Adwaita Mono", "DejaVu Sans Mono", "Source Code Pro", "Liberation Mono"):
        if fam in families:
            mono.append({"family": fam, "variants": families[fam][:6]})
    return {"ui": ui, "monospace": mono, "totalFamilies": len(families)}

def shell_extensions():
    out = []
    ext_dir = os.path.expanduser("~/.local/share/gnome-shell/extensions")
    sys_dir = "/usr/share/gnome-shell/extensions"
    for base in (sys_dir, ext_dir):
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            meta = os.path.join(base, name, "metadata.json")
            if os.path.isfile(meta):
                try:
                    with open(meta, encoding="utf-8") as f:
                        m = json.load(f)
                    out.append({
                        "uuid": name,
                        "name": m.get("name", name),
                        "path": os.path.join(base, name),
                        "enabled": name in gget("org.gnome.shell", "enabled-extensions").replace("[", "").replace("]", "").replace("'", "").split(",") if gget("org.gnome.shell", "enabled-extensions") else False,
                    })
                except (json.JSONDecodeError, OSError):
                    pass
    return out

def keybinding_groups():
    schemas = [
        "org.gnome.shell.keybindings",
        "org.gnome.desktop.wm.keybindings",
        "org.gnome.settings-daemon.plugins.media-keys",
        "org.gnome.mutter.keybindings",
        "org.gnome.mutter.wayland.keybindings",
    ]
    groups = {}
    for schema in schemas:
        data = glist(schema)
        if data:
            groups[schema] = data
    return groups

favorites_raw = gget("org.gnome.shell", "favorite-apps")
favorites = []
if favorites_raw:
    favorites = [x.strip().strip("'") for x in favorites_raw.replace("[", "").replace("]", "").split(",") if x.strip()]

favorite_details = []
for desktop in favorites:
    entry = desktop_entry(desktop)
    if entry:
        entry["iconPaths"] = resolve_icon_path(entry.get("icon", ""))
        favorite_details.append(entry)

workspaces = {
    "dynamicWorkspaces": gget("org.gnome.mutter", "dynamic-workspaces"),
    "workspacesOnlyOnPrimary": gget("org.gnome.mutter", "workspaces-only-on-primary"),
    "numWorkspacesLegacy": gget("org.gnome.desktop.wm.preferences", "num-workspaces"),
    "workspaceNames": gget("org.gnome.desktop.wm.preferences", "workspace-names"),
}

payload = {
    "auditVersion": 1,
    "phase": "static",
    "toolkit": "gnome",
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "source": "vm-gnome-deep-inventory.sh",
    "os": os_release(),
    "versions": {
        "gnomeShell": run("gnome-shell --version"),
        "nautilus": run("nautilus --version 2>/dev/null | head -1"),
        "firefox": run("firefox --version 2>/dev/null | head -1"),
        "ptyxis": run("ptyxis --version 2>/dev/null | head -1"),
    },
    "session": {
        "display": os.environ.get("DISPLAY", ":0"),
        "sessionType": "wayland-xwayland",
    },
    "theme": {
        "gtkTheme": gget("org.gnome.desktop.interface", "gtk-theme"),
        "iconTheme": gget("org.gnome.desktop.interface", "icon-theme"),
        "colorScheme": gget("org.gnome.desktop.interface", "color-scheme"),
        "accentColor": gget("org.gnome.desktop.interface", "accent-color"),
        "fontName": gget("org.gnome.desktop.interface", "font-name"),
        "documentFontName": gget("org.gnome.desktop.interface", "document-font-name"),
        "monospaceFontName": gget("org.gnome.desktop.interface", "monospace-font-name"),
        "backgroundUri": gget("org.gnome.desktop.background", "picture-uri"),
        "backgroundDarkUri": gget("org.gnome.desktop.background", "picture-uri-dark"),
    },
    "workspaces": workspaces,
    "dashFavorites": favorite_details,
    "keybindings": keybinding_groups(),
    "fonts": fonts_catalog(),
    "extensions": shell_extensions(),
    "capsuleMappingHints": {
        "overviewToggle": "org.gnome.shell.keybindings toggle-overview",
        "workspaceLeft": "org.gnome.desktop.wm.keybindings switch-to-workspace-left",
        "workspaceRight": "org.gnome.desktop.wm.keybindings switch-to-workspace-right",
        "moveWindowWorkspace": "org.gnome.desktop.wm.keybindings move-to-workspace-*",
    },
    "nextPhases": [
        "interaction-matrix",
        "context-menus",
        "animations",
        "workspace-gestures",
    ],
}

print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
