#!/usr/bin/env bash
# Captures KDE Neon VM : prépare l'état via SSH (session Plasma Wayland), image via virsh.
# Usage :
#   bash root/tools/lab/vm-kde-neon-capture-host.sh [--dolphin-only|--dolphin-views|--dolphin-split|--dolphin-search] [dest-dir]
#
# --dolphin-only  vm-dolphin.png (vue icônes, défaut Dolphin)
# --dolphin-views vm-dolphin.png + vm-dolphin-compact.png + vm-dolphin-list.png (point 5 parité)
# --dolphin-split vm-dolphin-split-only.png (vue scindée, action dbus split_view)
# --dolphin-search vm-dolphin-search-open.png (toggle_search dbus)
# --dolphin-search-filter vm-dolphin-search-filter-open.png (recherche + menu filtre)
# --discover-home vm-discover.png (accueil)
# --b2-b3-apps vm-spectacle.png + vm-kinfocenter.png + vm-system-monitor.png (kickoff G4)
# --dolphin-g5 vm-dolphin §7–8 (search · filtre · hamburger · vues icônes)
# --discover-updates|--discover-about|--discover-config|--discover-detail captures onglets Discover (plasma-discover --mode / --application)
# --discover-g6 lot G6 (accueil + installé + mises à jour + config + à propos) — dismiss popup MAJ
# --discover-vm-100 G6 + fiche VLC (campagne réalisme VM 100 %)
# --discover-recursive G6 + VLC + recherche VLC + catégorie Internet + installé fenêtré + inventaire visuel complet
# --firefox-g7 vm-firefox.png (ground G7 — paire toolbar VM)
# --panel-g8 vm-desktop.png + vm-kickoff.png (ground G8 — panel · kickoff)
#
# Prérequis hôte : virsh (qemu:///system), clé SSH capsuleos-lab, VM « KDE-Neon » démarrée.
# Variables : KDE_NEON_VIRSH_NAME, KDE_NEON_SSH, KDE_NEON_SSH_IDENTITY
set -euo pipefail

if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  echo "vm-kde-neon-capture-host.sh : ne pas sourcer — lancer avec bash et des flags (--discover-g6, etc.)" >&2
  return 1 2>/dev/null || exit 1
fi

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
LAB_DIR="$(cd "$(dirname "$0")" && pwd)"
KWIN_DISCOVER_JS="$LAB_DIR/kde-neon-discover-capture-kwin.js"
DEFAULT_DEST="$ROOT/home/public/Images/screen_KDE-Neon"
DOLPHIN_ONLY=false
DOLPHIN_VIEWS=false
DOLPHIN_SPLIT=false
DOLPHIN_SEARCH=false
DOLPHIN_SEARCH_FILTER=false
DOLPHIN_HAMBURGER=false
DISCOVER_UPDATES=false
DISCOVER_ABOUT=false
DISCOVER_CONFIG=false
DISCOVER_DETAIL=false
DISCOVER_DETAIL_LIVE=false
DISCOVER_HOME=false
DISCOVER_G6=false
DISCOVER_VM_100=false
DISCOVER_RECURSIVE=false
B2_B3_APPS=false
DOLPHIN_G5=false
FIREFOX_G7=false
PANEL_G8=false
while [ "${1:-}" = "--dolphin-only" ] || [ "${1:-}" = "--dolphin-views" ] || [ "${1:-}" = "--dolphin-split" ] || [ "${1:-}" = "--dolphin-search" ] || [ "${1:-}" = "--dolphin-search-filter" ] || [ "${1:-}" = "--dolphin-hamburger" ] || [ "${1:-}" = "--dolphin-g5" ] || [ "${1:-}" = "--firefox-g7" ] || [ "${1:-}" = "--panel-g8" ] || [ "${1:-}" = "--discover-home" ] || [ "${1:-}" = "--discover-g6" ] || [ "${1:-}" = "--discover-vm-100" ] || [ "${1:-}" = "--discover-recursive" ] || [ "${1:-}" = "--discover-updates" ] || [ "${1:-}" = "--discover-about" ] || [ "${1:-}" = "--discover-config" ] || [ "${1:-}" = "--discover-detail" ] || [ "${1:-}" = "--discover-detail-live" ] || [ "${1:-}" = "--b2-b3-apps" ]; do
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
  if [ "${1:-}" = "--dolphin-search-filter" ]; then
    DOLPHIN_SEARCH_FILTER=true
  fi
  if [ "${1:-}" = "--dolphin-hamburger" ]; then
    DOLPHIN_HAMBURGER=true
  fi
  if [ "${1:-}" = "--discover-home" ]; then
    DISCOVER_HOME=true
  fi
  if [ "${1:-}" = "--discover-g6" ]; then
    DISCOVER_G6=true
  fi
  if [ "${1:-}" = "--discover-vm-100" ]; then
    DISCOVER_VM_100=true
  fi
  if [ "${1:-}" = "--discover-recursive" ]; then
    DISCOVER_RECURSIVE=true
  fi
  if [ "${1:-}" = "--discover-updates" ]; then
    DISCOVER_UPDATES=true
  fi
  if [ "${1:-}" = "--discover-about" ]; then
    DISCOVER_ABOUT=true
  fi
  if [ "${1:-}" = "--discover-config" ]; then
    DISCOVER_CONFIG=true
  fi
  if [ "${1:-}" = "--discover-detail" ]; then
    DISCOVER_DETAIL=true
  fi
  if [ "${1:-}" = "--discover-detail-live" ]; then
    DISCOVER_DETAIL_LIVE=true
  fi
  if [ "${1:-}" = "--b2-b3-apps" ]; then
    B2_B3_APPS=true
  fi
  if [ "${1:-}" = "--dolphin-g5" ]; then
    DOLPHIN_G5=true
  fi
  if [ "${1:-}" = "--firefox-g7" ]; then
    FIREFOX_G7=true
  fi
  if [ "${1:-}" = "--panel-g8" ]; then
    PANEL_G8=true
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

