#!/usr/bin/env bash
# Récupère images et icônes ground truth depuis une VM lab (SCP).
# Convention : root/docs/convention-assets-depuis-vm.md
#
# Usage :
#   bash root/tools/lab/pull-vm-assets.sh --id linux-rocky
#   bash root/tools/lab/pull-vm-assets.sh --ssh capsule@192.168.122.234 --vendor rocky --toolkit gnome
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SSH_TARGET="${ROCKY_SSH:-capsule@192.168.122.234}"
IDENTITY="${ROCKY_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
VENDOR="rocky"
TOOLKIT="gnome"
ICON_THEME="Adwaita"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id)
      REGISTRY_ID="${2:-linux-rocky}"
      VENDOR="rocky"
      TOOLKIT="gnome"
      shift 2
      ;;
    --ssh) SSH_TARGET="$2"; shift 2 ;;
    --vendor) VENDOR="$2"; shift 2 ;;
    --toolkit) TOOLKIT="$2"; shift 2 ;;
    *) echo "Option inconnue: $1" >&2; exit 1 ;;
  esac
done

SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")
REMOTE=(ssh "${SSH_OPTS[@]}" "$SSH_TARGET")

ASSETS="$ROOT/usr/share/capsuleos/assets"
VENDOR_DIR="$ASSETS/images/vendors/$VENDOR"
PANEL_DIR="$VENDOR_DIR/panel"
WALL_DIR="$VENDOR_DIR/wallpaper"
GNOME_ICONS="$ASSETS/icons/gnome/adwaita"
PLACES_DIR="$GNOME_ICONS/places"
SYMBOLIC_ACTIONS="$GNOME_ICONS/symbolic/actions"
SYMBOLIC_PLACES="$GNOME_ICONS/symbolic/places"
SYMBOLIC_STATUS="$GNOME_ICONS/symbolic/status"
APPS_DIR="$GNOME_ICONS/apps"
TOOLKIT_APPS="$ASSETS/images/toolkits/gnome/apps"
DASH_DIR="$TOOLKIT_APPS/dash"

mkdir -p "$PANEL_DIR" "$WALL_DIR" "$PLACES_DIR" "$SYMBOLIC_ACTIONS" "$SYMBOLIC_PLACES" \
  "$SYMBOLIC_STATUS" "$APPS_DIR" "$DASH_DIR"

echo "=== Pull VM assets → $VENDOR ($SSH_TARGET) ==="

pull() {
  local remote="$1" local="$2"
  if "${REMOTE[@]}" "test -r '$remote'" 2>/dev/null; then
    scp "${SSH_OPTS[@]}" "$SSH_TARGET:$remote" "$local"
    echo "  ✓ $local"
  else
    echo "  ✗ absent: $remote" >&2
  fi
}

# Fond d'écran Rocky 10 (ground truth sombre)
pull /usr/share/backgrounds/rocky-default-10-gemstone-skies-night.png \
  "$WALL_DIR/rocky-default-10-gemstone-skies-night.png"
pull /usr/share/backgrounds/rocky-default-10-gemstone-skies-day.png \
  "$WALL_DIR/rocky-default-10-gemstone-skies-day.png"

# Lanceurs dock (Nautilus, Firefox, Ptyxis — pas Nemo)
pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Nautilus.svg \
  "$PANEL_DIR/org.gnome.Nautilus.svg"
pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Ptyxis.svg \
  "$PANEL_DIR/org.gnome.Ptyxis.svg"
pull /usr/share/icons/hicolor/48x48/apps/firefox.png \
  "$PANEL_DIR/firefox-48.png"
pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Nautilus.svg \
  "$TOOLKIT_APPS/files.svg"
pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Ptyxis.svg \
  "$TOOLKIT_APPS/terminal.svg"
pull /usr/share/icons/hicolor/256x256/apps/firefox.png \
  "$TOOLKIT_APPS/firefox.png"

# Dossiers Adwaita (Nautilus / slot nemo)
for icon in folder.svg folder-documents.svg folder-download.svg folder-music.svg \
  folder-pictures.svg folder-videos.svg folder-templates.svg folder-publicshare.svg \
  user-desktop.svg user-home.svg user-trash.svg; do
  pull "/usr/share/icons/$ICON_THEME/scalable/places/$icon" "$PLACES_DIR/$icon"
done

pull /usr/share/icons/Adwaita/symbolic/places/user-trash-symbolic.svg \
  "$PLACES_DIR/user-trash-symbolic.svg"
pull /usr/share/icons/Adwaita/symbolic/actions/document-open-recent-symbolic.svg \
  "$PLACES_DIR/document-open-recent-symbolic.svg"
pull /usr/share/icons/Adwaita/scalable/places/network-server.svg \
  "$PLACES_DIR/network-server.svg"

# Symboles barre d'outils / sidebar Nautilus (gabarit nemo-gnome)
for icon in go-up-symbolic go-previous-symbolic go-next-symbolic view-grid-symbolic view-list-symbolic \
  open-menu-symbolic view-more-symbolic \
  system-search-symbolic find-location-symbolic sidebar-show-symbolic; do
  pull "/usr/share/icons/Adwaita/symbolic/actions/$icon.svg" "$SYMBOLIC_ACTIONS/$icon.svg"
done
for icon in user-home-symbolic user-trash-symbolic network-workgroup-symbolic \
  folder-documents-symbolic folder-music-symbolic folder-pictures-symbolic \
  folder-videos-symbolic folder-download-symbolic folder-templates-symbolic \
  folder-publicshare-symbolic; do
  pull "/usr/share/icons/Adwaita/symbolic/places/$icon.svg" "$SYMBOLIC_PLACES/$icon.svg"
done
pull /usr/share/icons/Adwaita/symbolic/status/starred-symbolic.svg \
  "$SYMBOLIC_STATUS/starred-symbolic.svg"

# Favoris Aperçu GNOME (dash)
for app in org.gnome.Nautilus org.gnome.Ptyxis org.gnome.Calendar org.gnome.Software org.gnome.TextEditor; do
  pull "/usr/share/icons/hicolor/scalable/apps/${app}.svg" "$DASH_DIR/${app}.svg"
done
mkdir -p "$TOOLKIT_APPS/overview"
pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Settings.svg \
  "$TOOLKIT_APPS/overview/org.gnome.Settings.svg"

cat >"$VENDOR_DIR/SOURCE-VM.txt" <<EOF
Assets copiés depuis la VM lab ($SSH_TARGET) le $(date -u +"%Y-%m-%dT%H:%M:%SZ").
Thème icônes VM : $ICON_THEME (gsettings org.gnome.desktop.interface icon-theme).
Explorateur VM : Nautilus (org.gnome.Nautilus) — gabarit Capsule slot nemo.
Ne pas réinventer les chemins : relancer ce script après changement de VM ou de thème.
EOF

echo "=== Terminé — valider : node usr/lib/capsuleos/tools/validate-asset-zones.mjs ==="
