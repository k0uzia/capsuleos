#!/usr/bin/env bash
# Installe les hooks Git CapsuleOS (pre-push, post-commit).
#   pre-push     — sync vues + refuse push si embed/façades périmés
#   post-commit  — push auto via git-remote-sync.sh (sync vues + origin)
#
# Désactiver le push auto : export CAPSULE_SKIP_AUTO_REMOTE_SYNC=1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ ! -d "$ROOT/.git" ]; then
  echo "Erreur : pas de dépôt Git à $ROOT" >&2
  exit 1
fi

mkdir -p "$ROOT/.git/hooks"

for hook in pre-push post-commit; do
  src="$ROOT/.githooks/$hook"
  dst="$ROOT/.git/hooks/$hook"
  if [ ! -f "$src" ]; then
    echo "Erreur : $src manquant" >&2
    exit 1
  fi
  cp "$src" "$dst"
  chmod +x "$dst"
  echo "✓ Hook $hook → $dst"
done

chmod +x "$ROOT/usr/lib/capsuleos/tools/git-remote-sync.sh"
chmod +x "$ROOT/usr/lib/capsuleos/tools/push-with-view-sync.sh"

echo ""
echo "Synchronisation remote CapsuleOS :"
echo "  • post-commit → push auto (origin, branche courante)"
echo "  • pre-push    → sync-all-views + gate vues à jour"
echo "  • sessionStart Cursor → pull ff-only (si hooks.json actif)"
echo ""
echo "  Manuel : bash usr/lib/capsuleos/tools/git-remote-sync.sh sync"
echo "  Désactiver push auto : export CAPSULE_SKIP_AUTO_REMOTE_SYNC=1"
