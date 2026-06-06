#!/usr/bin/env bash
# Enquête visuelle VM — lot P0 Paramètres GNOME (captures + transitions).
#
# Usage VM :
#   CAPSULE_VISUAL_OUT=/tmp/capsule-visual bash root/tools/lab/vm-gnome-settings-visual-investigation.sh
#
# Depuis l'hôte :
#   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-visual-investigation.mjs --id linux-rocky
set -uo pipefail

export DISPLAY="${DISPLAY:-:0}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export XDG_CURRENT_DESKTOP="${XDG_CURRENT_DESKTOP:-GNOME}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MATRIX_PATH="${CAPSULE_VISUAL_MATRIX:-$SCRIPT_DIR/gnome-settings-visual-investigation-matrix.json}"
OUT_DIR="${CAPSULE_VISUAL_OUT:-/tmp/capsuleos-visual-investigation}"
FILTER="${CAPSULE_VISUAL_FILTER:-P0}"

mkdir -p "$OUT_DIR"

export CAPSULE_VISUAL_MATRIX="$MATRIX_PATH"
export CAPSULE_VISUAL_OUT="$OUT_DIR"
export CAPSULE_VISUAL_FILTER="$FILTER"

python3 <<'PY'
import json
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

MATRIX_PATH = os.environ["CAPSULE_VISUAL_MATRIX"]
OUT_DIR = Path(os.environ["CAPSULE_VISUAL_OUT"])
FILTER = os.environ.get("CAPSULE_VISUAL_FILTER", "P0")

with open(MATRIX_PATH, encoding="utf-8") as f:
    MATRIX = json.load(f)

def run(cmd, timeout=30):
    try:
        return subprocess.check_output(cmd, shell=isinstance(cmd, str), stderr=subprocess.DEVNULL, text=True, timeout=timeout).strip()
    except Exception:
        return ""


def gget(schema, key):
    try:
        return subprocess.check_output(["gsettings", "get", schema, key], stderr=subprocess.DEVNULL, text=True).strip()
    except Exception:
        return ""


def gset(schema, key, value):
    subprocess.run(["gsettings", "set", schema, key, value], check=False, stderr=subprocess.DEVNULL)


