#!/usr/bin/env bash
# Bundle R-PWD1 — bootstrap VM Rocky lab (une session sudo).
# Usage VM locale : bash root/tools/lab/vm-rocky-lab-bootstrap.sh
# Usage via SSH  : ssh capsule@<ip> 'bash -s' < root/tools/lab/vm-rocky-lab-bootstrap.sh
set -euo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  DNF=(dnf)
else
  DNF=(sudo dnf)
fi

"${DNF[@]}" install -y openssh-server wmctrl
sudo systemctl enable --now sshd 2>/dev/null || systemctl enable --now sshd
sudo /usr/bin/crb enable 2>/dev/null || /usr/bin/crb enable
"${DNF[@]}" install -y epel-release
"${DNF[@]}" install -y wmctrl

echo "OK vm-rocky-lab-bootstrap"
