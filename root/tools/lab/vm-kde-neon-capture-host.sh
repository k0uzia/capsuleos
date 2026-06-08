#!/usr/bin/env bash
# Captures KDE Neon VM : prépare l'état via SSH (session Plasma Wayland), image via virsh.
# Usage :
#   bash root/tools/lab/vm-kde-neon-capture-host.sh [--dolphin-only|--dolphin-views|--dolphin-split|--dolphin-search] [dest-dir]
#
# --dolphin-only  vm-dolphin.png (vue icônes, défaut Dolphin)
# --dolphin-views vm-dolphin.png + vm-dolphin-compact.png + vm-dolphin-list.png (point 5 parité)
# --dolphin-split vm-dolphin-split-only.png (vue scindée, action dbus split_view)
# --dolphin-search vm-dolphin-search-open.png (toggle_search dbus)
#
# Prérequis hôte : virsh (qemu:///system), clé SSH capsuleos-lab, VM « KDE-Neon » démarrée.
# Variables : KDE_NEON_VIRSH_NAME, KDE_NEON_SSH, KDE_NEON_SSH_IDENTITY
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEFAULT_DEST="$ROOT/home/public/Images/screen_KDE-Neon"
DOLPHIN_ONLY=false
DOLPHIN_VIEWS=false
DOLPHIN_SPLIT=false
DOLPHIN_SEARCH=false
DOLPHIN_HAMBURGER=false
while [ "${1:-}" = "--dolphin-only" ] || [ "${1:-}" = "--dolphin-views" ] || [ "${1:-}" = "--dolphin-split" ] || [ "${1:-}" = "--dolphin-search" ] || [ "${1:-}" = "--dolphin-hamburger" ]; do
  if [ "${1:-}" = "--dolphin-only" ]; then
    DOLPHIN_ONLY=true
  fi
  if [ "${1:-}" = "--dolphin-views" ]; then
    DOLPHIN_VIEWS=true
  fi
  if [ "${1:-}" = "--dolphin-split" ]; then
    DOLPHIN_SPLIT=true
  fi
  if [ "${1:-}" = "--dolphin-search" ]; then
    DOLPHIN_SEARCH=true
  fi
  if [ "${1:-}" = "--dolphin-hamburger" ]; then
    DOLPHIN_HAMBURGER=true
  fi
  shift
done
DEST="${1:-$DEFAULT_DEST}"
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

open_dolphin() {
  # kstart (session Plasma) affiche la fenêtre ; nohup/dolphin seul laisse le processus sans surface Wayland.
  prep_env 'killall dolphin 2>/dev/null || true
    sleep 0.5
    kstart dolphin "$HOME" >/dev/null 2>&1 &
    svc=""
    for i in $(seq 1 25); do
      svc=$(qdbus6 2>/dev/null | grep -o "org.kde.dolphin-[0-9]*" | head -1)
      [ -n "$svc" ] && break
      sleep 1
    done
    if [ -n "$svc" ]; then
      qdbus6 "$svc" /dolphin/Dolphin_1 org.kde.dolphin.MainWindow.activateWindow "" 2>/dev/null || true
      for j in $(seq 1 12); do
        qdbus6 "$svc" /dolphin/Dolphin_1 org.kde.dolphin.MainWindow.isUrlOpen "file://$HOME" 2>/dev/null | grep -q true && break
        sleep 0.5
      done
    fi
    sleep 3'
}

open_firefox() {
  prep_env 'killall firefox 2>/dev/null || true
    sleep 0.5
    kstart firefox >/dev/null 2>&1 &
    sleep 6'
}

open_konsole() {
  prep_env 'killall konsole 2>/dev/null || true
    sleep 0.5
    kstart konsole >/dev/null 2>&1 &
    sleep 4'
}

