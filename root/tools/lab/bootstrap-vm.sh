#!/usr/bin/env bash
# Déploie os-probe.sh sur la VM lab (SSH requis).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PROBE_SRC="$(dirname "$0")/os-probe.sh"
INVENTORY="${ROOT}/etc/capsuleos/lab-inventory.json"
REGISTRY_ID="${1:-linux-mint}"

if [[ ! -f "$INVENTORY" ]]; then
  echo "Inventaire manquant: $INVENTORY" >&2
  exit 1
fi

SSH_LINE=$(node -e "
const inv=require(process.argv[1]);
const h=inv.hosts.find(x=>x.registryId===process.argv[2]);
if(!h) process.exit(2);
console.log([h.ssh,h.sshIdentity||''].join('|'));
" "$INVENTORY" "$REGISTRY_ID")

TARGET="${SSH_LINE%%|*}"
IDENTITY="${SSH_LINE#*|}"
IDENTITY="${IDENTITY/#\~/$HOME}"
USER="${TARGET%%@*}"
HOST="${TARGET#*@}"
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY" "$TARGET" "mkdir -p \$HOME/capsuleos-lab"
scp -o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY" "$PROBE_SRC" "$TARGET:~/capsuleos-lab/os-probe.sh"
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY" "$TARGET" \
  "chmod +x \$HOME/capsuleos-lab/os-probe.sh"
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY" "$TARGET" \
  "command -v xdotool >/dev/null || (command -v apt-get >/dev/null && sudo -n apt-get install -y xdotool 2>/dev/null) || true"

echo "OK — sonde sur $HOST:"
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY" "$TARGET" \
  "DISPLAY=:0 \$HOME/capsuleos-lab/os-probe.sh state" | head -c 500
echo ""
