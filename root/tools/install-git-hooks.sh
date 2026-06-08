#!/usr/bin/env bash
# Installe les hooks Git du dépôt (pre-push : sync vues avant push).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOK_SRC="$ROOT/.githooks/pre-push"
HOOK_DST="$ROOT/.git/hooks/pre-push"

if [ ! -d "$ROOT/.git" ]; then
  echo "Erreur : pas de dépôt Git à $ROOT" >&2
  exit 1
fi

mkdir -p "$ROOT/.git/hooks"
cp "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST"
echo "✓ Hook pre-push installé → $HOOK_DST"
echo "  Avant chaque push : node usr/lib/capsuleos/tools/sync-all-views.mjs"
