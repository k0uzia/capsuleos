#!/usr/bin/env bash
# Pull icônes sidebar Paramètres KDE Neon — prédicats A/S/T.
#
# Usage :
#   bash root/tools/lab/pull-kde-neon-settings-sidebar-icons.sh
#   KDE_NEON_SSH=capsule@192.168.124.6 bash root/tools/lab/pull-kde-neon-settings-sidebar-icons.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
node "$ROOT/usr/lib/capsuleos/tools/lab/pull-kde-neon-settings-sidebar-icons.mjs" --write "$@"
echo "→ valider : node usr/lib/capsuleos/tools/validate-asset-zones.mjs"
