#!/usr/bin/env bash
# Playbook interaction kconfig Paramètres KDE — lecture états VM (v15).
# Usage :
#   CAPSULE_KDE_REGISTRY=root/tools/lab/kde-settings-controls-registry.json bash vm-kde-settings-interaction-playbook.sh
set -uo pipefail
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR}/bus}"
if [[ -z "${XAUTHORITY:-}" ]]; then
  XAUTH_FILE=$(ls "${XDG_RUNTIME_DIR}"/xauth_* 2>/dev/null | head -1)
  [[ -n "$XAUTH_FILE" ]] && export XAUTHORITY="$XAUTH_FILE"
fi
export DISPLAY="${DISPLAY:-:1}"

REGISTRY="${CAPSULE_KDE_REGISTRY:-root/tools/lab/kde-settings-controls-registry.json}"

python3 <<PY
import json
import os
import subprocess
from datetime import datetime, timezone

registry_path = os.environ.get("CAPSULE_KDE_REGISTRY", "root/tools/lab/kde-settings-controls-registry.json")
with open(registry_path, encoding="utf-8") as f:
    registry = json.load(f)

def kread(file, group, key):
    try:
        return subprocess.check_output(
            ["kreadconfig6", "--file", file, "--group", group, "--key", key],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except Exception:
        return ""

interactions = []
for panel in registry.get("panels", []):
    for ctrl in panel.get("controls", []):
        if ctrl.get("priority") != "P0":
            continue
        kf = ctrl.get("kconfigFile", "")
        kg = ctrl.get("kconfigGroup", "")
        kk = ctrl.get("kconfigKey", "")
        val = kread(kf, kg, kk) if kf and kg and kk else ""
        interactions.append({
            "panelId": panel["id"],
            "controlId": ctrl["id"],
            "capsuleKey": ctrl.get("capsuleKey"),
            "kconfigFile": kf,
            "kconfigGroup": kg,
            "kconfigKey": kk,
            "vmValue": val,
            "type": ctrl.get("type"),
            "label": ctrl.get("label"),
        })

out = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "source": "vm-kde-settings-interaction-playbook.sh",
    "registryId": registry.get("registryId", "linux-kde-neon"),
    "interactionCount": len(interactions),
    "interactions": interactions,
}

print(json.dumps(out, indent=2, ensure_ascii=False))
PY
