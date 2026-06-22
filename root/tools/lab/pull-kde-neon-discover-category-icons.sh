#!/usr/bin/env bash
# Pull icônes apps catégories Discover — inventaire VM → vendors/neon/discover/
#
# Usage :
#   bash root/tools/lab/vm-kde-neon-discover-category-apps-inventory.sh
#   bash root/tools/lab/pull-kde-neon-discover-category-icons.sh
#   bash root/tools/lab/pull-kde-neon-discover-category-icons.sh --verify-only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lab-inventory-ssh.sh
source "$(dirname "$0")/lab-inventory-ssh.sh"
SSH_TARGET="${KDE_NEON_SSH:-$(resolve_lab_ssh linux-kde-neon KDE_NEON_SSH)}"
IDENTITY="${KDE_NEON_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
DEST="$ROOT/usr/share/capsuleos/assets/images/vendors/neon/discover"
INVENTORY="$ROOT/root/docs/inventaires/linux-kde-neon-discover-category-apps.json"
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
  echo "Inventaire absent — lancer vm-kde-neon-discover-category-apps-inventory.sh" >&2
  exit 1
fi

mkdir -p "$DEST"

mapfile -t ROWS < <(python3 - "$INVENTORY" <<'PY'
import json, sys
inv = json.load(open(sys.argv[1]))
seen = set()
for row in inv.get("icons", []):
    dest = row.get("dest")
    remote = row.get("remotePath")
    if not dest or not remote or dest in seen:
        continue
    seen.add(dest)
    print(f"{dest}|{remote}")
PY
)

if [[ "$VERIFY_ONLY" == true ]]; then
  echo "=== Vérification SHA256 catégories Discover ==="
  fail=0
  for entry in "${ROWS[@]}"; do
    dest="${entry%%|*}"
    remote="${entry#*|}"
    local_file="$DEST/$dest"
    if [[ ! -f "$local_file" ]]; then
      echo "  ✗ manquant: discover/$dest"
      fail=1
      continue
    fi
    remote_hash="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "sha256sum '$remote' 2>/dev/null" | awk '{print $1}')"
    local_hash="$(sha256sum "$local_file" | awk '{print $1}')"
    if [[ "$remote_hash" == "$local_hash" ]]; then
      echo "  ✓ $dest"
    else
      echo "  ✗ drift: $dest"
      fail=1
    fi
  done
  exit "$fail"
fi

echo "=== Pull icônes catégories Discover — $SSH_TARGET → discover/ ==="
PULLED=()
for entry in "${ROWS[@]}"; do
  dest="${entry%%|*}"
  remote="${entry#*|}"
  if [[ -f "$DEST/$dest" ]]; then
    echo "  · discover/$dest (déjà présent)"
    continue
  fi
  scp "${SSH_OPTS[@]}" "$SSH_TARGET:$remote" "$DEST/$dest"
  size="$(wc -c < "$DEST/$dest" | tr -d ' ')"
  hash="$(sha256sum "$DEST/$dest" | awk '{print $1}')"
  echo "  → discover/$dest ($size octets) ← $remote"
  PULLED+=("discover/$dest ← $remote (sha256 $hash)")
done

if [[ ${#PULLED[@]} -gt 0 ]]; then
  TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  {
    echo ""
    echo "# Discover catégories — pull $TS ($SSH_TARGET)"
    printf '%s\n' "${PULLED[@]}"
  } >> "$SOURCE_VM"
fi

echo "=== Terminé — ${#ROWS[@]} icônes catégories ==="
