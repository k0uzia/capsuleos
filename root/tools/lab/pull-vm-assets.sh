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
REGISTRY_ID="linux-rocky"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id)
      REGISTRY_ID="${2:-linux-rocky}"
      case "$REGISTRY_ID" in
        linux-fedora)
          VENDOR="fedora"
          SSH_TARGET="${FEDORA_SSH:-capsule@192.168.122.91}"
          ;;
        linux-ubuntu)
          VENDOR="ubuntu"
          SSH_TARGET="${UBUNTU_SSH:-capsule@192.168.1.183}"
          ICON_THEME="Yaru"
          ;;
        linux-rocky)
          VENDOR="rocky"
          ;;
        linux-alma)
          VENDOR="alma"
          SSH_TARGET="${ALMA_SSH:-capsule@192.168.122.199}"
          ;;
        linux-mint)
          VENDOR="mint"
          SSH_TARGET="${MINT_SSH:-capsule@192.168.1.146}"
          TOOLKIT="cinnamon"
          ICON_THEME="Mint-Y"
          ;;
        *)
          VENDOR="rocky"
          ;;
      esac
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
WATERMARK_DIR="$VENDOR_DIR/watermark"
GNOME_ICONS="$ASSETS/icons/gnome/adwaita"
YARU_ICONS="$ASSETS/icons/gnome/yaru"
FONTS_DIR="$ASSETS/fonts/vendors/$VENDOR"
MIMETYPES_DIR="$GNOME_ICONS/mimetypes"
PLACES_DIR="$GNOME_ICONS/places"
SYMBOLIC_ACTIONS="$GNOME_ICONS/symbolic/actions"
SYMBOLIC_PLACES="$GNOME_ICONS/symbolic/places"
SYMBOLIC_STATUS="$GNOME_ICONS/symbolic/status"
APPS_DIR="$GNOME_ICONS/apps"
TOOLKIT_APPS="$ASSETS/images/toolkits/gnome/apps"
DASH_DIR="$TOOLKIT_APPS/dash"

mkdir -p "$PANEL_DIR" "$WALL_DIR" "$WATERMARK_DIR" "$FONTS_DIR" "$MIMETYPES_DIR" "$PLACES_DIR" "$SYMBOLIC_ACTIONS" "$SYMBOLIC_PLACES" \
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

pull_yaru_icon() {
  local name="$1" dest_dir="$2"
  local remote=""
  for candidate in \
    "/usr/share/icons/Yaru/scalable/mimetypes/${name}.svg" \
    "/usr/share/icons/Yaru/scalable/places/${name}.svg" \
    "/usr/share/icons/Yaru/scalable/emblems/${name}.svg" \
    "/usr/share/icons/Yaru/48x48/mimetypes/${name}.png" \
    "/usr/share/icons/Yaru/48x48/places/${name}.png" \
    "/usr/share/icons/Yaru/48x48/emblems/${name}.png"; do
    if "${REMOTE[@]}" "test -r '$candidate'" 2>/dev/null; then
      remote="$candidate"
      break
    fi
  done
  if [[ -z "$remote" ]]; then
    echo "  ✗ absent Yaru: ${name}" >&2
    return 0
  fi
  local ext="${remote##*.}"
  pull "$remote" "$dest_dir/${name}.${ext}"
}

pull_yaru_symbolic() {
  local subdir="$1" icon="$2" dest_dir="$3"
  local remote=""
  for candidate in \
    "/usr/share/icons/Yaru/symbolic/${subdir}/${icon}.svg" \
    "/usr/share/icons/Adwaita/symbolic/${subdir}/${icon}.svg"; do
    if "${REMOTE[@]}" "test -r '$candidate'" 2>/dev/null; then
      remote="$candidate"
      break
    fi
  done
  if [[ -z "$remote" ]]; then
    echo "  ✗ absent symbolic: ${icon}" >&2
    return 0
  fi
  pull "$remote" "$dest_dir/${icon}.svg"
}

pull_vm_backgrounds() {
  echo "=== Fonds d'écran VM (scan) ==="
  local remote_list
  remote_list="$("${REMOTE[@]}" "find /usr/share/backgrounds -maxdepth 3 -type f \
    \\( -name '*.png' -o -name '*.jxl' -o -name '*.jpg' -o -name '*.jpeg' \\) \
    ! -path '*/.*' 2>/dev/null | sort -u" 2>/dev/null || true)"
  while IFS= read -r remote; do
    [[ -z "$remote" ]] && continue
    local base
    base="$(basename "$remote")"
    if [[ -f "$WALL_DIR/$base" ]]; then
      continue
    fi
    pull "$remote" "$WALL_DIR/$base"
  done <<< "$remote_list"
}

