#!/usr/bin/env bash
# Playbook interaction VM — ouvre gnome-control-center, bascule chaque contrôle gsettings/nmcli,
# vérifie le changement en temps réel (gsettings monitor), restaure la valeur initiale.
#
# Usage VM :
#   DISPLAY=:0 bash root/tools/lab/vm-gnome-settings-interaction-playbook.sh
#   DISPLAY=:0 bash root/tools/lab/vm-gnome-settings-interaction-playbook.sh --panel multitasking
#
# Depuis l'hôte :
#   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-interaction.mjs --id linux-rocky
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
PANEL_FILTER=""
if [[ "${1:-}" == "--panel" && -n "${2:-}" ]]; then
  PANEL_FILTER="$2"
fi

if [[ ! -f "$MATRIX_PATH" ]]; then
  echo "{\"error\":\"matrix_missing\",\"path\":\"$MATRIX_PATH\"}" >&2
  exit 1
fi

export CAPSULE_SETTINGS_MATRIX="$MATRIX_PATH"
export CAPSULE_SETTINGS_DWELL_MS="${CAPSULE_SETTINGS_DWELL_MS:-900}"
export CAPSULE_SETTINGS_PANEL_FILTER="${PANEL_FILTER}"
export CAPSULE_SETTINGS_MONITOR_MS="${CAPSULE_SETTINGS_MONITOR_MS:-1200}"

python3 <<'PY'
import json
import os
import re
import subprocess
import threading
import time
from datetime import datetime, timezone

MATRIX_PATH = os.environ["CAPSULE_SETTINGS_MATRIX"]
DWELL_MS = int(os.environ.get("CAPSULE_SETTINGS_DWELL_MS", "900"))
MONITOR_MS = int(os.environ.get("CAPSULE_SETTINGS_MONITOR_MS", "1200"))
PANEL_FILTER = os.environ.get("CAPSULE_SETTINGS_PANEL_FILTER", "").strip()

with open(MATRIX_PATH, encoding="utf-8") as f:
    MATRIX = json.load(f)

PANELS = MATRIX.get("panels", [])


def run(cmd, timeout=20):
    try:
        return subprocess.check_output(
            cmd, shell=isinstance(cmd, str), stderr=subprocess.DEVNULL, text=True, timeout=timeout,
        ).strip()
    except Exception:
        return ""


def gget(schema, key):
    try:
        return subprocess.check_output(
            ["gsettings", "get", schema, key], stderr=subprocess.DEVNULL, text=True,
        ).strip()
    except Exception:
        return ""


def gset(schema, key, value):
    args = ["gsettings", "set", schema, key]
    raw = (value or "").strip()
    if raw.startswith("uint32 "):
        args.append(raw)
    elif raw in {"true", "false"}:
        args.append(raw)
    elif raw.startswith("'") and raw.endswith("'"):
        args.append(raw)
    elif raw.startswith("["):
        args.append(raw)
    else:
        args.append(raw)
    try:
        subprocess.check_call(args, stderr=subprocess.DEVNULL)
        return True
    except Exception:
        return False


def close_settings():
    subprocess.run(["pkill", "-f", "gnome-control-center"], stderr=subprocess.DEVNULL)
    time.sleep(0.3)


def gcc_running():
    try:
        out = subprocess.check_output(["pgrep", "-af", "gnome-control-center"], stderr=subprocess.DEVNULL, text=True)
        for line in out.splitlines():
            if "gnome-control-center" in line and "vm-gnome-settings-interaction" not in line:
                return True
        return False
    except Exception:
        return False


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
            time.sleep(0.1)
        if chosen:
            break
    if chosen:
        time.sleep(0.25)
    return chosen, gcc_running()


