#!/usr/bin/env bash
# Inventaire VM — icônes sidebar Discover (nav + catégories + recherche).
# Ground truth libdiscover : packagekit-backend-categories.xml + thème Breeze.
#
# Usage :
#   KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/vm-kde-neon-discover-sidebar-inventory.sh
#   bash root/tools/lab/vm-kde-neon-discover-sidebar-inventory.sh --json-only > out.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SSH_TARGET="${KDE_NEON_SSH:-goupil@192.168.123.52}"
IDENTITY="${KDE_NEON_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
OUT_JSON="$ROOT/root/docs/inventaires/linux-kde-neon-discover-sidebar-icons.json"
JSON_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json-only) JSON_ONLY=true; shift ;;
    --ssh) SSH_TARGET="$2"; shift 2 ;;
    --out) OUT_JSON="$2"; shift 2 ;;
    *) echo "Option inconnue: $1" >&2; exit 1 ;;
  esac
done

SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")

REMOTE_SCRIPT='#!/usr/bin/env bash
set -euo pipefail

resolve_icon() {
  local name="$1"
  local p
  for p in \
    "/usr/share/icons/breeze/categories/22/${name}.svg" \
    "/usr/share/icons/breeze/preferences/22/${name}.svg" \
    "/usr/share/icons/breeze/categories/32/${name}.svg" \
    "/usr/share/icons/breeze/preferences/32/${name}.svg" \
    "/usr/share/icons/breeze/actions/24/${name}.svg" \
    "/usr/share/icons/breeze/status/24/${name}.svg" \
    "/usr/share/icons/breeze/actions/32/${name}.svg"
  do
    if [[ -f "$p" ]]; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

hash_file() {
  sha256sum "$1" | awk "{print \$1}"
}

python3 - <<"PY"
import json, os, subprocess, xml.etree.ElementTree as ET
from datetime import datetime, timezone

def resolve_nav(name):
    candidates = [
        f"/usr/share/icons/breeze/actions/24/{name}.svg",
        f"/usr/share/icons/breeze/status/24/{name}.svg",
        f"/usr/share/icons/breeze/actions/32/{name}.svg",
        f"/usr/share/icons/breeze/status/32/{name}.svg",
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None

def resolve_category_symbolic(icon_base):
    """Discover sidebar VM : variantes *-symbolic (monochrome Kirigami), pas categories couleur."""
    sym = icon_base if icon_base.endswith("-symbolic") else f"{icon_base}-symbolic"
    subs = ("categories", "preferences", "actions", "apps")
    sizes = (22, 16, 24)
    ranked = []
    for sub in subs:
        for sz in sizes:
            p = f"/usr/share/icons/breeze/{sub}/{sz}/{sym}.svg"
            if os.path.isfile(p):
                ranked.append((sub, sz, p))
    if not ranked:
        return None
    order = {"categories": 0, "preferences": 1, "actions": 2, "apps": 3}
    ranked.sort(key=lambda t: (order.get(t[0], 9), 0 if t[1] == 22 else 1 if t[1] == 16 else 2))
    return ranked[0][2]

def entry(role, css_class, icon_name, remote, source="breeze", render_mode="mask", label_fr=None):
    h = subprocess.check_output(["sha256sum", remote], text=True).split()[0]
    size = os.path.getsize(remote)
    dest = f"discover/sidebar/{role}/{os.path.basename(remote)}"
    row = {
        "role": role,
        "cssClass": css_class,
        "iconName": icon_name,
        "remotePath": remote,
        "destPath": f"usr/share/capsuleos/assets/images/vendors/neon/{dest}",
        "destFilename": os.path.basename(remote),
        "sha256": h,
        "bytes": size,
        "source": source,
        "renderMode": render_mode,
    }
    if label_fr:
        row["labelFr"] = label_fr
    return row

nav = [
    ("nav", "kde-updates__navicon--home", "go-home-symbolic"),
    ("nav", "kde-updates__navicon--installed", "install-symbolic"),
    ("nav", "kde-updates__navicon--updates", "system-software-update-symbolic"),
    ("nav", "kde-updates__navicon--config", "configure-symbolic"),
    ("nav", "kde-updates__navicon--about", "help-about-symbolic"),
    ("search", "kde-updates__search-icon", "system-search-symbolic"),
    ("ui", "kde-updates__cat--expandable::after", "go-next-symbolic"),
]

# Catégories sidebar (sous « Toutes les applications ») — libdiscover + libellés VM FR
cat_map = [
    ("categories", "kde-updates__caticon--all", "applications-all", "Toutes les applications"),
    ("categories", "kde-updates__caticon--accessibility", "preferences-desktop-accessibility", "Accessibilité"),
    ("categories", "kde-updates__caticon--office", "applications-office", "Bureautique"),
    ("categories", "kde-updates__caticon--development", "applications-development", "Développement"),
    ("categories", "kde-updates__caticon--education", "applications-education", "Éducation"),
    ("categories", "kde-updates__caticon--graphics", "applications-graphics", "Graphisme"),
    ("categories", "kde-updates__caticon--internet", "applications-internet", "Internet"),
    ("categories", "kde-updates__caticon--games", "applications-games", "Jeux"),
    ("categories", "kde-updates__caticon--multimedia", "applications-multimedia", "Multimédia"),
    ("categories", "kde-updates__caticon--science", "applications-science", "Science & Mathématiques"),
    ("categories", "kde-updates__caticon--system", "applications-system", "Système"),
    ("categories", "kde-updates__caticon--utilities", "applications-utilities", "Utilitaires"),
    ("categories", "kde-updates__caticon--addons", "preferences-plugin", "Modules d'applications"),
]

icons = []
missing = []

for role, css, name in nav:
    remote = resolve_nav(name)
    if remote:
        icons.append(entry(role, css, name, remote, render_mode="mask"))
    else:
        missing.append({"role": role, "cssClass": css, "iconName": name})

for role, css, name, label_fr in cat_map:
    remote = resolve_category_symbolic(name)
    if remote:
        resolved_name = os.path.basename(remote).replace(".svg", "")
        icons.append(entry(role, css, resolved_name, remote, render_mode="mask", label_fr=label_fr))
    else:
        missing.append({"role": role, "cssClass": css, "iconName": name, "labelFr": label_fr})

# Vérification croisée XML libdiscover (top menus)
xml_path = "/usr/share/libdiscover/categories/packagekit-backend-categories.xml"
xml_icons = {}
if os.path.isfile(xml_path):
    root = ET.parse(xml_path).getroot()
    for menu in root.findall("Menu"):
        icon = menu.findtext("Icon")
        name = menu.findtext("Name")
        if icon and menu.find("Top") is not None:
            xml_icons["All Applications"] = icon
        if icon and name:
            xml_icons[name] = icon

doc = {
    "registryId": "linux-kde-neon",
    "surface": "discover-sidebar",
    "vm": os.environ.get("KDE_NEON_SSH", "goupil@192.168.123.52"),
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "authority": {
        "categoriesXml": xml_path,
        "iconTheme": "breeze",
        "categoryRender": "mask + Breeze *-symbolic (22px categories/preferences/apps)",
        "categorySize": "22px symbolic — pas les SVG couleur toolkit/categories",
    },
    "libdiscoverTopIcons": xml_icons,
    "icons": icons,
    "missing": missing,
    "counts": {
        "resolved": len(icons),
        "missing": len(missing),
    },
}
print(json.dumps(doc, indent=2, ensure_ascii=False))
PY
'

echo "=== Inventaire sidebar Discover — $SSH_TARGET ===" >&2
RAW="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "KDE_NEON_SSH=$SSH_TARGET bash -s" <<< "$REMOTE_SCRIPT")"

if [[ "$JSON_ONLY" == true ]]; then
  echo "$RAW"
  exit 0
fi

mkdir -p "$(dirname "$OUT_JSON")"
echo "$RAW" > "$OUT_JSON"
echo "  → $OUT_JSON" >&2

RESOLVED="$(echo "$RAW" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["counts"]["resolved"])')"
MISSING="$(echo "$RAW" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["counts"]["missing"])')"
echo "  résolu: $RESOLVED · manquant: $MISSING" >&2

if [[ "$MISSING" != "0" ]]; then
  echo "$RAW" | python3 -c 'import json,sys; d=json.load(sys.stdin); [print("  ✗", m["iconName"], m["cssClass"]) for m in d.get("missing",[])]' >&2
  exit 1
fi
