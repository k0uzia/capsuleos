#!/usr/bin/env bash
# Préparation d'état VM Mint pour captures Φ reproductibles (visual-scenes.json).
# Vérifie thème/résolution/fond et ferme les fenêtres parasites — sans sudo.
# Usage : bash root/tools/lab/vm-mint-scene-prep.sh [user@ip]
set -u

HOST="${1:-${CAPSULE_MINT_VM_SSH:-capsule@192.168.1.146}}"
SSH_ID="${CAPSULE_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"

run() {
  ssh -o BatchMode=yes -o ConnectTimeout=12 -i "$SSH_ID" "$HOST" \
    "export DISPLAY=:0 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/\$(id -u)/bus; $1"
}

echo "── État VM $HOST ──"

THEME=$(run "gsettings get org.cinnamon.desktop.interface gtk-theme")
CINNAMON_THEME=$(run "gsettings get org.cinnamon.theme name")
RES=$(run "xrandr 2>/dev/null | grep '\*' | awk '{print \$1}' | head -1")
BG=$(run "gsettings get org.cinnamon.desktop.background picture-uri")

echo "gtk-theme       : $THEME"
echo "cinnamon-theme  : $CINNAMON_THEME"
echo "résolution      : $RES"
echo "fond d'écran    : $BG"

FAIL=0
case "$THEME" in *Mint-Y-Dark-Aqua*) ;; *) echo "✗ gtk-theme attendu Mint-Y-Dark-Aqua"; FAIL=1;; esac
case "$RES" in 1280x800) ;; *) echo "✗ résolution attendue 1280x800"; FAIL=1;; esac

echo "── Fenêtres ouvertes ──"
run "wmctrl -l" | grep -v ' Bureau$' || true

if [ "${2:-}" = "--close-windows" ]; then
  echo "── Fermeture des fenêtres applicatives ──"
  run "wmctrl -l | grep -v ' Bureau\$' | awk '{print \$1}' | while read -r w; do wmctrl -i -c \"\$w\"; done; sleep 1; wmctrl -l"
fi

if [ "$FAIL" -ne 0 ]; then
  echo "✗ vm-mint-scene-prep : état VM non conforme"
  exit 1
fi
echo "✓ vm-mint-scene-prep OK — VM prête pour captures Φ"
