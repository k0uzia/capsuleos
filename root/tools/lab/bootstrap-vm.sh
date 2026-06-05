#!/usr/bin/env bash
# Déploie sondes lab + dépendances (wmctrl, xdotool) sur la VM.
# Usage: root/tools/lab/bootstrap-vm.sh <registryId>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
LAB_DIR="$(dirname "$0")"
INVENTORY="${ROOT}/etc/capsuleos/lab-inventory.json"
REGISTRY_ID="${1:-linux-mint}"

if [[ ! -f "$INVENTORY" ]]; then
  echo "Inventaire manquant: $INVENTORY" >&2
  exit 1
fi

META=$(node -e "
const inv=require(process.argv[1]);
const h=inv.hosts.find(x=>x.registryId===process.argv[2]);
if(!h) process.exit(2);
const probe=h.probe || ((h.toolkit==='gnome') ? '\$HOME/capsuleos-lab/os-probe-gnome.sh' : '\$HOME/capsuleos-lab/os-probe.sh');
process.stdout.write(JSON.stringify({ ssh:h.ssh, identity:h.sshIdentity||'', toolkit:h.toolkit||'cinnamon', probe }));
" "$INVENTORY" "$REGISTRY_ID")

TARGET=$(node -e "const m=JSON.parse(process.argv[1]); process.stdout.write(m.ssh)" "$META")
IDENTITY=$(node -e "const m=JSON.parse(process.argv[1]); process.stdout.write(m.identity||'')" "$META")
TOOLKIT=$(node -e "const m=JSON.parse(process.argv[1]); process.stdout.write(m.toolkit)" "$META")
PROBE_REMOTE=$(node -e "const m=JSON.parse(process.argv[1]); process.stdout.write(m.probe)" "$META")

IDENTITY="${IDENTITY/#\~/$HOME}"
if [[ -z "$IDENTITY" ]]; then
  IDENTITY="$HOME/.ssh/capsuleos-lab"
fi

SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")

ssh "${SSH_OPTS[@]}" "$TARGET" "mkdir -p \$HOME/capsuleos-lab"
scp "${SSH_OPTS[@]}" "$LAB_DIR/os-probe.sh" "$TARGET:~/capsuleos-lab/os-probe.sh"
scp "${SSH_OPTS[@]}" "$LAB_DIR/os-probe-gnome.sh" "$TARGET:~/capsuleos-lab/os-probe-gnome.sh"
scp "${SSH_OPTS[@]}" "$LAB_DIR/install-xdotool-el.sh" "$TARGET:~/capsuleos-lab/install-xdotool-el.sh"
ssh "${SSH_OPTS[@]}" "$TARGET" "chmod +x \$HOME/capsuleos-lab/*.sh"

if ssh "${SSH_OPTS[@]}" "$TARGET" "command -v dnf >/dev/null"; then
  ssh "${SSH_OPTS[@]}" "$TARGET" \
    "command -v wmctrl >/dev/null || (sudo /usr/bin/crb enable 2>/dev/null; sudo dnf install -y epel-release wmctrl)" || true
  if ! ssh "${SSH_OPTS[@]}" "$TARGET" "export PATH=\$HOME/.local/bin:\$PATH; command -v xdotool >/dev/null"; then
    ssh "${SSH_OPTS[@]}" "$TARGET" "bash \$HOME/capsuleos-lab/install-xdotool-el.sh" || true
  fi
  if ! ssh "${SSH_OPTS[@]}" "$TARGET" "export PATH=\$HOME/.local/bin:\$PATH; command -v xdotool >/dev/null"; then
    echo "Compilation xdotool sur l'hôte et déploiement…" >&2
    bash "$LAB_DIR/deploy-xdotool-via-host.sh" "$TARGET" "$IDENTITY"
  fi
else
  ssh "${SSH_OPTS[@]}" "$TARGET" \
    "command -v xdotool >/dev/null || (command -v apt-get >/dev/null && sudo apt-get install -y xdotool)" || true
fi

X11_PREFIX=$(node --input-type=module -e "
import fs from 'fs';
import { buildX11EnvPrefix } from '${ROOT}/usr/lib/capsuleos/tools/lab/lab-x11-env.mjs';
const inv = JSON.parse(fs.readFileSync('${INVENTORY}', 'utf8'));
const h = inv.hosts.find((x) => x.registryId === '${REGISTRY_ID}');
if (!h) process.exit(2);
console.log(buildX11EnvPrefix(h));
")

echo "OK — sonde ($TOOLKIT) sur ${TARGET#*@}:"
ssh "${SSH_OPTS[@]}" "$TARGET" \
  "export PATH=\$HOME/.local/bin:\$PATH; ${X11_PREFIX} ${PROBE_REMOTE} state" | head -c 800
echo ""
