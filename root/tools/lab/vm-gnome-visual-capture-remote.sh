#!/usr/bin/env bash
# Captures VM GNOME via SSH (repli virsh) — PNG + journal événements JSONL.
# Usage VM direct :
#   VISUAL_PREFIX=ubuntu VISUAL_OUT=/tmp/capsule-visual-parity bash vm-gnome-visual-capture-remote.sh
# Usage hôte (via run-visual-parity-pass.mjs) :
#   ssh capsule@IP 'VISUAL_PREFIX=ubuntu VISUAL_OUT=/tmp/capsule-visual-parity bash -s' < vm-gnome-visual-capture-remote.sh
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"
export DISPLAY="${DISPLAY:-:0}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
if [[ -z "${XAUTHORITY:-}" ]]; then
  XAUTHORITY=$(ls /run/user/"$(id -u)"/.mutter-Xwaylandauth.* 2>/dev/null | head -1 || true)
  export XAUTHORITY
fi

PREFIX="${VISUAL_PREFIX:-ubuntu}"
OUT="${VISUAL_OUT:-/tmp/capsule-visual-parity}"
EVENTS="${OUT}/events.jsonl"
mkdir -p "$OUT/audit"

log_event() {
  local step="$1" action="$2" file="$3" ok="$4" bytes="${5:-0}"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '%s\n' "{\"phase\":\"vm\",\"method\":\"ssh-screenshot\",\"step\":\"${step}\",\"action\":\"${action}\",\"file\":\"${file}\",\"ok\":${ok},\"bytes\":${bytes},\"timestamp\":\"${ts}\"}" >>"$EVENTS"
}

capture_screen() {
  local out="$1"
  if gdbus call --session --dest org.gnome.Shell.Screenshot --object-path /org/gnome/Shell/Screenshot \
    --method org.gnome.Shell.Screenshot.Screenshot false false "$out" 2>/dev/null; then
    return 0
  fi
  if command -v gnome-screenshot >/dev/null; then
    gnome-screenshot -f "$out" 2>/dev/null && return 0
  fi
  if command -v import >/dev/null; then
    import -window root "$out" 2>/dev/null && return 0
  fi
  return 1
}

overview_open() {
  gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
    --method org.gnome.Shell.Eval "s:Main.overview.show()" >/dev/null 2>&1 \
    || xdotool key super 2>/dev/null || true
}

overview_hide() {
  gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
    --method org.gnome.Shell.Eval "s:Main.overview.hide()" >/dev/null 2>&1 \
    || xdotool key Escape 2>/dev/null || true
}

focus_slot() {
  case "$1" in
    nautilus) wmctrl -xa org.gnome.Nautilus 2>/dev/null || true ;;
    firefox) wmctrl -xa Navigator.firefox 2>/dev/null || wmctrl -xa firefox.Firefox 2>/dev/null || true ;;
    text_editor) wmctrl -xa org.gnome.TextEditor 2>/dev/null || true ;;
    calculator) wmctrl -xa org.gnome.Calculator 2>/dev/null || true ;;
  esac
}

shot() {
  local step="$1" action="$2" rel="$3"
  local file="$OUT/$rel"
  mkdir -p "$(dirname "$file")"
  sleep 0.8
  if capture_screen "$file"; then
    log_event "$step" "$action" "$rel" true "$(wc -c <"$file" 2>/dev/null || echo 0)"
    echo "  ✓ $rel"
  else
    log_event "$step" "$action" "$rel" false 0
    echo "  ✗ $rel" >&2
    return 1
  fi
}

: >"$EVENTS"
echo "=== visual-capture-remote ($PREFIX) → $OUT ==="

overview_hide
gsettings set org.gnome.desktop.interface color-scheme prefer-dark 2>/dev/null || true
sleep 1.5
shot dark-desktop "color-scheme prefer-dark; screenshot bureau" "${PREFIX}-dark-desktop.png" || true

overview_open
sleep 1.2
shot dark-overview "Main.overview.show(); screenshot" "audit/${PREFIX}-dark-overview.png" || true

overview_hide
nohup nautilus >/dev/null 2>&1 & sleep 2.5
focus_slot nautilus
shot dark-nautilus "nautilus + focus; screenshot" "${PREFIX}-dark-nautilus.png" || true

nohup firefox >/dev/null 2>&1 & sleep 3.5
focus_slot firefox
shot dark-firefox "firefox + focus; screenshot" "${PREFIX}-dark-firefox.png" || true

overview_hide
nohup gnome-text-editor >/dev/null 2>&1 & sleep 2.5
focus_slot text_editor
shot dark-text-editor "gnome-text-editor; screenshot" "${PREFIX}-dark-text-editor.png" || true

overview_hide
nohup gnome-calculator >/dev/null 2>&1 & sleep 2.5
focus_slot calculator
shot dark-calculator "gnome-calculator; screenshot" "${PREFIX}-dark-calculator.png" || true

overview_hide
gsettings set org.gnome.desktop.interface color-scheme prefer-light 2>/dev/null || true
sleep 1.5
shot light-desktop "color-scheme prefer-light; screenshot" "${PREFIX}-light-desktop.png" || true

focus_slot firefox
shot light-firefox "firefox focus; screenshot" "${PREFIX}-light-firefox.png" || true

nohup nautilus >/dev/null 2>&1 & sleep 2.5
focus_slot nautilus
shot light-nautilus "nautilus focus; screenshot" "${PREFIX}-light-nautilus.png" || true

overview_open
sleep 1.2
shot light-overview "overview clair; screenshot" "audit/${PREFIX}-light-overview.png" || true

gsettings set org.gnome.desktop.interface color-scheme default 2>/dev/null || true
overview_hide

count=$(find "$OUT" -name '*.png' 2>/dev/null | wc -l)
echo "=== Terminé : $count PNG · journal $EVENTS ==="
find "$OUT" -name '*.png' 2>/dev/null | sort || true
