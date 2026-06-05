#!/usr/bin/env bash
# Sonde lab CapsuleOS — GNOME Shell (Nautilus, Firefox, Ptyxis).
# Schéma JSON aligné sur os-probe.sh (slots nemo / firefox / terminal) pour compare-os-parity.
#
# Usage: os-probe-gnome.sh state | action <name> [arg]
# Prérequis: wmctrl, xdotool, xprop — DISPLAY + XAUTHORITY (Wayland/Xwayland).
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"
DISPLAY="${DISPLAY:-:0}"
export DISPLAY

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

require_cmd() {
  local c="$1"
  if ! command -v "$c" >/dev/null 2>&1; then
    echo "{\"error\":\"missing_cmd\",\"cmd\":\"$c\"}" >&2
    exit 2
  fi
}

wmctrl_list() {
  wmctrl -lx 2>/dev/null || true
}

active_window_id() {
  local wid
  wid=$(xdotool getactivewindow 2>/dev/null || echo "")
  if [[ -z "$wid" || "$wid" == "0" ]]; then
    wid=$(xdotool getwindowfocus 2>/dev/null || echo "")
  fi
  echo "$wid"
}

window_ids_match() {
  local a="$1" b="$2"
  [[ -n "$a" && -n "$b" ]] || return 1
  local na nb
  na=$(printf '%d' "$a" 2>/dev/null || echo "$a")
  nb=$(printf '%d' "$b" 2>/dev/null || echo "$b")
  [[ "$na" == "$nb" ]]
}

window_wm_class() {
  local wid="$1"
  if [[ -z "$wid" ]]; then
    echo ""
    return
  fi
  local raw
  raw=$(xprop -id "$wid" WM_CLASS 2>/dev/null | sed -n 's/^WM_CLASS(STRING) = "\([^"]*\)".*/\1/p')
  if [[ -z "$raw" ]]; then
    raw=$(xprop -id "$wid" WM_CLASS 2>/dev/null | sed -n 's/.*"\([^"]*\)".*/\1/p' | tail -1)
  fi
  echo "$raw"
}

# Slots CapsuleOS (nemo = gabarit Nautilus / Fichiers)
launcher_slot_from_class() {
  local cls="${1,,}"
  case "$cls" in
    *nautilus*) echo "nemo" ;;
    *org.gnome.nautilus*) echo "nemo" ;;
    *firefox*) echo "firefox" ;;
    *navigator*) echo "firefox" ;;
    *ptyxis*) echo "terminal" ;;
    *gnome-terminal*) echo "terminal" ;;
    *org.gnome.terminal*) echo "terminal" ;;
    *org.gnome.ptyxis*) echo "terminal" ;;
    *) echo "" ;;
  esac
}

process_running_slot() {
  local slot="$1"
  case "$slot" in
    nemo) pgrep -x nautilus >/dev/null 2>&1 || pgrep -f org.gnome.Nautilus >/dev/null 2>&1 ;;
    firefox) pgrep -x firefox >/dev/null 2>&1 ;;
    terminal) pgrep -x ptyxis >/dev/null 2>&1 || pgrep -x gnome-terminal >/dev/null 2>&1 ;;
    *) return 1 ;;
  esac
}