def alternate_gsettings(schema, key, current):
    cur = (current or "").strip()
    if schema == "org.gnome.settings-daemon.plugins.power" and key == "sleep-inactive-ac-timeout":
        try:
            sec = int(cur)
            return str(600 if sec >= 900 else 900)
        except ValueError:
            return cur
    if cur in {"true", "false"}:
        return "false" if cur == "true" else "true"
    if cur.startswith("'") and cur.endswith("'"):
        inner = cur[1:-1]
        pairs = {
            "prefer-dark": "'prefer-light'",
            "prefer-light": "'prefer-dark'",
            "blue": "'teal'",
            "teal": "'blue'",
            "freedesktop": "'default'",
            "default": "'freedesktop'",
            "enabled": "'disabled'",
            "disabled": "'enabled'",
            "suspend": "'nothing'",
            "nothing": "'suspend'",
        }
        if inner in pairs:
            return pairs[inner]
        return f"'{inner}-alt'" if inner else cur
    if cur.startswith("uint32 "):
        n = int(re.sub(r"[^\d]", "", cur) or "0")
        alt = 250 if n >= 500 else 500
        return f"uint32 {alt}"
    if re.match(r"^-?\d+(\.\d+)?$", cur):
        try:
            num = float(cur)
            return str(round(num + 0.25, 2)) if num < 0.5 else str(round(num - 0.25, 2))
        except ValueError:
            return cur
    return cur


class MonitorWatcher:
    def __init__(self, schema, key):
        self.schema = schema
        self.key = key
        self.events = []
        self.proc = None
        self.thread = None

    def start(self):
        self.proc = subprocess.Popen(
            ["gsettings", "monitor", self.schema, self.key],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )

        def read_loop():
            if not self.proc.stdout:
                return
            deadline = time.time() + (MONITOR_MS / 1000.0)
            while time.time() < deadline:
                line = self.proc.stdout.readline()
                if not line:
                    break
                self.events.append(line.strip())

        self.thread = threading.Thread(target=read_loop, daemon=True)
        self.thread.start()

    def stop(self):
        if self.proc and self.proc.poll() is None:
            self.proc.terminate()
            try:
                self.proc.wait(timeout=1)
            except Exception:
                self.proc.kill()
        if self.thread:
            self.thread.join(timeout=1)


def nmcli_wifi_hw_available():
    raw = run("nmcli -t radio 2>/dev/null")
    parts = raw.split(":") if raw else []
    if not parts:
        return False
    return parts[0].strip().lower() not in {"missing", "unavailable", "unavailable (managed)"}


def nmcli_wifi_on():
    raw = run("nmcli -t radio 2>/dev/null")
    parts = raw.split(":") if raw else []
    if len(parts) >= 2:
        return parts[1].strip().lower() in {"enabled", "activé", "yes", "on", "true", "1"}
    return None


def nmcli_bluetooth_on():
    raw = run("rfkill list bluetooth 2>/dev/null")
    if not raw:
        return None
    return not ("Soft blocked: yes" in raw or "Hard blocked: yes" in raw)


def interact_nmcli_wifi():
    if not nmcli_wifi_hw_available():
        return {"status": "skipped", "note": "Wi-Fi HW absent (VM sans carte)"}
    before = nmcli_wifi_on()
    if before is None:
        return {"status": "skipped", "note": "nmcli indisponible"}
    launch_panel(["wifi"])
    subprocess.call(["nmcli", "radio", "wifi", "off" if before else "on"], stderr=subprocess.DEVNULL)
    time.sleep(0.6)
    mid = nmcli_wifi_on()
    subprocess.call(["nmcli", "radio", "wifi", "on" if before else "off"], stderr=subprocess.DEVNULL)
    time.sleep(0.4)
    after = nmcli_wifi_on()
    ok = mid != before and after == before
    return {
        "status": "ok" if ok else "failed",
        "before": before,
        "mid": mid,
        "afterRestore": after,
        "toggledTo": not before,
    }


