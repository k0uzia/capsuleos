#!/usr/bin/env bash
# Pull theme-previews System Settings — preview.png originaux Plasma LookAndFeel (VM KDE Neon).
#
# Usage :
#   bash root/tools/lab/pull-kde-neon-settings-theme-previews.sh
#   bash root/tools/lab/pull-kde-neon-settings-theme-previews.sh --ssh capsule@192.168.124.6
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
MANIFEST="$ROOT/root/tools/lab/kde-neon-settings-theme-previews-manifest.json"
SSH_TARGET="${KDE_NEON_SSH:-capsule@192.168.124.6}"
IDENTITY="${KDE_NEON_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ssh) SSH_TARGET="$2"; shift 2 ;;
    *) echo "Option inconnue: $1" >&2; exit 1 ;;
  esac
done

SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")
DEST_REL="$(node -e "console.log(JSON.parse(require('fs').readFileSync('$MANIFEST','utf8')).destDir)")"
DEST="$ROOT/$DEST_REL"
mkdir -p "$DEST"

echo "=== Pull theme-previews KDE Neon ($SSH_TARGET) → $DEST_REL ==="

node "$ROOT/usr/lib/capsuleos/tools/lab/pull-kde-neon-settings-theme-previews.mjs" --write

echo "→ valider : node usr/lib/capsuleos/tools/validate-asset-zones.mjs"
