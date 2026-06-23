#!/usr/bin/env bash
# Captures Rocky VM : prépare l'état via SSH, image via virsh (domaine Rocky10).
# Apps GNOME réelles : Nautilus (pas Nemo), Firefox, Ptyxis — voir linux-gnome-capsule-slots.md.
# Usage : bash root/tools/lab/vm-rocky-capture-host.sh [dest-dir]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lab-inventory-ssh.sh
source "$(dirname "$0")/lab-inventory-ssh.sh"
DEST="${1:-$ROOT/usr/share/capsuleos/assets/images/vendors/rocky/inventory/rocky-vm}"
VM_NAME="${ROCKY_VIRSH_NAME:-Rocky10}"
SSH_TARGET="${ROCKY_SSH:-$(resolve_lab_ssh linux-rocky ROCKY_SSH)}"
IDENTITY="${ROCKY_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")

mkdir -p "$DEST"

remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$@"
}

prep_env() {
  local cmd="${*:-:}"
  remote "export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/\$(id -u)/bus; \
XDG_RUNTIME_DIR=/run/user/\$(id -u); DISPLAY=:0; \
XAUTHORITY=\$(ls /run/user/\$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1); \
PATH=\$HOME/.local/bin:\$PATH; ${cmd}"
}

wake_display() {
  remote 'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus
    XDG_RUNTIME_DIR=/run/user/$(id -u)
    gdbus call --session --dest org.gnome.ScreenSaver --object-path /org/gnome/ScreenSaver \
      --method org.gnome.ScreenSaver.SetActive false 2>/dev/null || true
    xset dpms force on 2>/dev/null || true'
}

focus_slot() {
  local slot="$1"
  case "$slot" in
    nautilus)
      prep_env 'wmctrl -xa org.gnome.Nautilus.nautilus 2>/dev/null || wmctrl -xa org.gnome.Nautilus 2>/dev/null || true'
      ;;
    firefox)
      prep_env 'wmctrl -xa Navigator.firefox 2>/dev/null || wmctrl -xa firefox.Firefox 2>/dev/null || true'
      ;;
    ptyxis)
      prep_env 'wmctrl -xa org.gnome.ptyxis 2>/dev/null || true'
      ;;
  esac
}

shot() {
  local file="$1"
  if ! virsh -c qemu:///system screenshot "$VM_NAME" --file "$file" 2>/dev/null; then
    echo "  ✗ virsh screenshot échec — utiliser audit/ (run-vm-deep-audit-phases.mjs)" >&2
    return 1
  fi
  echo "  → $file ($(wc -c <"$file") octets)"
}

echo "=== Captures Rocky ($VM_NAME) → $DEST ==="
wake_display
sleep 1

prep_env "gsettings set org.gnome.desktop.interface color-scheme default"
sleep 2
shot "$DEST/rocky-dark-desktop.png"

prep_env 'nohup nautilus >/dev/null 2>&1 & sleep 3'
focus_slot nautilus
sleep 3
shot "$DEST/rocky-dark-nautilus.png"

prep_env 'nohup firefox >/dev/null 2>&1 & sleep 4'
focus_slot firefox
sleep 3
shot "$DEST/rocky-dark-firefox.png"

prep_env 'nohup ptyxis >/dev/null 2>&1 & sleep 3'
focus_slot ptyxis
sleep 3
shot "$DEST/rocky-dark-ptyxis.png"

prep_env "gsettings set org.gnome.desktop.interface color-scheme prefer-light"
sleep 3
shot "$DEST/rocky-light-desktop.png"

focus_slot firefox
sleep 3
shot "$DEST/rocky-light-firefox.png"

prep_env 'nohup nautilus >/dev/null 2>&1 & sleep 3'
focus_slot nautilus
sleep 3
shot "$DEST/rocky-light-nautilus.png"

prep_env "gsettings set org.gnome.desktop.interface color-scheme default"

echo "=== Terminé : $(ls -1 "$DEST"/*.png 2>/dev/null | wc -l) fichiers ==="
ls -la "$DEST"/*.png 2>/dev/null || true
echo "Captures shell (Aperçu, QS) : $DEST/audit/ via run-vm-deep-audit-phases.mjs"
