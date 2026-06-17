#!/usr/bin/env bash
# Bundle R-PWD1 — bootstrap VM Mint lab (une session sudo).
# Usage VM locale : bash root/tools/lab/vm-mint-lab-bootstrap.sh
# Usage via SSH  : ssh -i ~/.ssh/capsuleos-lab capsule@<ip> 'bash -s' < root/tools/lab/vm-mint-lab-bootstrap.sh
set -euo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  APT=(apt-get)
else
  APT=(sudo apt-get)
fi

echo "=== Bootstrap lab Mint — outils sonde Cinnamon ==="

DEBIAN_FRONTEND=noninteractive "${APT[@]}" update -qq
DEBIAN_FRONTEND=noninteractive "${APT[@]}" install -y \
  openssh-server wmctrl xdotool python3 python3-gi gir1.2-gtk-3.0 x11-utils qemu-guest-agent

sudo systemctl enable --now ssh 2>/dev/null || systemctl enable --now ssh
sudo systemctl enable --now qemu-guest-agent 2>/dev/null || true

for cmd in wmctrl xdotool python3; do
  if ! command -v "$cmd" >/dev/null; then
    echo "✗ $cmd absent après installation" >&2
    exit 1
  fi
done

mkdir -p "$HOME/capsuleos-lab"
echo "OK vm-mint-lab-bootstrap — $(command -v wmctrl) $(command -v xdotool)"