def interact_nmcli_bluetooth():
    before = nmcli_bluetooth_on()
    if before is None:
        return {"status": "skipped", "note": "rfkill indisponible"}
    launch_panel(["bluetooth"])
    subprocess.call(
        ["rfkill", "block" if before else "unblock", "bluetooth"],
        stderr=subprocess.DEVNULL,
    )
    time.sleep(0.6)
    mid = nmcli_bluetooth_on()
    subprocess.call(
        ["rfkill", "unblock" if before else "block", "bluetooth"],
        stderr=subprocess.DEVNULL,
    )
    time.sleep(0.4)
    after = nmcli_bluetooth_on()
    ok = mid != before and after == before
    return {
        "status": "ok" if ok else "failed",
        "before": before,
        "mid": mid,
        "afterRestore": after,
        "toggledTo": not before,
    }


SKIP_IDS = {"wallpaper", "volume", "sound-output", "sound-input", "network-identity", "dnd"}


def interact_gsettings_control(panel, control):
    cid = control["id"]
    if cid in SKIP_IDS:
        return {"status": "skipped", "note": "non destructif / simulé"}
    source = control.get("source")
    if source == "nmcli-wifi":
        return interact_nmcli_wifi()
    if source == "nmcli-bluetooth":
        return interact_nmcli_bluetooth()
    if source in {"simulated", "shell-session", "provider", "powerprofilesctl"}:
        return {"status": "skipped", "note": source}

    schema = control.get("schema")
    key = control.get("key")
    if not schema or not key:
        return {"status": "skipped", "note": "sans schéma gsettings"}

    before = gget(schema, key)
    alt = alternate_gsettings(schema, key, before)
    if alt == before:
        return {"status": "skipped", "note": "pas d'alternance sûre", "before": before}

    launch_panel(panel.get("gccArgv", [panel["id"]]))
    watcher = MonitorWatcher(schema, key)
    watcher.start()
    time.sleep(0.15)
    set_ok = gset(schema, key, alt)
    time.sleep(0.45)
    mid = gget(schema, key)
    watcher.stop()
    monitor_hit = len(watcher.events) > 0
    gset(schema, key, before)
    time.sleep(0.35)
    restored = gget(schema, key)

    changed = set_ok and mid != before
    restored_ok = restored == before
    status = "ok" if changed and restored_ok else ("partial" if changed else "failed")

    return {
        "status": status,
        "schema": schema,
        "key": key,
        "before": before,
        "toggledTo": alt,
        "afterToggle": mid,
        "monitorEvent": monitor_hit,
        "monitorLines": watcher.events[:3],
        "restored": restored,
        "restoredOk": restored_ok,
    }


results = []
errors = []
summary = {"ok": 0, "partial": 0, "failed": 0, "skipped": 0}

try:
    for panel in PANELS:
        if PANEL_FILTER and panel["id"] != PANEL_FILTER:
            continue
        panel_entry = {
            "id": panel["id"],
            "label": panel.get("label"),
            "interactions": [],
        }
        for control in panel.get("controls", []):
            try:
                outcome = interact_gsettings_control(panel, control)
                outcome["controlId"] = control["id"]
                outcome["capsuleKey"] = control.get("capsuleKey")
                panel_entry["interactions"].append(outcome)
                st = outcome.get("status", "failed")
                if st in summary:
                    summary[st] += 1
                else:
                    summary["failed"] += 1
            except Exception as exc:
                summary["failed"] += 1
                panel_entry["interactions"].append({
                    "controlId": control["id"],
                    "status": "failed",
                    "error": str(exc),
                })
                errors.append({"panel": panel["id"], "control": control["id"], "error": str(exc)})
            close_settings()
        results.append(panel_entry)
finally:
    close_settings()

out = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "source": "vm-gnome-settings-interaction-playbook.sh",
    "matrixPath": MATRIX_PATH,
    "dwellMs": DWELL_MS,
    "monitorMs": MONITOR_MS,
    "panelFilter": PANEL_FILTER or None,
    "summary": summary,
    "panels": results,
    "errors": errors,
}

print(json.dumps(out, indent=2, ensure_ascii=False))
PY
