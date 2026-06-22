#!/usr/bin/env bash
# Pull Firefox Proton assets depuis VM lab (omni.ja Mozilla + Contile + favicons sites).
# Convention : root/docs/convention-assets-depuis-vm.md · inventaire linux-mint-firefox-vm-shortcuts.json
#
# Usage :
#   bash root/tools/lab/pull-firefox-vm-assets.sh --id linux-mint
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lab-inventory-ssh.sh
source "$(dirname "$0")/lab-inventory-ssh.sh"

REGISTRY_ID="linux-mint"
SSH_TARGET=""
IDENTITY="${HOME}/.ssh/capsuleos-lab"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id) REGISTRY_ID="${2:-linux-mint}"; shift 2 ;;
    --ssh) SSH_TARGET="$2"; shift 2 ;;
    *) echo "Option inconnue: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$SSH_TARGET" ]]; then
  SSH_TARGET="$(resolve_lab_ssh "$REGISTRY_ID" MINT_SSH ALMA_SSH ROCKY_SSH FEDORA_SSH)" || exit 1
fi

SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")
REMOTE=(ssh "${SSH_OPTS[@]}" "$SSH_TARGET")

DEST="$ROOT/usr/share/capsuleos/assets/images/toolkits/firefox"
CHROME_DIR="$DEST/chrome"
NEWTAB_DIR="$DEST/newtab"
BRAND_DIR="$DEST/brand"
mkdir -p "$CHROME_DIR" "$NEWTAB_DIR" "$BRAND_DIR"

OMNI="/usr/lib/firefox/browser/omni.ja"
extract_omni() {
  local inner="$1"
  local out="$2"
  local tmp="/tmp/capsuleos-ff-$(basename "$out")"
  "${REMOTE[@]}" "unzip -p '$OMNI' '$inner' > '$tmp' 2>/dev/null || true"
  scp "${SSH_OPTS[@]}" "$SSH_TARGET:$tmp" "$out"
  if [[ ! -s "$out" ]]; then
    echo "Échec extraction omni: $inner" >&2
    exit 1
  fi
}

echo "── Extraction chrome Mozilla (omni.ja) depuis $SSH_TARGET"
extract_omni "chrome/browser/skin/classic/browser/back.svg" "$CHROME_DIR/back.svg"
extract_omni "chrome/browser/skin/classic/browser/forward.svg" "$CHROME_DIR/forward.svg"
extract_omni "chrome/browser/skin/classic/browser/stop-to-reload.svg" "$CHROME_DIR/reload-animated.svg"
extract_omni "chrome/browser/skin/classic/browser/controlcenter/tracking-protection.svg" "$CHROME_DIR/shield.svg"

echo "── reload.svg (toolkit omni.ja)"
RELOAD_TMP="/tmp/capsuleos-ff-reload.svg"
"${REMOTE[@]}" "unzip -p /usr/lib/firefox/omni.ja chrome/toolkit/skin/classic/global/icons/reload.svg > '$RELOAD_TMP' 2>/dev/null || true"
scp "${SSH_OPTS[@]}" "$SSH_TARGET:$RELOAD_TMP" "$CHROME_DIR/reload.svg"
extract_omni "chrome/browser/skin/classic/browser/menu.svg" "$CHROME_DIR/menu.svg"
extract_omni "chrome/browser/builtin-addons/newtab/data/data/content/assets/pocket-swoosh.svg" "$CHROME_DIR/pocket.svg"
extract_omni "chrome/browser/skin/classic/browser/fxa/avatar-empty-circle.svg" "$CHROME_DIR/profile-avatar.svg"
extract_omni "chrome/browser/builtin-addons/newtab/data/data/content/assets/firefox.svg" "$BRAND_DIR/firefox-wordmark.svg"
extract_omni "chrome/browser/content/activity-stream/data/content/tippytop/images/google-com@2x.png" "$NEWTAB_DIR/google-g.png"

echo "── Tuiles sponsorisées (API Contile — même source que Firefox FR)"
"${REMOTE[@]}" 'curl -sS "https://contile.services.mozilla.com/v1/tiles" \
  -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0" \
  -H "Accept: application/json"' > /tmp/capsuleos-contile.json
