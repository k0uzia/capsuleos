#!/usr/bin/env bash
# Sonde lab CapsuleOS — état fenêtres / lanceurs (Cinnamon P0).
# Usage: os-probe.sh state | action <name> [arg]
set -euo pipefail

DISPLAY="${DISPLAY:-:0}"
export DISPLAY

TOOLKIT="${CAPSULE_PROBE_TOOLKIT:-cinnamon}"

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
  xdotool getactivewindow 2>/dev/null || echo ""
}

window_wm_class() {
  local wid="$1"
  if [[ -z "$wid" ]]; then
    echo ""
    return
  fi
  local raw
  raw=$(xprop -id "$wid" WM_CLASS 2>/dev/null | sed -n 's/^WM_CLASS(STRING) = "\([^"]*\)", "\([^"]*\)".*/\1 \2/p')
  if [[ -z "$raw" ]]; then
    raw=$(xprop -id "$wid" WM_CLASS 2>/dev/null | sed -n 's/^WM_CLASS(STRING) = "\([^"]*\)".*/\1/p')
  fi
  if [[ -z "$raw" ]]; then
    raw=$(xprop -id "$wid" WM_CLASS 2>/dev/null | sed -n 's/.*"\([^"]*\)".*/\1/p' | tail -1)
  fi
  echo "$raw"
}

launcher_slot_from_class() {
  local cls="${1,,}"
  case "$cls" in
    *nemo-desktop*) echo "" ;;
    *nemo*) echo "nemo" ;;
    *navigator*) echo "firefox" ;;
    *firefox*) echo "firefox" ;;
    *terminal*|*gnome-terminal*|*mate-terminal*|*xterm*) echo "terminal" ;;
    *) echo "" ;;
  esac
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

state_cinnamon() {
  require_cmd wmctrl
  require_cmd xdotool
  require_cmd xprop

  local ts wid focus_cls focus_title focus_slot
  ts=$(timestamp_utc)
  wid=$(active_window_id)
  focus_cls=$(window_wm_class "$wid")
  focus_slot=$(launcher_slot_from_class "$focus_cls")
  if [[ -z "$focus_slot" ]]; then
    local cls_part
    for cls_part in $focus_cls; do
      focus_slot=$(launcher_slot_from_class "$cls_part")
      [[ -n "$focus_slot" ]] && break
    done
  fi
  focus_title=$(xprop -id "$wid" WM_NAME 2>/dev/null | sed 's/^WM_NAME(UTF8_STRING) = "\(.*\)"$/\1/' | sed 's/^WM_NAME(STRING) = "\(.*\)"$/\1/' || echo "")
  if [[ -z "$focus_title" ]]; then
    focus_title=$(wmctrl -lp 2>/dev/null | awk -v w="$wid" '$1==w {for(i=5;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')
  fi

  local -A running=()
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
    if [[ -n "${running[$slot]:-}" ]]; then run="true"; fi
    if [[ "$focus_slot" == "$slot" ]]; then act="true"; fi
    launchers_json="${launchers_json}\"${slot}\":{\"running\":${run},\"active\":${act}},"
  done
  launchers_json="{${launchers_json%,}}"

  local focus_json
  if [[ -n "$focus_slot" ]]; then
    focus_json="{\"wmClass\":\"$(json_escape "$focus_cls")\",\"slot\":\"$focus_slot\",\"title\":\"$(json_escape "$focus_title")\"}"
  else
    focus_json="null"
  fi

  local explorer_path=""
  local nemo_line nemo_title
  if [[ "$focus_slot" == "nemo" && -n "$wid" ]]; then
    explorer_path=$(wmctrl -lp 2>/dev/null | awk -v w="$wid" '$1==w {for(i=5;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')
  fi
  if [[ -z "$explorer_path" ]]; then
    while IFS= read -r nemo_line; do
      [[ -z "$nemo_line" ]] && continue
      nemo_title=$(echo "$nemo_line" | awk '{for(i=5;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')
      if echo "$nemo_title" | grep -qiE 'documents|document'; then
        explorer_path="$nemo_title"
        break
      fi
    done < <(wmctrl -lx 2>/dev/null | grep -i '\.Nemo' | grep -vi 'nemo-desktop' || true)
  fi
  if [[ -z "$explorer_path" ]]; then
    nemo_line=$(wmctrl -lx 2>/dev/null | grep -i '\.Nemo' | grep -vi 'nemo-desktop' | tail -1 || true)
    if [[ -n "$nemo_line" ]]; then
      explorer_path=$(echo "$nemo_line" | awk '{for(i=5;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')
    fi
  fi

  printf '{"toolkit":"cinnamon","timestamp":"%s","focused":%s,"windows":%s,"launchers":%s,"explorer":{"nemo":{"currentPath":"%s"}},"actions":{"last":"state"}}\n' \
    "$ts" "$focus_json" "$windows_json" "$launchers_json" "$(json_escape "$explorer_path")"
}