pull_vm_wallpaper_thumbs() {
  local thumb_dir="$WALL_DIR/thumbnails"
  mkdir -p "$thumb_dir"
  echo "=== Miniatures fonds VM (si présentes) ==="
  local remote_list
  remote_list="$("${REMOTE[@]}" "find /usr/share/backgrounds -type f \
    \\( -iname '*thumb*' -o -iname '*preview*' -o -iname '*_small*' \\) 2>/dev/null | sort -u" 2>/dev/null || true)"
  while IFS= read -r remote; do
    [[ -z "$remote" ]] && continue
    pull "$remote" "$thumb_dir/$(basename "$remote")"
  done <<< "$remote_list"
}

if [[ "$VENDOR" == "alma" ]]; then
  for bg in almalinux-day.jpg almalinux-night.jpg; do
    pull "/usr/share/backgrounds/$bg" "$WALL_DIR/$bg"
  done
  for logo in fedora_logo_darkbackground fedora_logo_lightbackground; do
    pull "/usr/share/almalinux-logos/${logo}.svg" "$WATERMARK_DIR/${logo}.svg"
  done
  pull /usr/share/almalinux-logos/almalinux-logo.svg "$VENDOR_DIR/alma-logo.svg" || true
fi

if [[ "$VENDOR" == "rocky" ]]; then
  for bg in \
    rocky-default-10-gemstone-skies-night.png \
    rocky-default-10-gemstone-skies-day.png \
    rocky-default-10-abstract-1-night.png \
    rocky-default-10-abstract-1-day.png \
    rocky-default-10-abstract-2.png \
    rocky-default-10-abstract-3.png \
    rocky-default-10-abstract-4.png \
    rocky-default-10-abstract-5.png \
    rocky-default-10-sapphire.png \
    rocky-default-10-sapphire-light.png; do
    pull "/usr/share/backgrounds/$bg" "$WALL_DIR/$bg"
  done
  for logo in fedora_logo_darkbackground fedora_logo_lightbackground; do
    pull "/usr/share/rocky-logos/${logo}.svg" "$WATERMARK_DIR/${logo}.svg" || \
    pull "/usr/share/fedora-logos/${logo}.svg" "$WATERMARK_DIR/${logo}.svg"
  done
fi

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

# Polices UI VM (Red Hat Text / Mono — crochets [wght] : scp direct, pas de glob bash)
pull_font() {
  local remote="$1" local="$2"
  if scp "${SSH_OPTS[@]}" "${SSH_TARGET}:${remote}" "$local" 2>/dev/null; then
    echo "  ✓ $local"
  else
    echo "  ✗ absent: $remote" >&2
  fi
}
pull_font '/usr/share/fonts/redhat-vf/RedHatText[wght].ttf' "$FONTS_DIR/RedHatText[wght].ttf"
pull_font '/usr/share/fonts/redhat-vf/RedHatMono[wght].ttf' "$FONTS_DIR/RedHatMono[wght].ttf"

# Icônes MIME Adwaita (explorateur / parité types)
for icon in inode-directory.svg text-x-generic.svg text-x-script.svg image-x-generic.svg \
  application-x-generic.svg application-x-executable.svg package-x-generic.svg \
  x-office-document.svg audio-x-generic.svg video-x-generic.svg; do
  pull "/usr/share/icons/$ICON_THEME/scalable/mimetypes/$icon" "$MIMETYPES_DIR/$icon"
done

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
for app in org.gnome.Nautilus org.gnome.Ptyxis org.gnome.Calendar org.gnome.Software org.gnome.TextEditor org.gnome.Calculator; do
  pull "/usr/share/icons/hicolor/scalable/apps/${app}.svg" "$DASH_DIR/${app}.svg"
done
mkdir -p "$TOOLKIT_APPS/overview"
pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Settings.svg \
  "$TOOLKIT_APPS/overview/org.gnome.Settings.svg"
pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Calculator.svg \
  "$TOOLKIT_APPS/overview/org.gnome.Calculator.svg"
for app in org.gnome.Loupe org.gnome.Snapshot org.gnome.Papers org.gnome.baobab org.gnome.SystemMonitor; do
  pull "/usr/share/icons/hicolor/scalable/apps/${app}.svg" "$TOOLKIT_APPS/overview/${app}.svg"
done

if [[ "$VENDOR" == "fedora" ]]; then
  for bg in f44-01-day.jxl f44-01-night.jxl; do
    pull "/usr/share/backgrounds/f44/default/$bg" "$WALL_DIR/$bg"
  done
