#!/usr/bin/env bash
# Playbook interactif VM — ouvre chaque panneau gnome-control-center et compare gsettings en temps réel.
#
# Usage local VM :
#   DISPLAY=:0 bash root/tools/lab/vm-gnome-settings-playbook.sh
#   DISPLAY=:0 bash root/tools/lab/vm-gnome-settings-playbook.sh --panel wifi
#
# Depuis l'hôte :
#   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs --id linux-rocky
#
# Variables :
#   CAPSULE_SETTINGS_DWELL_MS — pause après ouverture panneau (défaut 1400)
#   CAPSULE_SETTINGS_MATRIX — chemin matrice JSON (défaut : à côté du script)
set -uo pipefail

export DISPLAY="${DISPLAY:-:0}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export XDG_CURRENT_DESKTOP="${XDG_CURRENT_DESKTOP:-GNOME}"
export GNOME_SHELL_SESSION_MODE="${GNOME_SHELL_SESSION_MODE:-default}"
export DESKTOP_SESSION="${DESKTOP_SESSION:-gnome}"
if [[ -z "${XAUTHORITY:-}" ]]; then
  XAUTHORITY=$(ls /run/user/"$(id -u)"/.mutter-Xwaylandauth.* 2>/dev/null | head -1 || true)
  export XAUTHORITY
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MATRIX_PATH="${CAPSULE_SETTINGS_MATRIX:-$SCRIPT_DIR/gnome-settings-parity-matrix.json}"
PANEL_FILTER="${1:-}"
if [[ "$PANEL_FILTER" == "--panel" && -n "${2:-}" ]]; then
  PANEL_FILTER="$2"
elif [[ "$PANEL_FILTER" == "--panel" ]]; then
  PANEL_FILTER=""
fi

if [[ ! -f "$MATRIX_PATH" ]]; then
  echo "{\"error\":\"matrix_missing\",\"path\":\"$MATRIX_PATH\"}" >&2
  exit 1
fi

export CAPSULE_SETTINGS_MATRIX="$MATRIX_PATH"
export CAPSULE_SETTINGS_DWELL_MS="${CAPSULE_SETTINGS_DWELL_MS:-1400}"
export CAPSULE_SETTINGS_PANEL_FILTER="${PANEL_FILTER}"

python3 <<'PY'
import json
import os
import re
import signal
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
import hashlib

MATRIX_PATH = os.environ["CAPSULE_SETTINGS_MATRIX"]
DWELL_MS = int(os.environ.get("CAPSULE_SETTINGS_DWELL_MS", "1400"))
PANEL_FILTER = os.environ.get("CAPSULE_SETTINGS_PANEL_FILTER", "").strip()
SCRIPT_DIR = Path(MATRIX_PATH).parent
ASSETS_MATRIX_PATH = os.environ.get(
    "CAPSULE_SETTINGS_ASSETS_MATRIX",
    str(SCRIPT_DIR / "gnome-settings-assets-matrix.json"),
)

with open(MATRIX_PATH, encoding="utf-8") as f:
    MATRIX = json.load(f)

PANELS = MATRIX.get("panels", [])


def run(cmd, timeout=20):
    try:
        return subprocess.check_output(cmd, shell=isinstance(cmd, str), stderr=subprocess.DEVNULL, text=True, timeout=timeout).strip()
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


def snapshot_pairs(pairs):
    out = {}
    for schema, key in pairs:
        out[f"{schema}::{key}"] = gget(schema, key)
    return out


def close_settings():
    subprocess.run(["pkill", "-f", "gnome-control-center"], stderr=subprocess.DEVNULL)
    time.sleep(0.35)


def gcc_running():
    try:
        out = subprocess.check_output(["pgrep", "-af", "gnome-control-center"], stderr=subprocess.DEVNULL, text=True)
        for line in out.splitlines():
            if "gnome-control-center" in line and "vm-gnome-settings-playbook" not in line:
                return True
        return False
    except Exception:
        return False


def list_windows():
    wmctrl = run(["wmctrl", "-l"])
    if not wmctrl:
        return []
    lines = []
    for line in wmctrl.splitlines():
        parts = line.split(None, 3)
        if len(parts) >= 4:
            lines.append({"id": parts[0], "title": parts[3]})
    return lines


def window_matches(title_hints):
    if not title_hints:
        return None
    lowered = [h.lower() for h in title_hints]
    for win in list_windows():
        title = win["title"].lower()
        if any(h in title for h in lowered) or "paramètres" in title or "settings" in title:
            return win
    return None


