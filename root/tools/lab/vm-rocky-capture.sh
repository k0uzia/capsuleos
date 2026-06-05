#!/usr/bin/env bash
# Captures VM Rocky (GNOME Shell Screenshot D-Bus) — sombre puis clair.
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"
export DISPLAY="${DISPLAY:-:0}"
if [[ -z "${XAUTHORITY:-}" ]] && compgen -G "/run/user/$(id -u)/.mutter-Xwaylandauth.*" >/dev/null; then
  export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
fi

OUT_DIR="${1:-/tmp/rocky-captures}"
mkdir -p "$OUT_DIR"

capture_screen() {
  local out="$1"
  gdbus call --session --dest org.gnome.Shell.Screenshot --object-path /org/gnome/Shell/Screenshot \
    --method org.gnome.Shell.Screenshot.Screenshot false false "$out"
}

capture_window() {
  local out="$1"
  gdbus call --session --dest org.gnome.Shell.Screenshot --object-path /org/gnome/Shell/Screenshot \
    --method org.gnome.Shell.Screenshot.ScreenshotWindow true false false "$out"
}

focus_app() {
  local pat="$1"
  wmctrl -lx 2>/dev/null | while read -r line; do
    echo "$line" | grep -qi "$pat" || continue
    local id
    id=$(echo "$line" | awk '{print $1}')
    wmctrl -ia "$id" 2>/dev/null || true
    sleep 0.8
    return 0
  done
}

# --- Sombre (default) ---
gsettings set org.gnome.desktop.interface color-scheme default 2>/dev/null || true
sleep 1.5
capture_screen "$OUT_DIR/rocky-dark-desktop.png"
sleep 0.5

nohup nautilus >/dev/null 2>&1 &
sleep 2
focus_app nautilus || true
capture_window "$OUT_DIR/rocky-dark-nautilus.png"
sleep 0.5

nohup firefox >/dev/null 2>&1 &
sleep 2.5
focus_app firefox || focus_app Navigator || true
capture_window "$OUT_DIR/rocky-dark-firefox.png"
sleep 0.5

nohup ptyxis >/dev/null 2>&1 &
sleep 2
focus_app ptyxis || focus_app Ptyxis || true
capture_window "$OUT_DIR/rocky-dark-ptyxis.png"
sleep 0.5

# --- Clair ---
gsettings set org.gnome.desktop.interface color-scheme prefer-light
sleep 2
capture_screen "$OUT_DIR/rocky-light-desktop.png"
sleep 0.5

focus_app firefox || true
capture_window "$OUT_DIR/rocky-light-firefox.png"
sleep 0.5

nohup nautilus >/dev/null 2>&1 &
sleep 2
focus_app nautilus || true
capture_window "$OUT_DIR/rocky-light-nautilus.png"

gsettings set org.gnome.desktop.interface color-scheme default 2>/dev/null || true

ls -la "$OUT_DIR"/*.png
