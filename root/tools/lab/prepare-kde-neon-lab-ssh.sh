#!/usr/bin/env bash
# Prépare l'accès SSH lab KDE Neon — IP via libvirt, bootstrap console si besoin.
# Usage : bash root/tools/lab/prepare-kde-neon-lab-ssh.sh [--wait]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
KEY="${HOME}/.ssh/capsuleos-lab"
PUB="${KEY}.pub"
VM_NAME="${KDE_NEON_VIRSH_NAME:-KDE_Neon}"
LIBVIRT_URI="${LIBVIRT_DEFAULT_URI:-qemu:///system}"
WAIT="${1:-}"

resolve_ip() {
  virsh -c "${LIBVIRT_URI}" net-dhcp-leases default 2>/dev/null \
    | awk '/52:54:00:83:06:f0/ { gsub(/\/.*/, "", $5); print $5; exit }'
}

IP="${KDE_NEON_SSH_HOST:-$(resolve_ip)}"
if [[ -z "${IP}" ]]; then
  echo "prepare-kde-neon-lab-ssh — IP introuvable (virsh DHCP) ; définir KDE_NEON_SSH_HOST" >&2
  exit 1
fi

SSH_CONFIG=( -F /dev/null -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes -i "${KEY}" )

try_ssh() {
  local user="$1"
  ssh "${SSH_CONFIG[@]}" -o BatchMode=yes -o ConnectTimeout=5 "${user}@${IP}" 'echo OK lab-ssh user='"${user}" 2>/dev/null
}

echo "=== KDE Neon lab SSH — ${IP} (VM ${VM_NAME}) ==="

if [[ ! -f "${PUB}" ]]; then
  bash "${ROOT}/root/tools/lab/setup-lab-ssh-key.sh"
fi

for user in capsule goupil laj; do
  if try_ssh "${user}"; then
    echo "✓ SSH OK — ${user}@${IP}"
    echo "  export KDE_NEON_SSH=${user}@${IP}"
    exit 0
  fi
done

echo "✗ SSH indisponible (port 22 refusé ou clé absente)."
echo ""
echo "Dans la console VM (SPICE) :"
echo "  virt-viewer spice://127.0.0.1:5900"
echo ""
echo "Puis coller (une session sudo) :"
echo "  CAPSULEOS_LAB_PUBKEY=\"$(cat "${PUB}")\" bash -s" "< ${ROOT}/root/tools/lab/vm-kde-neon-lab-bootstrap.sh"
echo ""
echo "Ou copier le dépôt sur la VM et lancer vm-kde-neon-lab-bootstrap.sh avec CAPSULEOS_LAB_PUBKEY."

if [[ "${WAIT}" == "--wait" ]]; then
  echo ""
  echo "Attente SSH (Ctrl+C pour arrêter)…"
  for _ in $(seq 1 60); do
    sleep 10
    for user in capsule goupil laj; do
      if try_ssh "${user}"; then
        echo "✓ SSH OK — ${user}@${IP}"
        bash "${ROOT}/root/tools/lab/setup-lab-ssh-key.sh" "${user}@${IP}" || true
        exit 0
      fi
    done
    echo "  … toujours en attente ($(date +%H:%M:%S))"
  done
  echo "✗ Timeout 10 min — bootstrap VM requis."
  exit 1
fi

exit 1
