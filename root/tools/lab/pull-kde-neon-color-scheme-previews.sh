#!/usr/bin/env bash
# Pull previews KCM Couleurs / Style Plasma — .colors VM → PNG générés.
#
# Usage : bash root/tools/lab/pull-kde-neon-color-scheme-previews.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
node "$ROOT/usr/lib/capsuleos/tools/lab/pull-kde-neon-color-scheme-previews.mjs" --write
echo "→ valider : node usr/lib/capsuleos/tools/validate-asset-zones.mjs"
