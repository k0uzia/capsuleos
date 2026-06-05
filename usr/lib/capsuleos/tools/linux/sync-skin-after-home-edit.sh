#!/usr/bin/env bash
# À lancer après modification de home/<Vendor>/<Skin>/index.html (évite pick-os ≠ skin direct).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
cd "$ROOT"
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/linux/validate-linux-facades.mjs
echo "✓ Façades OS/linux/families/* régénérées depuis home/ — recharger pick-os."
