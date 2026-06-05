#!/usr/bin/env bash
# Snapshot thème GNOME VM Rocky → JSON (couleurs / gsettings pour tokens CapsuleOS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${1:-$ROOT/root/docs/inventaires/linux-rocky-vm-theme.json}"
SSH_TARGET="${ROCKY_SSH:-capsule@192.168.122.234}"
IDENTITY="${ROCKY_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")

read -r -d '' REMOTE_SCRIPT <<'EOS' || true
set -e
accent=$(gsettings get org.gnome.desktop.interface accent-color 2>/dev/null | tr -d "'")
scheme=$(gsettings get org.gnome.desktop.interface color-scheme 2>/dev/null | tr -d "'")
gtk=$(gsettings get org.gnome.desktop.interface gtk-theme 2>/dev/null | tr -d "'")
icons=$(gsettings get org.gnome.desktop.interface icon-theme 2>/dev/null | tr -d "'")
bg=$(gsettings get org.gnome.desktop.background picture-uri 2>/dev/null | tr -d "'")
printf '{"accent":"%s","colorScheme":"%s","gtkTheme":"%s","iconTheme":"%s","backgroundUri":"%s"}' \
  "$accent" "$scheme" "$gtk" "$icons" "$bg"
EOS

payload=$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s <<<"$REMOTE_SCRIPT")
node -e "
const fs = require('fs');
const vm = JSON.parse(process.argv[1]);
const doc = {
  collectedAt: new Date().toISOString(),
  registryId: 'linux-rocky',
  ssh: '$SSH_TARGET',
  vm,
  capsuleMapping: {
    accentCss: '#3584e4',
    wallpaperDark: 'usr/share/capsuleos/assets/images/vendors/rocky/wallpaper/rocky-default-10-gemstone-skies-night.png',
    wallpaperLight: 'usr/share/capsuleos/assets/images/vendors/rocky/wallpaper/rocky-default-10-gemstone-skies-day.png',
    iconPack: 'icons/gnome/adwaita',
    explorerTemplate: 'nemo-gnome',
    nautilusChromeOnDarkDesktop: 'light (Adwaita default sous color-scheme default)',
  },
};
fs.writeFileSync(process.argv[2], JSON.stringify(doc, null, 2) + '\n');
console.log('OK', process.argv[2]);
" "$payload" "$OUT"