python3 - "$NEWTAB_DIR" <<'PY'
import json, sys, urllib.request
with open("/tmp/capsuleos-contile.json", encoding="utf-8") as f:
    payload = json.load(f)
dest = sys.argv[1]
mapping = {
    "amazon": "amazon",
    "temu": "temu",
    "aliexpress": "aliexpress",
}
for tile in payload.get("tiles", []):
    name = (tile.get("name") or "").lower()
    key = mapping.get(name)
    if not key or not tile.get("image_url"):
        continue
    out = f"{dest}/{key}.jpg"
    urllib.request.urlretrieve(tile["image_url"], out)
    print(f"  contile → {key}.jpg")
PY

echo "── Favicons sites organiques (fetch VM)"
ORGANIC=(
  "wikipedia|https://fr.wikipedia.org/favicon.ico"
  "youtube|https://www.youtube.com/favicon.ico"
  "lemonde|https://www.lemonde.fr/favicon.ico"
  "reddit|https://www.reddit.com/favicon.ico"
)
for entry in "${ORGANIC[@]}"; do
  key="${entry%%|*}"
  url="${entry#*|}"
  if ! "${REMOTE[@]}" "curl -fsSL '$url' -o /tmp/ff-fav-$key.ico" 2>/dev/null; then
    echo "  ⚠ favicon $key — échec fetch" >&2
    continue
  fi
  scp "${SSH_OPTS[@]}" "$SSH_TARGET:/tmp/ff-fav-$key.ico" "$NEWTAB_DIR/$key.ico"
  echo "  favicon → $key.ico"
done

# Icône lanceur Firefox (onglet / dock) — hicolor 48
echo "── Icône application Firefox (hicolor 48)"
scp "${SSH_OPTS[@]}" "$SSH_TARGET:/usr/share/icons/hicolor/48x48/apps/firefox.png" "$BRAND_DIR/firefox-app-48.png"

cat > "$DEST/SOURCE-VM.txt" <<EOF
registryId=$REGISTRY_ID
ssh=$SSH_TARGET
collectedAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)
firefoxPackage=$("${REMOTE[@]}" "firefox --version 2>/dev/null || true")
sources:
  chrome/*.svg → $OMNI (Mozilla Firefox, MPL-2.0)
  brand/firefox-wordmark.svg → $OMNI newtab extension
  brand/firefox-app-48.png → /usr/share/icons/hicolor/48x48/apps/firefox.png
  newtab/google-g.png → $OMNI activity-stream tippytop
  newtab/{amazon,temu,aliexpress}.jpg → contile.services.mozilla.com (tuiles sponsorisées FR)
  newtab/{wikipedia,youtube,lemonde,reddit}.ico → favicons sites (fetch VM)
inventory: root/docs/inventaires/linux-mint-firefox-vm-shortcuts.json
EOF

echo "── Normalisation SVG chrome (fill context-fill → #000 pour masques CSS)"
python3 - "$CHROME_DIR" <<'PY'
import re, sys
from pathlib import Path
chrome = Path(sys.argv[1])
for path in sorted(chrome.glob("*.svg")):
    text = path.read_text(encoding="utf-8")
    normalized = re.sub(r'fill="context-fill"', 'fill="#000"', text)
    normalized = re.sub(r"fill='context-fill'", "fill='#000'", normalized)
    if 'fill=' not in normalized.split('<svg', 1)[-1].split('>', 1)[0]:
        normalized = re.sub(r'(<svg[^>]*)(>)', r'\1 fill="#000"\2', normalized, count=1)
    if normalized != text:
        path.write_text(normalized, encoding="utf-8")
        print(f"  normalisé → {path.name}")
PY

echo "── Conversion WebP (prepare-web-media)"
if command -v node >/dev/null 2>&1; then
  node "$ROOT/usr/lib/capsuleos/tools/prepare-web-media.mjs" \
    --input "$NEWTAB_DIR" \
    --rewrite-refs 2>/dev/null || true
fi

echo "✓ pull-firefox-vm-assets OK → $DEST"