remote_env_prefix() {
  printf '%s' 'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus; '
  printf '%s' 'export XDG_RUNTIME_DIR=/run/user/$(id -u); '
  printf '%s' 'export WAYLAND_DISPLAY=wayland-0; '
  printf '%s' 'export DISPLAY=:1; '
  printf '%s' 'export XDG_CURRENT_DESKTOP=KDE; '
  printf '%s' 'XAUTH_FILE=$(ls /run/user/$(id -u)/xauth_* 2>/dev/null | head -1); '
  printf '%s' '[ -n "$XAUTH_FILE" ] && export XAUTHORITY="$XAUTH_FILE"; '
}

prep_env() {
  local cmd="${*:-:}"
  remote "$(remote_env_prefix)${cmd}"
}

# Session ssh multi-lignes fiable (évite & et for loops cassés dans une seule ligne).
remote_session() {
  local body="$1"
  {
    remote_env_prefix
    printf '\n'
    printf '%s\n' "$body"
  } | ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s
}

# Wayland : plasma-discover natif — script KWin (xdotool ne voit pas la fenêtre).
_run_kwin_discover_script() {
  local script_id="$1"
  prep_env "SCRIPT=/tmp/capsuleos-discover-capture-kwin.js
    cat > \"\$SCRIPT\" <<'KWINJS'
$(cat "$KWIN_DISCOVER_JS")
KWINJS
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript ${script_id} >/dev/null 2>&1 || true
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.loadScript \"\$SCRIPT\" ${script_id} >/dev/null 2>&1
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.start >/dev/null 2>&1
    sleep 0.4
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript ${script_id} >/dev/null 2>&1 || true"
}

dismiss_discover_update_dialog() {
  _run_kwin_discover_script capsuleos-discover-capture
}

discover_dismiss_escape() {
  prep_env 'for _ in 1 2; do if command -v wtype >/dev/null 2>&1; then wtype -k Escape; elif command -v xdotool >/dev/null 2>&1; then xdotool key Escape; fi; sleep 0.2; done'
}

# Attendre le chargement Discover puis fermer la popup « Problème de mises à jour » (PackageKit lab).
# Ne pas envoyer Escape globalement — fermerait Discover (seul KWin cible le dialogue).
# VM lab : plasma-discover --mode Update peut quitter ~30 s — boucle courte, capture rapide.
discover_stabilize_for_shot() {
  local wait_secs="${1:-4}"
  require_discover_window
  sleep "$wait_secs"
  local attempt
  for attempt in 1 2 3 4 5; do
    dismiss_discover_update_dialog
    sleep 0.7
  done
  dismiss_discover_update_dialog
  sleep 0.3
}

require_discover_window() {
  remote_session 'for i in $(seq 1 15); do
  pgrep plasma-discover >/dev/null && exit 0
  sleep 1
done
echo "plasma-discover absent — abandon capture" >&2
exit 1'
}

reset_apps() {
  prep_env 'killall plasma-discover dolphin konsole firefox spectacle kinfocenter plasma-systemmonitor 2>/dev/null || true'
}

focus_discover_window() {
  dismiss_discover_update_dialog
}

open_kickoff() {
  prep_env 'qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.activateLauncherMenu'
}

