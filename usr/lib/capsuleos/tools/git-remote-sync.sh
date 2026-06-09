#!/usr/bin/env bash
# Synchronisation Git ↔ remote CapsuleOS (pull ff-only, push avec sync vues).
# Usage :
#   bash usr/lib/capsuleos/tools/git-remote-sync.sh pull [remote]
#   bash usr/lib/capsuleos/tools/git-remote-sync.sh push [remote] [branch]
#   bash usr/lib/capsuleos/tools/git-remote-sync.sh sync [remote] [branch]
#
# Variables :
#   CAPSULE_SKIP_AUTO_REMOTE_SYNC=1  — désactive push auto (post-commit)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

if [ ! -d .git ]; then
  echo "git-remote-sync : pas de dépôt Git" >&2
  exit 1
fi

REMOTE="${2:-origin}"
BRANCH="${3:-$(git branch --show-current)}"
MODE="${1:-}"

remote_exists() {
  git remote get-url "$REMOTE" >/dev/null 2>&1
}

has_upstream() {
  git rev-parse --abbrev-ref "@{u}" >/dev/null 2>&1
}

do_pull() {
  if ! remote_exists; then
    echo "git-remote-sync pull : remote '$REMOTE' absent — ignoré"
    return 0
  fi
  echo "git-remote-sync pull : fetch $REMOTE…"
  git fetch "$REMOTE" --prune
  if ! has_upstream; then
    echo "git-remote-sync pull : branche '$BRANCH' sans upstream — ignoré"
    return 0
  fi
  behind="$(git rev-list --count HEAD.."@{u}" 2>/dev/null || echo 0)"
  if [ "${behind:-0}" -eq 0 ]; then
    echo "✓ git-remote-sync pull : déjà à jour ($BRANCH)"
    return 0
  fi
  echo "git-remote-sync pull : $behind commit(s) en retard — git pull --ff-only…"
  git pull --ff-only "$REMOTE" "$BRANCH"
  echo "✓ git-remote-sync pull : à jour"
}

do_push() {
  if [ "${CAPSULE_SKIP_AUTO_REMOTE_SYNC:-0}" = "1" ]; then
    echo "git-remote-sync push : CAPSULE_SKIP_AUTO_REMOTE_SYNC=1 — ignoré"
    return 0
  fi
  if ! remote_exists; then
    echo "git-remote-sync push : remote '$REMOTE' absent — ignoré"
    return 0
  fi
  bash "$ROOT/usr/lib/capsuleos/tools/push-with-view-sync.sh" "$REMOTE" "$BRANCH"
}

case "$MODE" in
  pull)
    do_pull
    ;;
  push)
    do_push
    ;;
  sync)
    do_pull
    do_push
    ;;
  *)
    echo "Usage : git-remote-sync.sh {pull|push|sync} [remote] [branch]" >&2
    exit 1
    ;;
esac