action_open_launcher() {
  local slot="$1"
  case "$slot" in
    nemo) nohup nemo >/dev/null 2>&1 & ;;
    firefox) nohup firefox >/dev/null 2>&1 & ;;
    terminal)
      if command -v gnome-terminal >/dev/null 2>&1; then
        nohup gnome-terminal >/dev/null 2>&1 &
      elif command -v x-terminal-emulator >/dev/null 2>&1; then
        nohup x-terminal-emulator >/dev/null 2>&1 &
      else
        nohup xterm >/dev/null 2>&1 &
      fi
      ;;
    *) echo "{\"error\":\"unknown_slot\",\"slot\":\"$slot\"}" >&2; exit 1 ;;
  esac
  if [[ "$slot" == "firefox" ]]; then
    sleep 2.5
  else
    sleep 0.8
  fi
}

wmctrl_id_for_slot() {
  local slot="$1"
  wmctrl -lx 2>/dev/null | while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local cls
    cls=$(echo "$line" | awk '{print $3}')
    [[ "${cls,,}" == *nemo-desktop* ]] && continue
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
  if [[ "$slot" == "firefox" ]]; then
    wmctrl -xa 'Navigator.firefox' 2>/dev/null || wmctrl -xa firefox 2>/dev/null || true
  elif [[ -n "$wid" ]]; then
    wmctrl -ia "$wid" 2>/dev/null || wmctrl -i -a "$wid" 2>/dev/null || true
    xdotool windowactivate "$wid" 2>/dev/null || true
  fi
  if [[ "$slot" == "firefox" ]]; then
    sleep 1.2
  else
    sleep 0.5
  fi
}

action_minimize_launcher() {
  local slot="$1"
  local line id cls
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    cls=$(echo "$line" | awk '{print $3}')
    [[ "$(launcher_slot_from_class "$cls")" != "$slot" ]] && continue
    id=$(echo "$line" | awk '{print $1}')
    wmctrl -ir "$id" -b add,hidden 2>/dev/null || xdotool windowminimize "$id" 2>/dev/null || true
  done < <(wmctrl -lx 2>/dev/null)
  sleep 0.35
  local other
  for other in firefox terminal nemo; do
    if [[ "$other" != "$slot" ]]; then
      local owid
      owid=$(wmctrl_id_for_slot "$other")
      if [[ -n "$owid" ]]; then
        action_focus_launcher "$other"
        return
      fi
    fi
  done
  xdotool key super+d 2>/dev/null || true
  sleep 0.35
}

action_nemo_sidebar() {
  local folder="$1"
  local wid
  wid=$(wmctrl_id_for_slot nemo)
  if [[ -n "$wid" ]]; then
    wmctrl -ir "$wid" -b remove,hidden 2>/dev/null || true
    wmctrl -ia "$wid" 2>/dev/null || true
    xdotool windowactivate "$wid" 2>/dev/null || true
    sleep 0.35
  fi
  nohup nemo "$HOME/${folder}" >/dev/null 2>&1 &
  sleep 1.0
  wid=$(wmctrl -lx 2>/dev/null | grep -i '\.Nemo' | grep -vi 'nemo-desktop' | while IFS= read -r line; do
    local title
    title=$(echo "$line" | awk '{for(i=5;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')
    if echo "$title" | grep -qiE "${folder,,}|documents|document"; then
      echo "$line" | awk '{print $1}'
      break
    fi
  done)
  if [[ -n "$wid" ]]; then
    wmctrl -ia "$wid" 2>/dev/null || true
    xdotool windowactivate "$wid" 2>/dev/null || true
  fi
  sleep 0.5
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
  state_cinnamon
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    state)
      case "$TOOLKIT" in
        cinnamon) state_cinnamon ;;
        *)
          echo "{\"error\":\"unsupported_toolkit\",\"toolkit\":\"$TOOLKIT\"}" >&2
          exit 1
          ;;
      esac
      ;;
    action)
      run_action "$@"
      ;;
    *)
      echo "Usage: $0 state | action <open-launcher|focus-launcher|minimize-launcher|nemo-sidebar> <arg>" >&2
      exit 1
      ;;
  esac
}

main "$@"