close_kickoff() {
  prep_env 'qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.activateLauncherMenu 2>/dev/null || true'
}

discover_plasma_mode() {
  case "$1" in
    home | "") echo "" ;;
    installed) echo "Installed" ;;
    update) echo "Update" ;;
    settings | config | sources) echo "Sources" ;;
    about) echo "About" ;;
    browsing) echo "Browsing" ;;
    *)
      echo "$1" | awk '{print toupper(substr($0,1,1)) substr($0,2)}'
      ;;
  esac
}

open_discover() {
  remote_session 'killall plasma-discover 2>/dev/null || true
sleep 1
kstart plasma-discover >/dev/null 2>&1 &
for i in $(seq 1 20); do
  pgrep plasma-discover >/dev/null && break
  sleep 1
done
sleep 4'
}

open_discover_mode() {
  local mode="$1"
  local plasma_mode
  plasma_mode="$(discover_plasma_mode "$mode")"
  if [ -z "$plasma_mode" ]; then
    open_discover
    return
  fi
  # kstart --mode segfault · setsid+nohup instable via ssh — systemd-run --user sur VM lab.
  # Discover --mode Update quitte ~30 s sur VM lab : capturer vite après ouverture.
  remote_session "killall plasma-discover 2>/dev/null || true
sleep 1
systemd-run --user --scope --collect plasma-discover --mode ${plasma_mode} >/dev/null 2>&1 &
for i in \$(seq 1 20); do
  pgrep plasma-discover >/dev/null && break
  sleep 1
done
sleep 2"
}

open_discover_installed() {
  open_discover_mode installed
}

