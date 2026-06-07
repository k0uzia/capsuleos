#!/usr/bin/env bash
# Captures Fedora VM : prépare l'état via SSH (xdotool/wmctrl), image via virsh.
# Usage : bash root/tools/lab/vm-fedora-capture-host.sh [dest-dir]
#
# Prérequis VM : bash root/tools/lab/vm-fedora-lab-bootstrap.sh
# Scène unitaire : bash root/tools/lab/vm-fedora-playbook-capture.sh <playbook>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="${1:-$ROOT/usr/share/capsuleos/assets/images/vendors/fedora/inventory/fedora-vm}"
export LAB_ROOT="$ROOT"
export FEDORA_SSH="${FEDORA_SSH:-capsule@192.168.122.91}"
export FEDORA_VIRSH_NAME="${FEDORA_VIRSH_NAME:-fedora}"
export FEDORA_SSH_IDENTITY="${FEDORA_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"

# shellcheck source=vm-gnome-lab-input.sh
source "$ROOT/root/tools/lab/vm-gnome-lab-input.sh"

mkdir -p "$DEST/audit"

focus_slot() {
  local slot="$1"
  case "$slot" in
    nautilus)
      lab_prep_env 'wmctrl -xa org.gnome.Nautilus.nautilus 2>/dev/null || wmctrl -xa org.gnome.Nautilus 2>/dev/null || true'
      ;;
    firefox)
      lab_prep_env 'wmctrl -xa Navigator.firefox 2>/dev/null || wmctrl -xa firefox.Firefox 2>/dev/null || true'
      ;;
    text_editor)
      lab_prep_env 'wmctrl -xa org.gnome.TextEditor 2>/dev/null || true'
      ;;
    calculator)
      lab_prep_env 'wmctrl -xa org.gnome.Calculator 2>/dev/null || true'
      ;;
  esac
}

echo "=== Captures Fedora ($LAB_VIRSH_NAME) → $DEST ==="
lab_wake_display
sleep 1

lab_overview_hide
lab_prep_env "gsettings set org.gnome.desktop.interface color-scheme prefer-dark"
sleep 2
lab_virsh_shot "$DEST/fedora-dark-desktop.png" 0

lab_overview_open
lab_virsh_shot "$DEST/audit/fedora-dark-overview.png" 3000

lab_overview_hide
lab_prep_env 'nohup nautilus >/dev/null 2>&1 & sleep 3'
focus_slot nautilus
lab_virsh_shot "$DEST/fedora-dark-nautilus.png" 3000

lab_prep_env 'nohup firefox >/dev/null 2>&1 & sleep 4'
focus_slot firefox
lab_virsh_shot "$DEST/fedora-dark-firefox.png" 3000

lab_prep_env 'nohup gnome-text-editor >/dev/null 2>&1 & sleep 3'
focus_slot text_editor
lab_virsh_shot "$DEST/fedora-dark-text-editor.png" 3000

lab_overview_hide
lab_prep_env 'nohup gnome-calculator >/dev/null 2>&1 & sleep 3'
focus_slot calculator
lab_virsh_shot "$DEST/fedora-dark-calculator.png" 3000

lab_overview_hide
lab_prep_env "gsettings set org.gnome.desktop.interface color-scheme prefer-light"
lab_virsh_shot "$DEST/fedora-light-desktop.png" 3000

focus_slot firefox
lab_virsh_shot "$DEST/fedora-light-firefox.png" 3000

lab_prep_env 'nohup nautilus >/dev/null 2>&1 & sleep 3'
focus_slot nautilus
lab_virsh_shot "$DEST/fedora-light-nautilus.png" 3000

lab_overview_open
lab_virsh_shot "$DEST/audit/fedora-light-overview.png" 3000

lab_prep_env "gsettings set org.gnome.desktop.interface color-scheme default"
lab_overview_hide

echo "=== Terminé : $(find "$DEST" -name '*.png' 2>/dev/null | wc -l) fichiers ==="
find "$DEST" -name '*.png' 2>/dev/null | sort || true
echo "Playbooks unitaires : bash root/tools/lab/vm-fedora-playbook-capture.sh --sequence"
