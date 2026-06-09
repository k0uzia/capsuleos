#!/usr/bin/env bash
# Synchronise la branche courante avec N0r3f/CapsuleOS (remote n0r3f ou upstream).
# Usage :
#   bash root/tools/sync-upstream-n0r3f.sh           # fetch + merge si retard
#   bash root/tools/sync-upstream-n0r3f.sh --dry-run
#   bash root/tools/sync-upstream-n0r3f.sh --fetch-only
#
# Cron / systemd (ex. toutes les 6 h) :
#   0 */6 * * * cd /chemin/CapsuleOS && bash root/tools/sync-upstream-n0r3f.sh >> /tmp/capsuleos-sync.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

UPSTREAM_URL="${CAPSULEOS_UPSTREAM_URL:-https://github.com/N0r3f/CapsuleOS.git}"
UPSTREAM_BRANCH="${CAPSULEOS_UPSTREAM_BRANCH:-main}"
DRY_RUN=0
FETCH_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --fetch-only) FETCH_ONLY=1 ;;
    --merge)
      echo "⚠ --merge est obsolète (merge automatique par défaut). Utilisez --fetch-only pour fetch seul." >&2
      ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      echo "Option inconnue : $arg" >&2
      exit 2
      ;;
  esac
done

resolve_remote() {
  if git remote get-url n0r3f >/dev/null 2>&1; then
    echo n0r3f
    return
  fi
  if git remote get-url upstream >/dev/null 2>&1; then
    echo upstream
    return
  fi
  git remote add n0r3f "$UPSTREAM_URL"
  echo n0r3f
}

REMOTE="$(resolve_remote)"
REF="${REMOTE}/${UPSTREAM_BRANCH}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✗ Copie de travail non propre — committez ou stash avant sync." >&2
  git status --short
  exit 1
fi

echo "→ fetch $REMOTE ($UPSTREAM_URL)…"
git fetch "$REMOTE" "$UPSTREAM_BRANCH"

BEHIND="$(git rev-list --count "HEAD..${REF}" 2>/dev/null || echo 0)"
AHEAD="$(git rev-list --count "${REF}..HEAD" 2>/dev/null || echo 0)"

echo "  retard sur upstream : $BEHIND commit(s)"
echo "  avance locale       : $AHEAD commit(s)"

if [ "$BEHIND" -eq 0 ]; then
  echo "✓ Déjà à jour avec ${REF}."
  exit 0
fi

if [ "$FETCH_ONLY" -eq 1 ]; then
  echo "→ Nouveaux commits disponibles (mode --fetch-only)."
  git log --oneline "HEAD..${REF}" | head -10
  exit 10
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "→ Mode dry-run — commits à merger :"
  git log --oneline "HEAD..${REF}" | head -20
  exit 0
fi

MSG="Merge remote ${REMOTE}/${UPSTREAM_BRANCH} (N0r3f/CapsuleOS) — sync automatique $(date -u +%Y-%m-%dT%H:%MZ)."

echo "→ merge ${REF}…"
if git merge "$REF" -m "$MSG"; then
  echo "✓ Merge réussi."
  if git diff --name-only HEAD~1 HEAD | grep -qE 'home/public/|usr/share/capsuleos/linux/apps/|var/lib/capsuleos/generated/'; then
    echo "→ Régénération embed (templates modifiés)…"
    node usr/lib/capsuleos/tools/generate-public-manifest.mjs
    node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
    if ! git diff --quiet; then
      echo "⚠ Embed régénéré — pensez à committer les fichiers générés."
      git diff --stat
    fi
  fi
  exit 0
fi

echo ""
echo "✗ Conflits de merge — résolution manuelle requise."
echo "  git status"
echo "  # après résolution : git add … && git commit"
echo "  # ou annuler : git merge --abort"
exit 1