def launch_panel(candidates):
    close_settings()
    chosen = None
    for argv in candidates:
        try:
            subprocess.Popen(
                ["gnome-control-center", argv],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
        except OSError:
            continue
        deadline = time.time() + (DWELL_MS / 1000.0)
        while time.time() < deadline:
            if gcc_running():
                chosen = argv
                break
            time.sleep(0.12)
        if chosen:
            break
    if chosen:
        time.sleep(max(0.2, DWELL_MS / 1000.0 - 0.3))
    return chosen, gcc_running()


def parse_uint32(raw):
    m = re.search(r"uint32\s+(\d+)", raw or "")
    if m:
        return int(m.group(1))
    try:
        return int(re.sub(r"[^\d]", "", raw or "") or "0")
    except ValueError:
        return 0


def nmcli_wifi_on():
    raw = run("nmcli -t radio 2>/dev/null")
    if not raw:
        return None
    parts = raw.split(":")
    if len(parts) >= 2:
        state = parts[1].strip().lower()
        return state in {"enabled", "activé", "yes", "on", "true", "1"}
    return None


def nmcli_bluetooth_on():
    raw = run("rfkill list bluetooth 2>/dev/null")
    if not raw:
        return None
    blocked = "Soft blocked: yes" in raw or "Hard blocked: yes" in raw
    return not blocked


def power_profile():
    raw = run("powerprofilesctl get 2>/dev/null")
    if not raw:
        return ""
    mapping = {
        "performance": "Performance",
        "balanced": "Équilibré",
        "power-saver": "Économie d'énergie",
    }
    return mapping.get(raw.strip().lower(), raw.strip())


def gtk_high_contrast():
    theme = strip_gvariant(gget("org.gnome.desktop.interface", "gtk-theme")).lower()
    return "highcontrast" in theme.replace("-", "").replace("_", "")


def parse_bool(raw):
    return raw.strip().lower() in {"true", "'true'"}


def strip_gvariant(raw):
    if raw.startswith("'") and raw.endswith("'"):
        return raw[1:-1]
    return raw


def map_value(map_name, raw, control=None):
    if not map_name or map_name == "volumeStepNote":
        return {"raw": raw, "capsule": None, "note": "volume-step ≠ curseur %"}
    if map_name == "boolOnOff":
        on = parse_bool(raw)
        return {"raw": raw, "capsule": "on" if on else "off"}
    if map_name == "enabledLabelFr":
        on = parse_bool(raw)
        return {"raw": raw, "capsule": "Activé" if on else "Désactivé"}
    if map_name == "workspaceOnlyInverted":
        only = parse_bool(raw)
        return {"raw": raw, "capsule": "Désactivé" if only else "Activé"}
    if map_name == "mouseHandedness":
        return {"raw": raw, "capsule": "Droit" if parse_bool(raw) else "Gauche"}
    if map_name == "scrollDirection":
        return {"raw": raw, "capsule": "Naturel" if parse_bool(raw) else "Standard"}
    if map_name == "touchpadEnabled":
        enabled = "'enabled'" in raw or raw == "'enabled'"
        return {"raw": raw, "capsule": "on" if enabled else "off"}
    if map_name == "privacyInverted":
        disabled = parse_bool(raw)
        return {"raw": raw, "capsule": "off" if disabled else "on"}
    if map_name == "boolContrast":
        if raw:
            high = parse_bool(raw)
        else:
            high = gtk_high_contrast()
        return {"raw": raw or str(high), "capsule": "high" if high else "normal"}
    if map_name == "gtkHighContrast":
        high = gtk_high_contrast()
        return {"raw": gget("org.gnome.desktop.interface", "gtk-theme"), "capsule": "high" if high else "normal"}
    if map_name == "nmcliBool":
        on = raw is True
        return {"raw": str(raw), "capsule": "on" if on else "off"}
    if map_name == "colorScheme":
        scheme = strip_gvariant(raw).lower()
        return {"raw": raw, "capsule": "light" if "light" in scheme else "dark"}
    if map_name == "accentColor":
        return {"raw": raw, "capsule": strip_gvariant(raw)}
    if map_name == "soundTheme":
        theme = strip_gvariant(raw)
        capsule = "Ding" if theme in {"freedesktop", "default", "gnome"} else theme
        return {"raw": raw, "capsule": capsule}
    if map_name == "textScalingPercent":
        try:
            factor = float(raw)
            pct = int(round(factor * 100))
            return {"raw": raw, "capsule": f"{pct} %"}
        except ValueError:
            return {"raw": raw, "capsule": None}
    if map_name == "fontScalePercent":
        try:
            factor = float(raw)
            pct = int(round(factor * 100))
            allowed = "125" if pct >= 125 else ("110" if pct >= 110 else "100")
            return {"raw": raw, "capsule": allowed}
        except ValueError:
            return {"raw": raw, "capsule": "100"}
    if map_name == "pointerSpeedPercent":
        try:
            speed = float(raw)
            pct = int(round((speed + 1.0) * 50))
            pct = max(0, min(100, pct))
            return {"raw": raw, "capsule": str(pct)}
        except ValueError:
            return {"raw": raw, "capsule": "50"}
    if map_name == "keyboardDelayMs":
        sec = parse_uint32(raw)
        return {"raw": raw, "capsule": f"{sec} ms" if sec else None}
    if map_name == "lockDelayFr":
        sec = parse_uint32(raw)
        if sec == 0:
            return {"raw": raw, "capsule": "Immédiatement"}
        if sec <= 60:
            return {"raw": raw, "capsule": "1 minute"}
        return {"raw": raw, "capsule": "5 minutes"}
    if map_name == "powerDimTimeout":
        try:
            sec = int(raw)
        except ValueError:
            return {"raw": raw, "capsule": None}
        mapping = {300: "5 minutes", 600: "10 minutes", 900: "15 minutes", 0: "Jamais"}
        return {"raw": raw, "capsule": mapping.get(sec, f"{sec}s")}
    if map_name == "powerSleepType":
        val = strip_gvariant(raw)
        mapping = {"suspend": "30 minutes", "hibernate": "1 heure", "nothing": "Jamais"}
        return {"raw": raw, "capsule": mapping.get(val, val)}
    if map_name == "keyboardLayoutFr":
        if "fr" in raw.lower():
            return {"raw": raw, "capsule": "Français"}
        if "bepo" in raw.lower():
            return {"raw": raw, "capsule": "Français (BÉPO)"}
        return {"raw": raw, "capsule": "English (US)"}
    if map_name == "searchProvidersInverted":
        disabled = raw.strip() == "[]" or raw.strip() == "@as []"
        return {"raw": raw, "capsule": "on" if disabled else "off", "note": "heuristique historique"}
    if map_name == "powerProfile":
        return {"raw": raw, "capsule": power_profile() or None}
    if map_name == "wallpaperUri":
        return {"raw": raw, "capsule": strip_gvariant(raw)}
    return {"raw": raw, "capsule": None}


def compare_control(control, gsettings_snapshot, panel_id=None):
    source = control.get("source")
    if source == "nmcli-wifi":
        state = nmcli_wifi_on()
        if state is None:
            return {"id": control["id"], "capsuleKey": control.get("capsuleKey"), "status": "unmapped", "note": "nmcli indisponible"}
        mapped = map_value("nmcliBool", state)
        return {"id": control["id"], "capsuleKey": control.get("capsuleKey"), "vmRaw": mapped["raw"], "capsuleExpected": mapped["capsule"], "status": "mapped", "source": "nmcli"}
    if source == "nmcli-bluetooth":
        state = nmcli_bluetooth_on()
        if state is None:
            return {"id": control["id"], "capsuleKey": control.get("capsuleKey"), "status": "unmapped", "note": "rfkill indisponible"}
        mapped = map_value("nmcliBool", state)
        return {"id": control["id"], "capsuleKey": control.get("capsuleKey"), "vmRaw": mapped["raw"], "capsuleExpected": mapped["capsule"], "status": "mapped", "source": "rfkill"}
    if source == "powerprofilesctl":
        profile = power_profile()
        return {
            "id": control["id"],
            "capsuleKey": control.get("capsuleKey"),
            "vmRaw": profile or None,
            "capsuleExpected": profile or "Équilibré",
            "status": "mapped" if profile else "partial",
            "source": "powerprofilesctl",
            "note": None if profile else "powerprofilesctl absent — défaut Capsule Équilibré",
        }
    if source in {"simulated", "shell-session", "provider"}:
        return {
            "id": control["id"],
            "capsuleKey": control.get("capsuleKey"),
            "status": "unmapped",
            "note": control.get("note") or source,
        }

    schema = control.get("schema")
    key = control.get("key")
    if not schema or not key:
        return {
            "id": control["id"],
            "status": "skipped",
            "note": "schéma absent",
        }

    raw = gsettings_snapshot.get(f"{schema}::{key}", gget(schema, key))
    mapped = map_value(control.get("map"), raw, control)
    return {
        "id": control["id"],
        "capsuleKey": control.get("capsuleKey"),
        "schema": schema,
        "key": key,
        "vmRaw": raw,
        "capsuleExpected": mapped.get("capsule"),
        "status": "mapped" if mapped.get("capsule") is not None else "partial",
        "note": mapped.get("note"),
    }


def tour_panel(panel):
    pairs = [tuple(p) for p in panel.get("gsettings", [])]
    before = snapshot_pairs(pairs)
    launched_argv, running = launch_panel(panel.get("gccArgv", [panel["id"]]))
    after = snapshot_pairs(pairs)
    win = window_matches(panel.get("titleHints", []))

    controls = [compare_control(c, after, panel.get("id")) for c in panel.get("controls", [])]

    stable = before == after
    return {
        "id": panel["id"],
        "capsulePanel": panel.get("capsulePanel"),
        "label": panel.get("label"),
        "gccArgvLaunched": launched_argv,
        "gccRunning": running,
        "windowDetected": bool(win),
        "windowTitle": win["title"] if win else None,
        "gsettingsStable": stable,
        "gsettingsBefore": before,
        "gsettingsAfter": after,
        "controls": controls,
        "openedAt": datetime.now(timezone.utc).isoformat(),
    }


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def uri_to_local_path(uri):
    if not uri:
        return ""
    raw = uri.strip().strip("'\"")
    if raw.startswith("file://"):
        return raw[7:]
    return raw


def collect_asset_sources():
    if not os.path.isfile(ASSETS_MATRIX_PATH):
        return {"status": "matrix_missing", "path": ASSETS_MATRIX_PATH}
    with open(ASSETS_MATRIX_PATH, encoding="utf-8") as fh:
        assets_matrix = json.load(fh)
    rows = []
    missing_vm = 0
    for asset in assets_matrix.get("assets", []):
        primary = asset.get("vmPath")
        fallback = asset.get("vmPathFallback")
        vm_path = primary if primary and os.path.isfile(primary) else (
            fallback if fallback and os.path.isfile(fallback) else (primary or fallback or "")
        )
        exists = bool(vm_path and os.path.isfile(vm_path))
        row = {
            "id": asset.get("id"),
            "controlId": asset.get("controlId"),
            "vmPath": vm_path,
            "capsulePath": asset.get("capsulePath"),
            "existsOnVm": exists,
            "sizeBytes": None,
            "sha256": None,
        }
        if exists:
            row["sizeBytes"] = os.stat(vm_path).st_size
            try:
                row["sha256"] = sha256_file(vm_path)
            except OSError:
                pass
        else:
            missing_vm += 1
        rows.append(row)
    gsettings_sources = {}
    for src in assets_matrix.get("gsettingsSources", []):
        raw = gget(src.get("schema"), src.get("key"))
        local = uri_to_local_path(raw)
        gsettings_sources[src["id"]] = {
            "raw": raw,
            "localPath": local,
            "existsOnVm": bool(local and os.path.isfile(local)),
        }
    return {
        "status": "ok",
        "matrixPath": ASSETS_MATRIX_PATH,
        "summary": {
            "assetsTotal": len(rows),
            "presentOnVm": len(rows) - missing_vm,
            "missingOnVm": missing_vm,
        },
        "gsettingsSources": gsettings_sources,
        "assets": rows,
    }


results = []
errors = []
asset_sources = collect_asset_sources()
try:
    for panel in PANELS:
        if PANEL_FILTER and panel["id"] != PANEL_FILTER:
            continue
        try:
            results.append(tour_panel(panel))
        except Exception as exc:
            errors.append({"panel": panel["id"], "error": str(exc)})
finally:
    close_settings()

mapped = sum(
    1 for p in results for c in p.get("controls", [])
    if c.get("status") == "mapped"
)
unmapped = sum(
    1 for p in results for c in p.get("controls", [])
    if c.get("status") == "unmapped"
)
opened = sum(1 for p in results if p.get("gccRunning"))

out = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "source": "vm-gnome-settings-playbook.sh",
    "matrixVersion": MATRIX.get("version"),
    "matrixPath": MATRIX_PATH,
    "dwellMs": DWELL_MS,
    "panelFilter": PANEL_FILTER or None,
    "summary": {
        "panelsTotal": len(results),
        "panelsOpened": opened,
        "controlsMapped": mapped,
        "controlsUnmapped": unmapped,
        "errors": len(errors),
        "assetsPresentOnVm": asset_sources.get("summary", {}).get("presentOnVm"),
        "assetsMissingOnVm": asset_sources.get("summary", {}).get("missingOnVm"),
    },
    "assetSources": asset_sources,
    "panels": results,
    "errors": errors,
}

print(json.dumps(out, indent=2, ensure_ascii=False))
PY