discover_nav_tab() {
  local mode="$1"
  open_discover_mode "$mode"
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

open_spectacle() {
  prep_env 'killall spectacle 2>/dev/null || true
    sleep 0.5
    kstart spectacle >/dev/null 2>&1 &
    sleep 4'
}

open_kinfocenter() {
  prep_env 'killall kinfocenter 2>/dev/null || true
    sleep 0.5
    kstart kinfocenter >/dev/null 2>&1 &
    sleep 4'
}

open_system_monitor() {
  prep_env 'killall plasma-systemmonitor 2>/dev/null || true
    sleep 0.5
    kstart plasma-systemmonitor >/dev/null 2>&1 &
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
  dolphin_set_view_mode icons
  dolphin_trigger_action toggle_search
  sleep 1.5
  shot "$DEST/vm-dolphin-search-open.png"
  reset_apps
}

capture_dolphin_search_filter_shots() {
  reset_apps
  sleep 1
  open_dolphin
  dolphin_set_view_mode icons
  dolphin_trigger_action toggle_search
  sleep 1
  dolphin_trigger_action toggle_filter
  sleep 1.2
  shot "$DEST/vm-dolphin-search-filter-open.png"
  reset_apps
}

capture_dolphin_hamburger_shots() {
  reset_apps
  sleep 1
  open_dolphin
  dolphin_set_view_mode icons
  dolphin_trigger_action hamburger_menu
  sleep 1.5
  shot "$DEST/vm-dolphin-hamburger-open.png"
  reset_apps
}

if $DOLPHIN_HAMBURGER; then
  capture_dolphin_hamburger_shots
  echo "=== Terminé : vm-dolphin-hamburger-open.png (--dolphin-hamburger) ==="
  exit 0
fi

if $DOLPHIN_SEARCH_FILTER; then
  capture_dolphin_search_filter_shots
  echo "=== Terminé : vm-dolphin-search-filter-open.png (--dolphin-search-filter) ==="
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

open_discover_app() {
  local uri="$1"
  prep_env "killall plasma-discover konsole firefox dolphin 2>/dev/null || true
    sleep 0.5
    kstart plasma-discover --application ${uri} >/dev/null 2>&1 &
    for i in \$(seq 1 25); do
      pgrep plasma-discover >/dev/null && break
      sleep 1
    done
    sleep 8"
}

scroll_discover_detail() {
  prep_env "SCRIPT=/tmp/capsuleos-discover-scroll-kwin.js
    cat > \"\$SCRIPT\" <<'KWINJS'
var ws = workspace;
var target = null;
for (var i = 0; i < ws.windowList().length; i++) {
    var w = ws.windowList()[i];
    var cap = w.caption || \"\";
    if (cap.indexOf(\"VLC\") >= 0 && cap.indexOf(\"Discover\") >= 0) {
        target = w;
        break;
    }
}
if (target) {
    ws.activeWindow = target;
}
KWINJS
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript capsuleos-discover-scroll 2>/dev/null || true
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.loadScript \"\$SCRIPT\" capsuleos-discover-scroll >/dev/null 2>&1
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.start >/dev/null 2>&1
    sleep 0.3
    for i in 1 2 3 4; do
      xdotool key Page_Down 2>/dev/null || true
      sleep 0.15
    done
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript capsuleos-discover-scroll 2>/dev/null || true"
}

discover_open_vlc_from_home() {
  # --application appstream://… provoque un segfault sur la VM lab (juin 2026) — recherche UI.
  prep_env 'sleep 1
    if command -v wtype >/dev/null 2>&1; then
      wtype -M ctrl f
      sleep 0.4
      wtype VLC
      sleep 0.6
      wtype -k Return
      sleep 2
      wtype -k Return
      sleep 2
    elif command -v xdotool >/dev/null 2>&1; then
      xdotool key ctrl+f
      sleep 0.4
      xdotool type --delay 25 VLC
      sleep 0.5
      xdotool key Return
      sleep 2
      xdotool key Return
      sleep 2
    fi'
}

capture_discover_detail_shots() {
  reset_apps
  sleep 1
  open_discover
  discover_stabilize_for_shot 4
  discover_open_vlc_from_home
  sleep 2
  discover_stabilize_for_shot 2
  shot "$DEST/vm-discover-detail-vlc.png"
  scroll_discover_detail
  sleep 0.6
  discover_stabilize_for_shot 1
  shot "$DEST/vm-discover-detail-vlc-scrolled.png"
  reset_apps
}

capture_discover_detail_live() {
  discover_stabilize_for_shot 2
  shot "$DEST/vm-discover-detail-vlc.png"
  scroll_discover_detail
  sleep 0.6
  discover_stabilize_for_shot 1
  shot "$DEST/vm-discover-detail-vlc-scrolled.png"
}

capture_discover_tab_shot() {
  local mode="$1"
  local outfile="$2"
  local wait_secs="${3:-10}"
  reset_apps
  sleep 2
  if [ -z "$mode" ] || [ "$mode" = "home" ]; then
    open_discover
  else
    discover_nav_tab "$mode"
  fi
  discover_stabilize_for_shot "$wait_secs"
  shot "$DEST/$outfile"
  reset_apps
}

capture_discover_g6_shots() {
  capture_discover_tab_shot home vm-discover.png 5
  capture_discover_tab_shot installed vm-discover-installed.png 5
  capture_discover_tab_shot update vm-discover-updates.png 4
  capture_discover_tab_shot settings vm-discover-config.png 4
  capture_discover_tab_shot about vm-discover-about.png 4
}

discover_unmaximize_window() {
  prep_env 'SCRIPT=/tmp/capsuleos-discover-unmax.js
    cat > "$SCRIPT" <<'"'"'KWINJS'"'"'
var ws = workspace;
var windows = ws.windowList();
for (var i = 0; i < windows.length; i++) {
    var w = windows[i];
    var cap = w.caption || "";
    if (cap.indexOf("Discover") >= 0 && cap.indexOf("Problème") < 0 && cap.indexOf("VLC") < 0) {
        w.minimized = false;
        w.maximized = false;
        ws.activeWindow = w;
        break;
    }
}
KWINJS
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript capsuleos-discover-unmax >/dev/null 2>&1 || true
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.loadScript "$SCRIPT" capsuleos-discover-unmax >/dev/null 2>&1
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.start >/dev/null 2>&1
    sleep 0.4
    qdbus6 org.kde.KWin /Scripting org.kde.kwin.Scripting.unloadScript capsuleos-discover-unmax >/dev/null 2>&1 || true'
}

capture_discover_installed_windowed_shot() {
  reset_apps
  sleep 2
  discover_nav_tab installed
  discover_stabilize_for_shot 5
  discover_unmaximize_window
  sleep 0.8
  discover_stabilize_for_shot 1
  shot "$DEST/vm-discover-installed-windowed.png"
  reset_apps
}

capture_discover_search_vlc_shot() {
  reset_apps
  sleep 1
  open_discover
  discover_stabilize_for_shot 5
  prep_env 'sleep 0.5
    if command -v wtype >/dev/null 2>&1; then
      wtype -M ctrl f
      sleep 0.4
      wtype VLC
      sleep 1.2
    elif command -v xdotool >/dev/null 2>&1; then
      xdotool key ctrl+f
      sleep 0.4
      xdotool type --delay 25 VLC
      sleep 1.2
    fi'
  discover_stabilize_for_shot 1
  shot "$DEST/vm-discover-search-vlc.png"
  reset_apps
}

capture_discover_category_internet_shot() {
  reset_apps
  sleep 1
  open_discover
  discover_stabilize_for_shot 5
  prep_env 'WID=$(xdotool search --name "Discover" 2>/dev/null | head -1)
    if [ -n "$WID" ]; then
      xdotool windowactivate --sync "$WID" 2>/dev/null || true
      sleep 0.4
      xdotool mousemove --window "$WID" 130 300 click 1
      sleep 0.6
      xdotool mousemove --window "$WID" 130 430 click 1
      sleep 1.5
    fi'
  discover_stabilize_for_shot 1
  shot "$DEST/vm-discover-category-internet.png"
  reset_apps
}

capture_discover_recursive_shots() {
  capture_discover_g6_shots
  capture_discover_detail_shots
  capture_discover_search_vlc_shot
  capture_discover_category_internet_shot
  capture_discover_installed_windowed_shot
}

if $DOLPHIN_G5; then
  capture_dolphin_view_shots
  capture_dolphin_search_shots
  capture_dolphin_search_filter_shots
  capture_dolphin_hamburger_shots
  echo "=== Terminé : dolphin G5 (vues + search + filtre + hamburger) ==="
  exit 0
fi

if $B2_B3_APPS; then
  reset_apps
  sleep 1
  open_spectacle
  shot "$DEST/vm-spectacle.png"
  reset_apps
  sleep 1
  open_kinfocenter
  shot "$DEST/vm-kinfocenter.png"
  reset_apps
  sleep 1
  open_system_monitor
  shot "$DEST/vm-system-monitor.png"
  reset_apps
  echo "=== Terminé : vm-spectacle.png, vm-kinfocenter.png, vm-system-monitor.png (--b2-b3-apps) ==="
  exit 0
fi

if $DISCOVER_RECURSIVE; then
  capture_discover_recursive_shots
  echo "=== Terminé : discover récursif (G6 + VLC + recherche + catégorie + installé fenêtré) ==="
  exit 0
fi

if $DISCOVER_VM_100; then
  capture_discover_g6_shots
  capture_discover_detail_shots
  echo "=== Terminé : discover VM-100 (G6 + fiche VLC) ==="
  exit 0
fi

if $DISCOVER_G6; then
  capture_discover_g6_shots
  echo "=== Terminé : discover G6 (accueil + installé + MAJ + config + à propos) ==="
  exit 0
fi

if $FIREFOX_G7; then
  reset_apps
  sleep 1
  open_firefox
  shot "$DEST/vm-firefox.png"
  reset_apps
  echo "=== Terminé : vm-firefox.png (--firefox-g7) ==="
  exit 0
fi

if $PANEL_G8; then
  remote_session 'killall plasma-discover dolphin konsole spectacle kinfocenter plasma-systemmonitor 2>/dev/null || true
pkill -9 -f firefox 2>/dev/null || true
sleep 3'
  shot "$DEST/vm-desktop.png"
  open_kickoff
  sleep 2
  shot "$DEST/vm-kickoff.png"
  close_kickoff
  reset_apps
  echo "=== Terminé : vm-desktop.png + vm-kickoff.png (--panel-g8) ==="
  exit 0
fi

if $DISCOVER_HOME; then
  capture_discover_tab_shot home vm-discover.png 5
  echo "=== Terminé : vm-discover.png (--discover-home) ==="
  exit 0
fi

if $DISCOVER_DETAIL_LIVE; then
  capture_discover_detail_live
  echo "=== Terminé : vm-discover-detail-vlc.png + scrolled (--discover-detail-live) ==="
  exit 0
fi

if $DISCOVER_DETAIL; then
  capture_discover_detail_shots
  echo "=== Terminé : vm-discover-detail-vlc.png + scrolled (--discover-detail) ==="
  exit 0
fi

if $DISCOVER_UPDATES; then
  capture_discover_tab_shot update vm-discover-updates.png 4
  echo "=== Terminé : vm-discover-updates.png (--discover-updates) ==="
  exit 0
fi

if $DISCOVER_CONFIG; then
  capture_discover_tab_shot settings vm-discover-config.png 4
  echo "=== Terminé : vm-discover-config.png (--discover-config) ==="
  exit 0
fi

if $DISCOVER_ABOUT; then
  capture_discover_tab_shot about vm-discover-about.png 4
  echo "=== Terminé : vm-discover-about.png (--discover-about) ==="
  exit 0
fi

reset_apps
sleep 1

shot "$DEST/vm-desktop.png"

open_kickoff
sleep 2
shot "$DEST/vm-kickoff.png"

close_kickoff
capture_discover_tab_shot home vm-discover.png 5

capture_discover_tab_shot installed vm-discover-installed.png 5

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
