#!/usr/bin/env bash
# Bootstrap VM Fedora lab — entrée utilisateur pour captures virsh (xdotool + wmctrl).
#
# Prérequis session : GNOME Wayland + Xwayland :0 (xdotool cible Xwayland).
#
# Usage sur la VM :
#   bash root/tools/lab/vm-fedora-lab-bootstrap.sh
# Usage via SSH depuis l'hôte :
#   ssh -i ~/.ssh/capsuleos-lab capsule@192.168.122.91 'bash -s' < root/tools/lab/vm-fedora-lab-bootstrap.sh
set -euo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  DNF=(dnf)
else
  DNF=(sudo dnf)
fi

echo "=== Bootstrap lab Fedora — outils entrée VM ==="

"${DNF[@]}" install -y wmctrl xdotool xorg-x11-server-utils
# xset (dpms) + outils X11 ; xdotool paquet officiel Fedora 44

if command -v xdotool >/dev/null && command -v wmctrl >/dev/null; then
  echo "OK outils : $(command -v xdotool) $(command -v wmctrl)"
else
  echo "✗ xdotool ou wmctrl absent après installation" >&2
  exit 1
fi

mkdir -p "$HOME/.local/bin"
if [[ "$(command -v xdotool)" != "$HOME/.local/bin/xdotool" ]] && [[ -x "$(command -v xdotool)" ]]; then
  ln -sf "$(command -v xdotool)" "$HOME/.local/bin/xdotool" 2>/dev/null || true
fi
if [[ "$(command -v wmctrl)" != "$HOME/.local/bin/wmctrl" ]] && [[ -x "$(command -v wmctrl)" ]]; then
  ln -sf "$(command -v wmctrl)" "$HOME/.local/bin/wmctrl" 2>/dev/null || true
fi

cat <<'NOTE'

Vérification (session graphique active, utilisateur connecté) :
  export DISPLAY=:0
  export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* | head -1)
  xdotool key super          # ouvre l'Aperçu GNOME
  xdotool key Escape         # ferme l'Aperçu
  wmctrl -l                  # liste fenêtres Xwayland

Captures hôte (après bootstrap) :
  bash root/tools/lab/vm-fedora-playbook-capture.sh overview-open
  bash root/tools/lab/vm-fedora-playbook-capture.sh --sequence
  node usr/lib/capsuleos/tools/lab/run-vm-deep-audit-phases.mjs --id linux-fedora --phases 2,3

NOTE

echo "OK vm-fedora-lab-bootstrap"
