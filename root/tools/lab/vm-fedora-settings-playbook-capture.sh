#!/usr/bin/env bash
# Ouvre des panneaux gnome-control-center sur la VM puis capture virsh (couche V/G).
#
# Usage :
#   bash root/tools/lab/vm-fedora-settings-playbook-capture.sh --check-tools
#   bash root/tools/lab/vm-fedora-settings-playbook-capture.sh appearance
#   bash root/tools/lab/vm-fedora-settings-playbook-capture.sh --sequence [dest-dir]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lab-inventory-ssh.sh
source "$(dirname "$0")/lab-inventory-ssh.sh"
DEFAULT_AUDIT_DIR="$ROOT/usr/share/capsuleos/assets/images/vendors/fedora/inventory/fedora-vm/audit"
export LAB_ROOT="$ROOT"
export FEDORA_SSH="${FEDORA_SSH:-$(resolve_lab_ssh linux-fedora FEDORA_SSH)}"
export FEDORA_VIRSH_NAME="${FEDORA_VIRSH_NAME:-fedora}"
export FEDORA_SSH_IDENTITY="${FEDORA_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"

# shellcheck source=vm-gnome-lab-input.sh
source "$ROOT/root/tools/lab/vm-gnome-lab-input.sh"

SETTINGS_SEQUENCE=(
  "appearance:fedora-settings-appearance.png:2200"
  "background:fedora-settings-background.png:2200"
  "wifi:fedora-settings-wifi.png:1800"
  "multitasking:fedora-settings-multitasking.png:1800"
  "displays:fedora-settings-displays.png:1800"
)

open_gcc_panel() {
  local panel="$1"
  # pkill peut renvoyer 255 sans processus cible — forcer exit 0 pour SSH + set -e
  lab_prep_env "bash -lc 'pkill -x gnome-control-center 2>/dev/null; sleep 0.5; nohup gnome-control-center ${panel} >/dev/null 2>&1 & disown; exit 0'"
}

usage() {
  cat <<EOF
Usage : bash root/tools/lab/vm-fedora-settings-playbook-capture.sh <panneau|commande> [dest.png]

Panneaux gcc : appearance background wifi multitasking displays sound power …
Commandes : --check-tools, --sequence [dir], --list
EOF
}

run_panel() {
  local panel="$1"
  local outfile="$2"
  local settle="${3:-$CAPTURE_SETTLE_MS}"
  mkdir -p "$(dirname "$outfile")"
  echo "=== gcc ${panel} → $outfile ==="
  lab_wake_display
  lab_overview_hide
  open_gcc_panel "$panel"
  lab_virsh_shot "$outfile" "$settle"
  lab_prep_env 'bash -lc "pkill -x gnome-control-center 2>/dev/null; exit 0"'
}

cmd="${1:-}"
case "$cmd" in
  -h|--help|'')
    usage
    ;;
  --check-tools)
    lab_check_input_tools
    ;;
  --list)
    printf '%s\n' "${SETTINGS_SEQUENCE[@]}" | cut -d: -f1
    echo "(autres panneaux : voir gnome-settings-parity-matrix-fedora.json)"
    ;;
  --sequence)
    dest="${2:-$DEFAULT_AUDIT_DIR}"
    mkdir -p "$dest"
    echo "=== Captures Paramètres Fedora → $dest ==="
    for entry in "${SETTINGS_SEQUENCE[@]}"; do
      IFS=':' read -r panel file settle <<<"$entry"
      run_panel "$panel" "$dest/$file" "$settle"
    done
    echo "=== Terminé : $(find "$dest" -name 'fedora-settings-*.png' 2>/dev/null | wc -l) fichiers ==="
    ;;
  *)
    panel="$cmd"
    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    outfile="${2:-$DEFAULT_AUDIT_DIR/fedora-settings-${panel}-${stamp}.png}"
    run_panel "$panel" "$outfile" "${CAPTURE_SETTLE_MS:-2000}"
    ;;
esac
