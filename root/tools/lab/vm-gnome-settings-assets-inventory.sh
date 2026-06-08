#!/usr/bin/env bash
# Inventaire sources assets VM — ground truth pour playbook Paramètres GNOME.
# Vérifie la présence sur la VM des fichiers listés dans gnome-settings-assets-matrix.json.
#
# Usage VM :
#   DISPLAY=:0 bash root/tools/lab/vm-gnome-settings-assets-inventory.sh
#
# Depuis l'hôte :
#   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-assets.mjs --id linux-rocky
set -uo pipefail

export DISPLAY="${DISPLAY:-:0}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export XDG_CURRENT_DESKTOP="${XDG_CURRENT_DESKTOP:-GNOME}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MATRIX_PATH="${CAPSULE_SETTINGS_ASSETS_MATRIX:-$SCRIPT_DIR/gnome-settings-assets-matrix.json}"

if [[ ! -f "$MATRIX_PATH" ]]; then
  echo "{\"error\":\"assets_matrix_missing\",\"path\":\"$MATRIX_PATH\"}" >&2
  exit 1
fi

export CAPSULE_SETTINGS_ASSETS_MATRIX="$MATRIX_PATH"

python3 <<'PY'
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

MATRIX_PATH = os.environ["CAPSULE_SETTINGS_ASSETS_MATRIX"]

with open(MATRIX_PATH, encoding="utf-8") as f:
    MATRIX = json.load(f)


def gget(schema, key):
    try:
        return subprocess.check_output(
            ["gsettings", "get", schema, key],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except Exception:
        return ""


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def resolve_vm_path(asset):
    primary = asset.get("vmPath")
    fallback = asset.get("vmPathFallback")
    if primary and os.path.isfile(primary):
        return primary
    if fallback and os.path.isfile(fallback):
        return fallback
    return primary or fallback or ""


def uri_to_local_path(uri):
    if not uri:
        return ""
    raw = uri.strip().strip("'\"")
    if raw.startswith("file://"):
        return raw[7:]
    return raw


assets_out = []
missing_vm = 0
present_vm = 0

for asset in MATRIX.get("assets", []):
    vm_path = resolve_vm_path(asset)
    exists = bool(vm_path and os.path.isfile(vm_path))
    entry = {
        "id": asset.get("id"),
        "category": asset.get("category"),
        "controlId": asset.get("controlId"),
        "vmPath": vm_path,
        "vmPathPrimary": asset.get("vmPath"),
        "vmPathFallback": asset.get("vmPathFallback"),
        "capsulePath": asset.get("capsulePath"),
        "transcodeFromVm": asset.get("transcodeFromVm"),
        "skipShaCompare": asset.get("skipShaCompare"),
        "optionalOnVm": asset.get("optionalOnVm"),
        "existsOnVm": exists,
        "sizeBytes": None,
        "sha256": None,
    }
    if exists:
        present_vm += 1
        st = os.stat(vm_path)
        entry["sizeBytes"] = st.st_size
        try:
            entry["sha256"] = sha256_file(vm_path)
        except OSError:
            entry["sha256"] = None
    else:
        missing_vm += 1
    assets_out.append(entry)

gsettings_out = {}
for src in MATRIX.get("gsettingsSources", []):
    raw = gget(src.get("schema"), src.get("key"))
    local = uri_to_local_path(raw)
    gsettings_out[src["id"]] = {
        "schema": src.get("schema"),
        "key": src.get("key"),
        "raw": raw,
        "localPath": local,
        "existsOnVm": bool(local and os.path.isfile(local)),
        "note": src.get("note"),
    }

out = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "source": "vm-gnome-settings-assets-inventory.sh",
    "registry": MATRIX.get("registry"),
    "vendor": MATRIX.get("vendor"),
    "matrixPath": MATRIX_PATH,
    "summary": {
        "assetsTotal": len(assets_out),
        "presentOnVm": present_vm,
        "missingOnVm": missing_vm,
        "gsettingsReadable": sum(1 for v in gsettings_out.values() if v.get("raw")),
    },
    "gsettingsSources": gsettings_out,
    "assets": assets_out,
}

print(json.dumps(out, indent=2, ensure_ascii=False))
PY
