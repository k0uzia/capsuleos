#!/usr/bin/env bash
# Pull icônes sidebar Discover KDE Neon (nav + catégories + recherche) — prédicats A/S/T.
#
# Usage :
#   bash root/tools/lab/vm-kde-neon-discover-sidebar-inventory.sh
#   KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/pull-kde-neon-discover-sidebar-icons.sh
#   bash root/tools/lab/pull-kde-neon-discover-sidebar-icons.sh --verify-only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SSH_TARGET="${KDE_NEON_SSH:-goupil@192.168.123.52}"
IDENTITY="${KDE_NEON_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
DEST_ROOT="$ROOT/usr/share/capsuleos/assets/images/vendors/neon/discover/sidebar"
INVENTORY="$ROOT/root/docs/inventaires/linux-kde-neon-discover-sidebar-icons.json"
SOURCE_VM="$ROOT/usr/share/capsuleos/assets/images/vendors/neon/SOURCE-VM.txt"
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --verify-only) VERIFY_ONLY=true; shift ;;
    --ssh) SSH_TARGET="$2"; shift 2 ;;
    *) echo "Option inconnue: $1" >&2; exit 1 ;;
  esac
done

SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")

if [[ ! -f "$INVENTORY" ]]; then
  echo "Inventaire absent — lancer vm-kde-neon-discover-sidebar-inventory.sh" >&2
  exit 1
fi

mapfile -t ENTRIES < <(python3 - "$INVENTORY" <<'PY'
import json, sys
inv = json.load(open(sys.argv[1]))
for i in inv.get("icons", []):
    print("|".join([
        i["role"],
        i["destFilename"],
        i["remotePath"],
        i["sha256"],
        i.get("cssClass", ""),
    ]))
PY
)

if [[ ${#ENTRIES[@]} -eq 0 ]]; then
  echo "Inventaire vide" >&2
  exit 1
fi

if [[ "$VERIFY_ONLY" == true ]]; then
  echo "=== Vérification SHA256 VM ↔ dépôt (discover sidebar) ==="
  fail=0
  for entry in "${ENTRIES[@]}"; do
    role="${entry%%|*}"
    rest="${entry#*|}"
    dest="${rest%%|*}"
    rest2="${rest#*|}"
    remote="${rest2%%|*}"
    expected="${rest2#*|}"
    expected="${expected%%|*}"
    local_file="$DEST_ROOT/$role/$dest"
    if [[ ! -f "$local_file" ]]; then
      echo "  ✗ manquant: sidebar/$role/$dest"
      fail=1
      continue
    fi
    remote_hash="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "sha256sum '$remote' 2>/dev/null" | awk '{print $1}')"
    local_hash="$(sha256sum "$local_file" | awk '{print $1}')"
    if [[ "$remote_hash" == "$local_hash" && "$local_hash" == "$expected" ]]; then
      echo "  ✓ sidebar/$role/$dest"
    else
      echo "  ✗ drift: sidebar/$role/$dest"
      fail=1
    fi
  done
  exit "$fail"
fi

echo "=== Pull icônes sidebar Discover — $SSH_TARGET → discover/sidebar/ ==="
mkdir -p "$DEST_ROOT/nav" "$DEST_ROOT/categories" "$DEST_ROOT/search" "$DEST_ROOT/ui"

# Retirer d'anciens pulls couleur (pré-symbolic)
if [[ -d "$DEST_ROOT/categories" ]]; then
  find "$DEST_ROOT/categories" -maxdepth 1 -type f -name '*.svg' ! -name '*-symbolic.svg' -delete 2>/dev/null || true
fi

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
PULLED=()

for entry in "${ENTRIES[@]}"; do
  role="${entry%%|*}"
  rest="${entry#*|}"
  dest="${rest%%|*}"
  rest2="${rest#*|}"
  remote="${rest2%%|*}"
  hash="${rest2#*|}"
  hash="${hash%%|*}"
  mkdir -p "$DEST_ROOT/$role"
  scp "${SSH_OPTS[@]}" "$SSH_TARGET:$remote" "$DEST_ROOT/$role/$dest"
  local_hash="$(sha256sum "$DEST_ROOT/$role/$dest" | awk '{print $1}')"
  if [[ "$local_hash" != "$hash" ]]; then
    echo "  ✗ hash mismatch après pull: $role/$dest" >&2
    exit 1
  fi
  size="$(wc -c < "$DEST_ROOT/$role/$dest" | tr -d ' ')"
  echo "  → sidebar/$role/$dest ($size o) ← $remote"
  PULLED+=("discover/sidebar/$role/$dest ← $remote (sha256 $local_hash)")
done

{
  echo ""
  echo "# Discover sidebar — pull $TS ($SSH_TARGET)"
  for line in "${PULLED[@]}"; do
    echo "$line"
  done
} >> "$SOURCE_VM"

echo "  SOURCE-VM.txt mis à jour"