gnome_color_scheme() {
  gsettings get org.gnome.desktop.interface color-scheme 2>/dev/null | tr -d "'" || echo "unknown"
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

state_gnome() {
  require_cmd wmctrl
  require_cmd xdotool
  require_cmd xprop

  local ts wid focus_cls focus_title
  ts=$(timestamp_utc)
  wid=$(active_window_id)
  focus_cls=$(window_wm_class "$wid")
  focus_title=$(xprop -id "$wid" WM_NAME 2>/dev/null | sed 's/^WM_NAME(UTF8_STRING) = "\(.*\)"$/\1/' | sed 's/^WM_NAME(STRING) = "\(.*\)"$/\1/' || echo "")
  if [[ -z "$focus_title" ]]; then
    focus_title=$(wmctrl -lp 2>/dev/null | awk -v w="$wid" '$1==w {for(i=5;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')
  fi

  local focus_slot
  focus_slot=$(launcher_slot_from_class "$focus_cls")

  local -A running=()
  local wmctrl_has_lines="false"
  if wmctrl -lx 2>/dev/null | grep -qE '[0-9a-fx]+[[:space:]]+'; then
    wmctrl_has_lines="true"
  fi
  local windows_json=""
  local line id title cls slot state
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    id=$(echo "$line" | awk '{print $1}')
    title=$(echo "$line" | awk '{for(i=5;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')
    cls=$(echo "$line" | awk '{print $3}')
    slot=$(launcher_slot_from_class "$cls")
    [[ -z "$slot" ]] && continue
    running["$slot"]=1
    state="normal"
    if [[ "$id" == "$wid" ]]; then state="focused"; fi
    windows_json="${windows_json}{\"id\":\"$(json_escape "$id")\",\"title\":\"$(json_escape "$title")\",\"wmClass\":\"$(json_escape "$cls")\",\"slot\":\"$slot\",\"state\":\"$state\"},"
  done < <(wmctrl_list)
  windows_json="[${windows_json%,}]"

  local launchers_json=""
  for slot in nemo firefox terminal; do
    local run="false" act="false"
    local slot_wid
    if [[ -n "${running[$slot]:-}" ]]; then
      run="true"
    elif [[ "$wmctrl_has_lines" == "false" ]] && process_running_slot "$slot"; then
      run="true"
    fi
    if [[ "$focus_slot" == "$slot" ]]; then
      act="true"
    elif [[ -n "$wid" ]]; then
      slot_wid=$(wmctrl_id_for_slot "$slot")
      if window_ids_match "$wid" "$slot_wid"; then
        act="true"
      fi
    fi
    launchers_json="${launchers_json}\"${slot}\":{\"running\":${run},\"active\":${act}},"
  done
  launchers_json="{${launchers_json%,}}"

  local scheme
  scheme=$(gnome_color_scheme)
  local theme_hint="dark"
  if [[ "$scheme" == *light* ]]; then theme_hint="light"; fi

  local focus_json
  if [[ -n "$focus_slot" ]]; then
    focus_json="{\"wmClass\":\"$(json_escape "$focus_cls")\",\"slot\":\"$focus_slot\",\"title\":\"$(json_escape "$focus_title")\"}"
  else
    focus_json="null"
  fi

  local explorer_path=""
  local nav_line
  nav_line=$(wmctrl -lx 2>/dev/null | grep -iE '\.nautilus|org\.gnome\.Nautilus' | grep -vi 'desktop' | tail -1 || true)
  if [[ -n "$nav_line" ]]; then
    explorer_path=$(echo "$nav_line" | awk '{for(i=5;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')
  fi

  printf '{"toolkit":"gnome","timestamp":"%s","colorScheme":"%s","capsuleThemeHint":"%s","focused":%s,"windows":%s,"launchers":%s,"explorer":{"nemo":{"currentPath":"%s"}},"actions":{"last":"state"}}\n' \
    "$ts" "$(json_escape "$scheme")" "$theme_hint" "$focus_json" "$windows_json" "$launchers_json" "$(json_escape "$explorer_path")"
}

open_files() {
  if command -v nautilus >/dev/null 2>&1; then
    nohup nautilus >/dev/null 2>&1 &
  elif command -v org.gnome.Nautilus >/dev/null 2>&1; then
    nohup org.gnome.Nautilus >/dev/null 2>&1 &
  else
    echo "{\"error\":\"missing_app\",\"app\":\"nautilus\"}" >&2
    exit 1
  fi
}

open_terminal() {
  if command -v ptyxis >/dev/null 2>&1; then
    nohup ptyxis >/dev/null 2>&1 &
  elif command -v gnome-terminal >/dev/null 2>&1; then
    nohup gnome-terminal >/dev/null 2>&1 &
  else
    nohup xterm >/dev/null 2>&1 &
  fi
}

action_open_launcher() {
  local slot="$1"
  case "$slot" in
    nemo) open_files ;;
    firefox) nohup firefox >/dev/null 2>&1 & ;;
    terminal) open_terminal ;;
    *) echo "{\"error\":\"unknown_slot\",\"slot\":\"$slot\"}" >&2; exit 1 ;;
  esac
  if [[ "$slot" == "firefox" ]]; then
    sleep 2.5
  else
    sleep 1.2
  fi
}

wmctrl_id_for_slot() {
  local slot="$1"
  wmctrl -lx 2>/dev/null | while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local cls
    cls=$(echo "$line" | awk '{print $3}')
    if [[ "$(launcher_slot_from_class "$cls")" == "$slot" ]]; then
      echo "$line" | awk '{print $1}'
      break
    fi
  done
}

action_focus_launcher() {
  local slot="$1"
  local wid
  wid=$(wmctrl_id_for_slot "$slot")
  if [[ -z "$wid" ]]; then
    action_open_launcher "$slot"
    wid=$(wmctrl_id_for_slot "$slot")
  fi
  case "$slot" in
    firefox)
      wmctrl -xa 'Navigator.firefox' 2>/dev/null || wmctrl -xa firefox 2>/dev/null || true
      ;;
    nemo)
      wmctrl -xa org.gnome.Nautilus.nautilus 2>/dev/null || true
      ;;
    terminal)
      wmctrl -xa org.gnome.ptyxis 2>/dev/null || wmctrl -xa org.gnome.Terminal 2>/dev/null || true
      ;;
  esac
  if [[ -n "$wid" ]]; then
    wmctrl -ia "$wid" 2>/dev/null || wmctrl -i -a "$wid" 2>/dev/null || true
    xdotool windowactivate "$wid" 2>/dev/null || true
  fi
  if [[ "$slot" == "firefox" ]]; then
    sleep 1.2
  else
    sleep 0.8
  fi
}

action_minimize_launcher() {
  local slot="$1"
  local wid
  wid=$(wmctrl_id_for_slot "$slot")
  if [[ -n "$wid" ]]; then
    wmctrl -ir "$wid" -b add,hidden 2>/dev/null || xdotool windowminimize "$wid" 2>/dev/null || true
  fi
  sleep 0.5
}

action_nemo_sidebar() {
  local folder="$1"
  action_focus_launcher nemo
  sleep 0.3
  nohup nautilus "$HOME/${folder}" >/dev/null 2>&1 &
  sleep 0.6
}

run_action() {
  local name="$1"
  shift
  case "$name" in
    open-launcher) action_open_launcher "$1" ;;
    focus-launcher) action_focus_launcher "$1" ;;
    minimize-launcher) action_minimize_launcher "$1" ;;
    nemo-sidebar) action_nemo_sidebar "$1" ;;
    *)
      echo "{\"error\":\"unknown_action\",\"action\":\"$name\"}" >&2
      exit 1
      ;;
  esac
  state_gnome
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    state) state_gnome ;;
    action) run_action "$@" ;;
    *)
      echo "Usage: $0 state | action <open-launcher|focus-launcher|minimize-launcher|nemo-sidebar> <arg>" >&2
      exit 1
      ;;
  esac
}

main "$@"
