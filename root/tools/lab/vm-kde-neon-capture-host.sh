#!/usr/bin/env bash
# Captures KDE Neon VM : prépare l'état via SSH (session Plasma Wayland), image via virsh.
# Usage : bash root/tools/lab/vm-kde-neon-capture-host.sh [dest-dir]
#
# Prérequis hôte : virsh (qemu:///system), clé SSH capsuleos-lab, VM « KDE-Neon » démarrée.
# Variables : KDE_NEON_VIRSH_NAME, KDE_NEON_SSH, KDE_NEON_SSH_IDENTITY
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="${1:-$ROOT/home/public/Images/screen_KDE-Neon}"
VM_NAME="${KDE_NEON_VIRSH_NAME:-KDE-Neon}"
SSH_TARGET="${KDE_NEON_SSH:-capsule@192.168.122.2}"
IDENTITY="${KDE_NEON_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")

mkdir -p "$DEST"

remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$@"
}

prep_env() {
  local cmd="${*:-:}"
  remote "export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/\$(id -u)/bus; \
export XDG_RUNTIME_DIR=/run/user/\$(id -u); \
export WAYLAND_DISPLAY=wayland-0; \
export DISPLAY=:1; \
export XDG_CURRENT_DESKTOP=KDE; \
${cmd}"
}

reset_apps() {
  prep_env 'killall plasma-discover dolphin 2>/dev/null || true'
}

open_kickoff() {
  prep_env 'qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.activateLauncherMenu'
}

close_kickoff() {
  prep_env 'qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.activateLauncherMenu 2>/dev/null || true'
}

open_discover() {
  prep_env 'killall plasma-discover 2>/dev/null || true
    nohup plasma-discover >/dev/null 2>&1 &
    for i in $(seq 1 15); do
      pgrep plasma-discover >/dev/null && break
      sleep 1
    done
    sleep 4'
}

open_discover_installed() {
  prep_env 'killall plasma-discover 2>/dev/null || true
    nohup plasma-discover >/dev/null 2>&1 &
    for i in $(seq 1 15); do
      pgrep plasma-discover >/dev/null && break
      sleep 1
    done
    sleep 5
    if command -v ydotool >/dev/null 2>&1; then
      ydotool key 148:1 148:0 sleep 0.3 148:1 148:0 sleep 0.3 28:1 28:0
    elif command -v wtype >/dev/null 2>&1; then
      wtype -k Tab -k Tab -k Return
    fi
    sleep 2'
}

shot() {
  local file="$1"
  if ! virsh -c qemu:///system screenshot "$VM_NAME" --file "$file" 2>/dev/null; then
    echo "  ✗ virsh screenshot échec — VM « $VM_NAME » démarrée ?" >&2
    return 1
  fi
  echo "  → $file ($(wc -c <"$file") octets)"
}

echo "=== Captures KDE Neon VM ($VM_NAME) → $DEST ==="
reset_apps
sleep 1

shot "$DEST/vm-desktop.png"

open_kickoff
sleep 2
shot "$DEST/vm-kickoff.png"

close_kickoff
reset_apps
open_discover
shot "$DEST/vm-discover.png"

reset_apps
open_discover_installed
shot "$DEST/vm-discover-installed.png"

reset_apps
echo "=== Terminé : vm-desktop.png, vm-kickoff.png, vm-discover.png, vm-discover-installed.png ==="