def shell_screenshot_status(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        res = subprocess.run(
            [
                "gdbus", "call", "--session",
                "--dest", "org.gnome.Shell.Screenshot",
                "--object-path", "/org/gnome/Shell/Screenshot",
                "--method", "org.gnome.Shell.Screenshot.Screenshot",
                "false", "false", str(path),
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if res.returncode == 0 and path.is_file() and path.stat().st_size > 0:
            return "ok"
        if "AccessDenied" in (res.stderr or "") or "not allowed" in (res.stderr or "").lower():
            return "access-denied"
    except Exception:
        pass
    return "failed"


def probe_screenshot_backend():
    """Rocky Linux 10 : Shell.Screenshot D-Bus (session locale) ou virsh hôte si SSH refusé."""
    probe = OUT_DIR / "_screenshot-probe.png"
    probe.parent.mkdir(parents=True, exist_ok=True)
    status = shell_screenshot_status(probe)
    if status == "ok":
        try:
            probe.unlink()
        except OSError:
            pass
        return "org.gnome.Shell.Screenshot"
    if status == "access-denied":
        # GNOME 47+ bloque souvent les captures D-Bus depuis SSH — repli virsh (hôte lab)
        return "host-virsh"
    if subprocess.call(["which", "gnome-screenshot"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
        return "gnome-screenshot"
    return None


SCREENSHOT_BACKEND = probe_screenshot_backend()
HAS_SCREENSHOT = SCREENSHOT_BACKEND in {"org.gnome.Shell.Screenshot", "gnome-screenshot"}


def shell_screenshot(path):
    return shell_screenshot_status(path) == "ok"


def screenshot(name):
    if not HAS_SCREENSHOT:
        return None
    path = OUT_DIR / name
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        if SCREENSHOT_BACKEND == "org.gnome.Shell.Screenshot":
            if not shell_screenshot(path):
                return None
        else:
            subprocess.run(
                ["gnome-screenshot", "-f", str(path)],
                check=True,
                timeout=15,
                stderr=subprocess.DEVNULL,
            )
        return str(path) if path.is_file() and path.stat().st_size > 0 else None
    except Exception:
        return None


def parse_bool(raw):
    return raw.strip().lower() in {"true", "'true'"}


def toggle_bool(schema, key):
    cur = gget(schema, key)
    nxt = "false" if parse_bool(cur) else "true"
    gset(schema, key, nxt)
    return cur, nxt


def toggle_color_scheme():
    cur = gget("org.gnome.desktop.interface", "color-scheme").strip("'")
    order = ["prefer-dark", "prefer-light", "default"]
    try:
        idx = order.index(cur)
        nxt = order[(idx + 1) % len(order)]
    except ValueError:
        nxt = "prefer-light" if cur != "prefer-light" else "prefer-dark"
    gset("org.gnome.desktop.interface", "color-scheme", nxt)
    return cur, nxt


def toggle_dynamic_workspaces():
    cur = gget("org.gnome.mutter", "dynamic-workspaces")
    nxt = "false" if parse_bool(cur) else "true"
    gset("org.gnome.mutter", "dynamic-workspaces", nxt)
    return cur, nxt


def toggle_dnd_shell():
    """DND GNOME Shell — pas de clé gsettings unique RL10 ; Eval shell."""
    script = (
        "const qs = Main.panel.statusArea.quickSettings;"
        "if (!qs || !qs._dndToggle) { 'missing'; }"
        "else { qs._dndToggle.toggle(); 'toggled'; }"
    )
    raw = run(
        "gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell "
        f"--method org.gnome.Shell.Eval \"{script}\""
    )
    return raw or "shell-eval-failed", "toggled"


HANDLERS = {
    "theme": {
        "toggle": toggle_color_scheme,
        "restore": lambda before: gset("org.gnome.desktop.interface", "color-scheme", before.strip("'")),
        "transition_ms": 300,
    },
    "night-light": {
        "toggle": lambda: toggle_bool("org.gnome.settings-daemon.plugins.color", "night-light-enabled"),
        "restore": lambda before: gset("org.gnome.settings-daemon.plugins.color", "night-light-enabled", before),
        "transition_ms": 1000,
    },
    "dynamic-workspaces": {
        "toggle": toggle_dynamic_workspaces,
        "restore": lambda before: gset("org.gnome.mutter", "dynamic-workspaces", before),
        "transition_ms": 350,
    },
    "dnd": {
        "toggle": toggle_dnd_shell,
        "restore": lambda before: None,
        "transition_ms": 200,
        "note": "Restauration manuelle QS si besoin — pas de clé gsettings VM",
    },
}

results = []
for inv in MATRIX.get("investigations", []):
    if FILTER == "P0" and inv.get("parityPriority") != "P0":
        continue
    cid = inv.get("controlId")
    handler = HANDLERS.get(cid)
    if not handler:
        results.append({"controlId": cid, "status": "skipped", "note": "handler VM absent"})
        continue

    t0 = time.time()
    subdir = OUT_DIR / cid
    subdir.mkdir(parents=True, exist_ok=True)
    captures = []
    before_path = screenshot(f"{cid}/before.png")
    if before_path:
        captures.append({"phase": "before", "path": before_path, "timestamp": datetime.now(timezone.utc).isoformat()})

    before_val, after_val = handler["toggle"]()
    trans_ms = handler.get("transition_ms", 500)
    time.sleep(min(trans_ms / 1000 * 0.5, 0.5))
    during_path = screenshot(f"{cid}/during-{int(trans_ms/2)}ms.png")
    if during_path:
        captures.append({"phase": "during-transition", "path": during_path, "elapsedMs": int(trans_ms / 2)})

    time.sleep(max(trans_ms / 1000 - 0.5, 0.5))
    after_path = screenshot(f"{cid}/after.png")
    if after_path:
        captures.append({"phase": "after", "path": after_path, "elapsedMs": trans_ms})

    elapsed = int((time.time() - t0) * 1000)
    try:
        if handler.get("restore"):
            handler["restore"](before_val)
    except Exception:
        pass

    results.append({
        "controlId": cid,
        "label": inv.get("label"),
        "status": "documented",
        "vmToggle": {"before": before_val, "after": after_val},
        "transitionExpected": inv.get("transition"),
        "transitionObserved": {
            "durationMs": elapsed,
            "easing": inv.get("transition", {}).get("easing"),
            "properties": [inv.get("transition", {}).get("property")] if inv.get("transition", {}).get("property") else [],
            "notes": handler.get("note") or (
                f"capture via {SCREENSHOT_BACKEND}" if HAS_SCREENSHOT
                else "aucun backend capture (Shell.Screenshot D-Bus indisponible)"
            ),
        },
        "vmCaptures": captures,
        "surfaces": inv.get("surfaces"),
        "officialDocCrossCheck": [
            {
                **doc,
                "matchesObservation": None,
                "delta": None,
            }
            for doc in (inv.get("officialDocs") or [])
        ],
        "capsuleParity": {
            "datasetPresent": None,
            "cssHookPresent": None,
            "visualMatch": "unknown",
            "parityPriority": inv.get("parityPriority"),
            "gapNotes": None,
        },
    })

out = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "source": "vm-gnome-settings-visual-investigation.sh",
    "registry": MATRIX.get("registry"),
    "outputDir": str(OUT_DIR),
    "screenshotTool": HAS_SCREENSHOT,
    "screenshotBackend": SCREENSHOT_BACKEND,
    "captureStrategy": (
        "vm-dbus" if SCREENSHOT_BACKEND == "org.gnome.Shell.Screenshot"
        else "host-virsh" if SCREENSHOT_BACKEND == "host-virsh"
        else "vm-gnome-screenshot" if SCREENSHOT_BACKEND == "gnome-screenshot"
        else "none"
    ),
    "snapshotAppInstalled": subprocess.call(["which", "snapshot"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0,
    "filter": FILTER,
    "investigations": results,
}

print(json.dumps(out, indent=2, ensure_ascii=False))
PY
