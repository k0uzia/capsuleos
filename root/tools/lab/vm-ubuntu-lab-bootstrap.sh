#!/usr/bin/env bash
# Bootstrap VM Ubuntu lab (une session sudo) — sonde CapsuleOS.
# Usage VM locale : bash vm-ubuntu-lab-bootstrap.sh
# Usage via SSH  : ssh capsule@<ip> 'bash -s' < root/tools/lab/vm-ubuntu-lab-bootstrap.sh
set -euo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  APT=(apt-get)
else
  APT=(sudo apt-get)
fi

"${APT[@]}" update -qq
DEBIAN_FRONTEND=noninteractive "${APT[@]}" install -y \
  openssh-server wmctrl xdotool python3

sudo systemctl enable --now ssh 2>/dev/null || systemctl enable --now ssh

if ! command -v wmctrl >/dev/null; then
  echo "wmctrl absent après install" >&2
  exit 1
fi

echo "OK vm-ubuntu-lab-bootstrap"
