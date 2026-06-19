#!/usr/bin/env bash
# Pull icônes Discover KDE Neon depuis la VM lab (prédicats A/S/T — R-A1).
#
# Usage :
#   KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/pull-kde-neon-discover-icons.sh
#   bash root/tools/lab/pull-kde-neon-discover-icons.sh --verify-only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SSH_TARGET="${KDE_NEON_SSH:-goupil@192.168.123.52}"
IDENTITY="${KDE_NEON_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
DEST="$ROOT/usr/share/capsuleos/assets/images/vendors/neon/discover"
SOURCE_VM="$ROOT/usr/share/capsuleos/assets/images/vendors/neon/SOURCE-VM.txt"
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --verify-only) VERIFY_ONLY=true; shift ;;
    --ssh) SSH_TARGET="$2"; shift 2 ;;
    *) echo "Option inconnue: $1" >&2; exit 1 ;;
  esac
done

SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")

# dest_filename|remote_path
MANIFEST=(
  "ark.png|/usr/share/icons/hicolor/48x48/apps/ark.png"
  "dolphin.svg|/usr/share/icons/hicolor/scalable/apps/org.kde.dolphin.svg"
  "gwenview.png|/usr/share/icons/hicolor/48x48/apps/gwenview.png"
  "khelpcenter.svg|/usr/share/icons/breeze/apps/48/help-browser.svg"
  "kdeconnect.svg|/usr/share/icons/hicolor/scalable/apps/kdeconnect.svg"
  "kate.png|/usr/share/icons/hicolor/48x48/apps/kate.png"
  "kate-installed.png|/usr/share/icons/hicolor/48x48/apps/kate.png"
  "konsole.svg|/usr/share/icons/breeze/apps/48/utilities-terminal.svg"
  "okular.png|/usr/share/icons/hicolor/48x48/apps/okular.png"
  "discover-installed.png|/usr/share/icons/hicolor/48x48/apps/plasmadiscover.png"
  "plasmadiscover-48.png|/usr/share/icons/hicolor/48x48/apps/plasmadiscover.png"
  "spectacle.svg|/usr/share/icons/hicolor/scalable/apps/spectacle.svg"
  "systemsettings.svg|/usr/share/icons/breeze/apps/48/preferences-system.svg"
  "systemmonitor.svg|/usr/share/icons/breeze/apps/48/utilities-system-monitor.svg"
  "vlc-installed.png|/usr/share/icons/hicolor/48x48/apps/vlc.png"
  "vlc.png|/usr/share/icons/hicolor/48x48/apps/vlc.png"
)

mkdir -p "$DEST"

if [[ "$VERIFY_ONLY" == true ]]; then
  echo "=== Vérification SHA256 VM ↔ dépôt (discover installé) ==="
  fail=0
  for entry in "${MANIFEST[@]}"; do
    dest="${entry%%|*}"
    remote="${entry#*|}"
    local_file="$DEST/$dest"
    if [[ ! -f "$local_file" ]]; then
      echo "  ✗ manquant: discover/$dest"
      fail=1
      continue
    fi
    remote_hash="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "sha256sum '$remote' 2>/dev/null" | awk '{print $1}')"
    local_hash="$(sha256sum "$local_file" | awk '{print $1}')"
    if [[ "$remote_hash" == "$local_hash" ]]; then
      echo "  ✓ $dest"
    else
      echo "  ✗ drift: $dest (local ${local_hash:0:12}… ≠ VM ${remote_hash:0:12}…)"
      fail=1
    fi
  done
  exit "$fail"
fi

echo "=== Pull icônes Discover — $SSH_TARGET → discover/ ==="
for entry in "${MANIFEST[@]}"; do
  dest="${entry%%|*}"
  remote="${entry#*|}"
  scp "${SSH_OPTS[@]}" "$SSH_TARGET:$remote" "$DEST/$dest"
  size="$(wc -c < "$DEST/$dest" | tr -d ' ')"
  echo "  → discover/$dest ($size octets) ← $remote"
done

# firefox panel (référencé par discover-catalog installed)
PANEL="$ROOT/usr/share/capsuleos/assets/images/vendors/neon/panel"
mkdir -p "$PANEL"
scp "${SSH_OPTS[@]}" "$SSH_TARGET:/usr/share/icons/hicolor/48x48/apps/firefox.png" "$PANEL/firefox.png"
echo "  → panel/firefox.png ← hicolor/48x48/apps/firefox.png"

COLLECTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
{
  echo ""
  echo "# Discover Installé(s) — pull $COLLECTED_AT ($SSH_TARGET)"
  for entry in "${MANIFEST[@]}"; do
    dest="${entry%%|*}"
    remote="${entry#*|}"
    hash="$(sha256sum "$DEST/$dest" | awk '{print $1}')"
    echo "discover/$dest ← $remote (sha256 $hash)"
  done
  hash="$(sha256sum "$PANEL/firefox.png" | awk '{print $1}')"
  echo "panel/firefox.png ← /usr/share/icons/hicolor/48x48/apps/firefox.png (sha256 $hash)"
} >> "$SOURCE_VM"

echo "=== Terminé — SOURCE-VM.txt mis à jour ==="