fi

if [[ "$VENDOR" == "mint" ]]; then
  echo "=== Fonds d'écran Mint (scan VM) ==="
  pull_vm_backgrounds
  pull_vm_wallpaper_thumbs
fi

if [[ "$VENDOR" == "ubuntu" ]]; then
  mkdir -p "$YARU_ICONS/mimetypes" "$YARU_ICONS/places" "$YARU_ICONS/emblems" \
    "$YARU_ICONS/symbolic/actions" "$YARU_ICONS/symbolic/places" "$YARU_ICONS/symbolic/status"

  echo "=== Yaru MIME + places (VM $ICON_THEME) ==="
  for icon in inode-directory text-x-generic text-x-script image-x-generic \
    application-x-generic application-x-executable package-x-generic \
    x-office-document audio-x-generic video-x-generic text-x-preview \
    application-pdf application-rtf application-vnd.ms-excel; do
    pull_yaru_icon "$icon" "$YARU_ICONS/mimetypes"
  done
  for icon in folder folder-documents folder-download folder-music folder-pictures \
    folder-videos folder-templates folder-publicshare user-desktop user-home user-trash \
    network-server; do
    pull_yaru_icon "$icon" "$YARU_ICONS/places"
  done
  for icon in emblem-default emblem-shared emblem-favorite emblem-important emblem-new \
    emblem-readonly emblem-symbolic-link emblem-unreadable; do
    pull_yaru_icon "$icon" "$YARU_ICONS/emblems"
  done

  echo "=== Yaru symbolic (Nautilus / shell) ==="
  for icon in go-up-symbolic go-previous-symbolic go-next-symbolic view-grid-symbolic view-list-symbolic \
    open-menu-symbolic view-more-symbolic system-search-symbolic find-location-symbolic \
    sidebar-show-symbolic folder-new-symbolic; do
    pull_yaru_symbolic actions "$icon" "$YARU_ICONS/symbolic/actions"
  done
  for icon in user-home-symbolic user-trash-symbolic network-workgroup-symbolic \
    folder-documents-symbolic folder-music-symbolic folder-pictures-symbolic \
    folder-videos-symbolic folder-download-symbolic folder-templates-symbolic \
    folder-publicshare-symbolic; do
    pull_yaru_symbolic places "$icon" "$YARU_ICONS/symbolic/places"
  done
  pull_yaru_symbolic status starred-symbolic "$YARU_ICONS/symbolic/status"
  pull_yaru_symbolic places document-open-recent-symbolic "$YARU_ICONS/symbolic/places"

  for ext in png svg; do
    if [[ ! -f "$YARU_ICONS/mimetypes/application-x-generic.$ext" ]] \
       && [[ -f "$YARU_ICONS/mimetypes/text-x-generic.$ext" ]]; then
      cp "$YARU_ICONS/mimetypes/text-x-generic.$ext" \
        "$YARU_ICONS/mimetypes/application-x-generic.$ext"
      echo "  ✓ fallback MIME application-x-generic.$ext ← text-x-generic.$ext"
    fi
  done

  echo "=== Fonds d'écran Ubuntu (canoniques + scan VM) ==="
  pull /usr/share/backgrounds/gnome/adwaita-d.jxl "$WALL_DIR/adwaita-d.jxl"
  pull /usr/share/backgrounds/gnome/adwaita-l.jxl "$WALL_DIR/adwaita-l.jxl"
  pull /usr/share/backgrounds/Resolute_Raccoon_Wallpaper_Dimmed_3840x2160.png \
    "$WALL_DIR/wallpaper-racoon.png" || \
  pull /usr/share/backgrounds/warty-final-ubuntu.png \
    "$WALL_DIR/wallpaper-racoon.png" || \
  pull /usr/share/backgrounds/Questing_Quokka_Full_Color_3840x2160.png \
    "$WALL_DIR/wallpaper-racoon.png"
  pull /usr/share/backgrounds/Resolute_Raccoon_Wallpaper_Light_3840x2160.png \
    "$WALL_DIR/wallpaper-racoon-light.png"
  pull /usr/share/backgrounds/ubuntu-wallpaper-d.png \
    "$WALL_DIR/wallpaper-adwaita-dark.png"
  pull /usr/share/backgrounds/ubuntu-wallpaper-l.png \
    "$WALL_DIR/wallpaper-adwaita-light.png" || true
  pull_vm_backgrounds
  pull_vm_wallpaper_thumbs

  echo "=== Panel / dash Ubuntu ==="
  pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Nautilus.svg \
    "$PANEL_DIR/org.gnome.Nautilus.svg"
  pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Ptyxis.svg \
    "$PANEL_DIR/org.gnome.Ptyxis.svg"
  pull /usr/share/icons/hicolor/48x48/apps/firefox.png \
    "$PANEL_DIR/firefox-48.png"
  pull /usr/share/icons/Yaru/48x48/apps/org.gnome.Rhythmbox3.png \
    "$DASH_DIR/org.gnome.Rhythmbox3.png"
  pull /usr/share/icons/Yaru/48x48/apps/libreoffice-writer.png \
    "$DASH_DIR/libreoffice-writer.png"
  pull /usr/share/icons/Yaru/48x48/apps/firefox.png \
    "$DASH_DIR/firefox.png"
  pull /usr/share/icons/hicolor/scalable/apps/snap-store.svg \
    "$DASH_DIR/snap-store.svg" || \
  pull /usr/share/icons/Yaru/48x48/apps/snap-store.png \
    "$DASH_DIR/snap-store.png" || true
  pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Settings.svg \
    "$DASH_DIR/org.gnome.Settings.svg"
  pull /usr/share/icons/hicolor/scalable/apps/org.gnome.TextEditor.svg \
    "$DASH_DIR/org.gnome.TextEditor.svg"
  pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Calculator.svg \
    "$DASH_DIR/org.gnome.Calculator.svg"
  pull /usr/share/icons/Yaru/48x48/apps/evolution.png \
    "$DASH_DIR/evolution.png"
  pull /usr/share/icons/hicolor/scalable/apps/org.gnome.Yelp.svg \
    "$DASH_DIR/org.gnome.Yelp.svg"

  echo "=== Branding Ubuntu ==="
  pull /usr/share/icons/hicolor/scalable/apps/ubuntu-logo-icon.svg \
    "$VENDOR_DIR/ubuntu-logo.svg" || \
  pull /usr/share/pixmaps/ubuntu-logo-icon.svg "$VENDOR_DIR/ubuntu-logo.svg" || true

  echo "=== Polices Ubuntu (VM) ==="
  pull_font '/usr/share/fonts/truetype/ubuntu/Ubuntu[wdth,wght].ttf' \
    "$FONTS_DIR/Ubuntu[wdth,wght].ttf" || true
  pull_font '/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf' "$FONTS_DIR/Ubuntu-R.ttf" || true
  pull_font '/usr/share/fonts/truetype/ubuntu/Ubuntu-M.ttf' "$FONTS_DIR/Ubuntu-M.ttf" || true
  pull_font '/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf' "$FONTS_DIR/UbuntuMono-R.ttf" || true

  pull /var/lib/snapd/desktop/applications/snap-store_snap-store.desktop \
    "$VENDOR_DIR/snap-store_snap-store.desktop"
