#!/usr/bin/env bash
# Installe l'agent screenshot GNOME sur une VM distante (Proxmox, Wayland).
# L'agent doit tourner dans la session graphique GNOME (autostart ou Terminal VM).
#
# Usage : bash root/tools/lab/install-vm-screenshot-agent.sh [user@host]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
# shellcheck source=lab-inventory-ssh.sh
source "$(dirname "$0")/lab-inventory-ssh.sh"
TARGET="${1:-$(resolve_lab_ssh linux-ubuntu UBUNTU_SSH)}"
IDENTITY="${CAPSULE_LAB_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "${IDENTITY}")

echo "=== install-vm-screenshot-agent → ${TARGET} ==="
ssh "${SSH_OPTS[@]}" "${TARGET}" 'mkdir -p ~/capsuleos-lab ~/.config/autostart'
scp "${SSH_OPTS[@]}" \
  "${ROOT}/root/tools/lab/vm-gnome-screenshot-agent.sh" \
  "${TARGET}:~/capsuleos-lab/vm-gnome-screenshot-agent.sh"
scp "${SSH_OPTS[@]}" \
  "${ROOT}/root/tools/lab/capsuleos-screenshot-agent.desktop" \
  "${TARGET}:~/.config/autostart/capsuleos-screenshot-agent.desktop"
ssh "${SSH_OPTS[@]}" "${TARGET}" 'chmod +x ~/capsuleos-lab/vm-gnome-screenshot-agent.sh
  systemctl --user disable --now capsuleos-screenshot-agent.service 2>/dev/null || true
  rm -f ~/.config/systemd/user/capsuleos-screenshot-agent.service
  systemctl --user daemon-reload 2>/dev/null || true
  pkill -f vm-gnome-screenshot-agent.sh 2>/dev/null || true
  echo ""
  echo "→ Démarrez l agent dans la session GNOME (une fois par session) :"
  echo "   Terminal sur la VM : nohup ~/capsuleos-lab/vm-gnome-screenshot-agent.sh &"
  echo "   Ou déconnectez-vous / reconnectez-vous (autostart)."
  echo ""
  if [[ -f "${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/capsuleos-lab/agent.ready" ]]; then
    echo "OK agent.ready présent"
  else
    echo "⚠ agent.ready absent — lancer l agent depuis le Terminal VM"
  fi'
