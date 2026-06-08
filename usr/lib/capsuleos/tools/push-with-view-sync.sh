#!/usr/bin/env bash
# Wrapper push : sync vues → commit auto si nécessaire → push.
# Usage : bash usr/lib/capsuleos/tools/push-with-view-sync.sh [remote] [branch]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

REMOTE="${1:-origin}"
BRANCH="${2:-$(git branch --show-current)}"

node usr/lib/capsuleos/tools/sync-all-views.mjs

if ! git diff --quiet --exit-code; then
  git add OS/linux var/lib/capsuleos/generated \
    home/public/.capsule-manifest.json home/public/.capsule-finder-manifest.json \
    OS/android/js/capsule-android-embed.js
  if ! git diff --cached --quiet --exit-code; then
    git commit -m "$(cat <<'EOF'
Sync vues pick-os et embed avant push.

EOF
)"
  fi
fi

git push "$REMOTE" "$BRANCH"
