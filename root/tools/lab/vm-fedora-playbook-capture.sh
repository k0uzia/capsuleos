#!/usr/bin/env bash
# Enchaîne playbook GNOME (SSH + xdotool/wmctrl) puis capture virsh sur l'hôte.
#
# Usage :
#   bash root/tools/lab/vm-fedora-playbook-capture.sh --list
#   bash root/tools/lab/vm-fedora-playbook-capture.sh --check-tools
#   bash root/tools/lab/vm-fedora-playbook-capture.sh overview-open [dest.png]
#   bash root/tools/lab/vm-fedora-playbook-capture.sh --sequence [dest-dir]
#
# Variables :
#   FEDORA_SSH, FEDORA_VIRSH_NAME, FEDORA_SSH_IDENTITY, CAPTURE_SETTLE_MS
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

FEDORA_SEQUENCE=(
  "overview-open:fedora-playbook-overview.png:2500"
  "open-nautilus:fedora-playbook-nautilus.png:2000"
  "open-firefox:fedora-playbook-firefox.png:2500"
  "quick-settings:fedora-playbook-quick-settings.png:1200"
  "overview-workspaces:fedora-playbook-overview-workspaces.png:2000"
)

usage() {
  cat <<EOF
Usage : bash root/tools/lab/vm-fedora-playbook-capture.sh <commande> [fichier.png]

Commandes :
  --list              playbooks disponibles (vm-gnome-deep-playbooks.sh)
  --check-tools       vérifie xdotool + wmctrl sur la VM
  --sequence [dir]    enchaîne ${#FEDORA_SEQUENCE[@]} scènes lab → audit/
  <playbook> [png]    une action puis virsh screenshot

Exemples :
  bash root/tools/lab/vm-fedora-playbook-capture.sh overview-open
  CAPTURE_SETTLE_MS=1500 bash root/tools/lab/vm-fedora-playbook-capture.sh open-firefox /tmp/ff.png
EOF
}

run_one() {
  local playbook="$1"
  local outfile="$2"
  local settle="${3:-$CAPTURE_SETTLE_MS}"

  mkdir -p "$(dirname "$outfile")"
  echo "=== playbook $playbook → $outfile (settle ${settle}ms) ==="
  lab_wake_display
  sleep 1
  local json
  json="$(lab_run_playbook "$playbook" 2>/dev/null | tail -1 || true)"
  if [[ -n "$json" && "$json" == \{* ]]; then
    echo "  meta: $json"
  fi
  lab_virsh_shot "$outfile" "$settle"
}

cmd="${1:-}"
case "$cmd" in
  -h|--help|'')
    usage
    exit 0
    ;;
  --list)
    lab_run_playbook list
    exit 0
    ;;
  --check-tools)
    echo "=== Outils entrée VM ($LAB_SSH) ==="
    lab_check_input_tools
    exit 0
    ;;
  --sequence)
    local_dest="${2:-$DEFAULT_AUDIT_DIR}"
    mkdir -p "$local_dest"
    echo "=== Séquence Fedora → $local_dest ==="
    lab_wake_display
    sleep 1
    for entry in "${FEDORA_SEQUENCE[@]}"; do
      IFS=':' read -r playbook file settle <<<"$entry"
      run_one "$playbook" "$local_dest/$file" "$settle"
    done
    echo "=== Terminé : $(find "$local_dest" -name 'fedora-playbook-*.png' 2>/dev/null | wc -l) fichiers ==="
    find "$local_dest" -name 'fedora-playbook-*.png' 2>/dev/null | sort || true
    ;;
  *)
    playbook="$cmd"
    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    outfile="${2:-$DEFAULT_AUDIT_DIR/playbook-${playbook}-${stamp}.png}"
    run_one "$playbook" "$outfile" "$CAPTURE_SETTLE_MS"
    ;;
esac
