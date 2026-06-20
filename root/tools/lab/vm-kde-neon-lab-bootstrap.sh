#!/usr/bin/env bash
# Bundle R-PWD1 — bootstrap VM KDE Neon lab (une session sudo).
# Usage console VM : CAPSULEOS_LAB_PUBKEY="$(cat ~/.ssh/capsuleos-lab.pub)" bash root/tools/lab/vm-kde-neon-lab-bootstrap.sh
# Usage via SSH   : ssh -i ~/.ssh/capsuleos-lab user@<ip> 'bash -s' < root/tools/lab/vm-kde-neon-lab-bootstrap.sh
set -euo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  APT=(apt-get)
else
  APT=(sudo apt-get)
fi

echo "=== Bootstrap lab KDE Neon — SSH + outils capture ==="

DEBIAN_FRONTEND=noninteractive "${APT[@]}" update -qq
DEBIAN_FRONTEND=noninteractive "${APT[@]}" install -y \
  openssh-server qemu-guest-agent wmctrl xdotool python3

sudo systemctl enable --now ssh 2>/dev/null || systemctl enable --now ssh
sudo systemctl enable --now qemu-guest-agent 2>/dev/null || true

if [[ -n "${CAPSULEOS_LAB_PUBKEY:-}" ]]; then
  mkdir -p "${HOME}/.ssh"
  chmod 700 "${HOME}/.ssh"
  touch "${HOME}/.ssh/authorized_keys"
  chmod 600 "${HOME}/.ssh/authorized_keys"
  if ! grep -qF "${CAPSULEOS_LAB_PUBKEY}" "${HOME}/.ssh/authorized_keys"; then
    echo "${CAPSULEOS_LAB_PUBKEY}" >> "${HOME}/.ssh/authorized_keys"
  fi
fi

mkdir -p "${HOME}/capsuleos-lab"
echo "OK vm-kde-neon-lab-bootstrap — user=$(whoami) ip=$(hostname -I | awk '{print $1}')"