fi

cat >"$VENDOR_DIR/SOURCE-VM.txt" <<EOF
Assets copiés depuis la VM lab ($SSH_TARGET) le $(date -u +"%Y-%m-%dT%H:%M:%SZ").
Vendor : $VENDOR · toolkit : $TOOLKIT
Thème icônes VM : $ICON_THEME (gsettings org.gnome.desktop.interface icon-theme).
Polices VM : /usr/share/fonts/redhat-vf/ → assets/fonts/vendors/$VENDOR/
MIME Adwaita : scalable/mimetypes/ → icons/gnome/adwaita/mimetypes/
Yaru (ubuntu) : icons/gnome/yaru/{mimetypes,places,emblems,symbolic}/ — PNG/SVG depuis VM
Fonds d'écran : wallpaper/ (+ thumbnails/) — WebP via prepare-web-media.mjs (défaut après pull)
Explorateur VM : Nautilus (org.gnome.Nautilus) — gabarit Capsule slot nemo.
Ne pas réinventer les chemins : relancer ce script après changement de VM ou de thème.
EOF

if [[ "${PREPARE_WEB_MEDIA:-1}" != 0 ]]; then
  echo "=== prepare-web-media ($VENDOR) ==="
  node "$ROOT/usr/lib/capsuleos/tools/prepare-web-media.mjs" \
    --vendor "$VENDOR" --rewrite-refs --wallpaper-thumbnails --keep-source
  node "$ROOT/usr/lib/capsuleos/tools/validate-web-media-prepare.mjs"
  if [[ "$VENDOR" == "ubuntu" ]]; then
    echo "=== ubuntu-wallpaper-catalog ==="
    node "$ROOT/usr/lib/capsuleos/tools/lab/generate-ubuntu-wallpaper-catalog.mjs" --write
  fi
fi

echo "=== Terminé — valider : node usr/lib/capsuleos/tools/validate-asset-zones.mjs ==="