# Modes Dolphin : actions dbus « icons » | « compact » | « details » (dolphinui.rc).
# Repli clavier : Ctrl+1 / Ctrl+2 / Ctrl+3 (menu Affichage CapsuleOS).
dolphin_set_view_mode() {
  local mode="$1"
  local action=""
  local ctrl_digit=""
  case "$mode" in
    icons) action=icons; ctrl_digit=1 ;;
    compact) action=compact; ctrl_digit=2 ;;
    list|details) action=details; ctrl_digit=3 ;;
    *)
      echo "  ✗ mode Dolphin inconnu : $mode (icons|compact|list)" >&2
      return 1
      ;;
  esac
  prep_env "svc=\$(qdbus6 2>/dev/null | grep -o 'org.kde.dolphin-[0-9]*' | head -1)
    ok=0
    if [ -n \"\$svc\" ]; then
      if qdbus6 \"\$svc\" /dolphin/Dolphin_1/actions/${action} org.qtproject.Qt.QAction.trigger 2>/dev/null; then
        ok=1
      fi
    fi
    if [ \"\$ok\" -eq 0 ]; then
      if command -v wtype >/dev/null 2>&1; then
        wtype -M ctrl -k ${ctrl_digit} -m ctrl
      elif command -v ydotool >/dev/null 2>&1; then
        case ${ctrl_digit} in
          1) ydotool key 29:1 2:1 2:0 29:0 ;;
          2) ydotool key 29:1 3:1 3:0 29:0 ;;
          3) ydotool key 29:1 4:1 4:0 29:0 ;;
        esac
      fi
    fi
    sleep 2"
}

capture_dolphin_view_shots() {
  reset_apps
  sleep 1
  open_dolphin
  dolphin_set_view_mode icons
  sleep 1
  shot "$DEST/vm-dolphin.png"
  dolphin_set_view_mode compact
  sleep 1
  shot "$DEST/vm-dolphin-compact.png"
  dolphin_set_view_mode list
  sleep 1
  shot "$DEST/vm-dolphin-list.png"
  reset_apps
}

dolphin_trigger_action() {
  local action="$1"
  prep_env "svc=\$(qdbus6 2>/dev/null | grep -o 'org.kde.dolphin-[0-9]*' | head -1)
    if [ -n \"\$svc\" ]; then
      qdbus6 \"\$svc\" /dolphin/Dolphin_1/actions/${action} org.qtproject.Qt.QAction.trigger 2>/dev/null || true
    fi
    sleep 2"
}

capture_dolphin_split_shots() {
  reset_apps
  sleep 1
  open_dolphin
  dolphin_trigger_action split_view
  sleep 2
  shot "$DEST/vm-dolphin-split-only.png"
  reset_apps
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

capture_dolphin_search_shots() {
  reset_apps
  sleep 1
  open_dolphin
  dolphin_trigger_action toggle_search
  sleep 1.5
  shot "$DEST/vm-dolphin-search-open.png"
  reset_apps
}

capture_dolphin_hamburger_shots() {
  reset_apps
  sleep 1
  open_dolphin
  prep_env 'svc=$(qdbus6 2>/dev/null | grep -o "org.kde.dolphin-[0-9]*" | head -1)
    if [ -n "$svc" ]; then
      qdbus6 "$svc" /dolphin/Dolphin_1/actions/hamburger_menu org.qtproject.Qt.QAction.trigger 2>/dev/null || true
    fi
    sleep 1'
  shot "$DEST/vm-dolphin-hamburger-open.png"
  reset_apps
}

if $DOLPHIN_HAMBURGER; then
  capture_dolphin_hamburger_shots
  echo "=== Terminé : vm-dolphin-hamburger-open.png (--dolphin-hamburger) ==="
  exit 0
fi

if $DOLPHIN_SEARCH; then
  capture_dolphin_search_shots
  echo "=== Terminé : vm-dolphin-search-open.png (--dolphin-search) ==="
  exit 0
fi

if $DOLPHIN_VIEWS; then
  capture_dolphin_view_shots
  echo "=== Terminé : vm-dolphin.png, vm-dolphin-compact.png, vm-dolphin-list.png (--dolphin-views) ==="
  exit 0
fi

if $DOLPHIN_SPLIT; then
  capture_dolphin_split_shots
  echo "=== Terminé : vm-dolphin-split-only.png (--dolphin-split) ==="
  exit 0
fi

if $DOLPHIN_ONLY; then
  reset_apps
  sleep 1
  open_dolphin
  shot "$DEST/vm-dolphin.png"
  reset_apps
  echo "=== Terminé : vm-dolphin.png (--dolphin-only) ==="
  exit 0
fi

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
open_dolphin
shot "$DEST/vm-dolphin.png"

reset_apps
open_firefox
shot "$DEST/vm-firefox.png"

reset_apps
open_konsole
shot "$DEST/vm-terminal.png"

reset_apps
echo "=== Terminé : vm-desktop.png, vm-kickoff.png, vm-discover*.png, vm-dolphin.png, vm-firefox.png, vm-terminal.png ==="
