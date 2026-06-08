#!/usr/bin/env bash
# Centralise sur la VM les fichiers du playbook manifest (phase ManSt).
# Entrée : CAPSULE_PLAYBOOK_JSON (env) ou JSON sur stdin.
set -euo pipefail

REGISTRY_ID="${1:-${REGISTRY_ID:-linux-unknown}}"
STAGING_ROOT="${CAPSULE_STAGING_ROOT:-$HOME/capsuleos-lab/staging/$REGISTRY_ID}"

mkdir -p "$STAGING_ROOT"/{apps,wallpaper,panel,icons,fonts,mimetypes,emblems}

PLAYBOOK_SRC="${CAPSULE_PLAYBOOK_JSON:-}"
if [[ -z "$PLAYBOOK_SRC" && ! -t 0 ]]; then
  PLAYBOOK_SRC="$(cat)"
fi
if [[ -z "$PLAYBOOK_SRC" ]]; then
  PLAYBOOK_SRC='{"items":[]}'
fi

export STAGING_ROOT REGISTRY_ID CAPSULE_PLAYBOOK_JSON
python3 - <<'PY'
import json
import os
import shutil
import hashlib
from datetime import datetime, timezone

staging_root = os.environ["STAGING_ROOT"]
registry_id = os.environ["REGISTRY_ID"]
playbook = json.loads(os.environ.get("CAPSULE_PLAYBOOK_JSON") or '{"items":[]}')
items = [i for i in playbook.get("items", []) if i.get("action") in ("pull", "rewrite-ref")]

copied = []
errors = []

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]

for item in items:
    vm_path = item.get("vmPath")
    staging_rel = item.get("stagingPath")
    if not vm_path or not staging_rel:
        continue
    if not os.path.isfile(vm_path):
        errors.append({"id": item.get("id"), "vmPath": vm_path, "error": "absent"})
        continue
    dest = os.path.join(staging_root, staging_rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(vm_path, dest)
    copied.append({
        "id": item.get("id"),
        "category": item.get("category"),
        "vmPath": vm_path,
        "stagingPath": staging_rel,
        "size": os.path.getsize(dest),
        "sha256": sha256(dest),
        "capsuleRelative": item.get("capsuleRelative"),
    })

out = {
    "version": 1,
    "registryId": registry_id,
    "stagingRoot": staging_root,
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "itemCount": len(copied),
    "errorCount": len(errors),
    "files": copied,
    "errors": errors,
}
out_path = os.path.join(staging_root, "staging-manifest.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(json.dumps({"ok": True, "stagingRoot": staging_root, "copied": len(copied), "errors": len(errors)}))
PY
