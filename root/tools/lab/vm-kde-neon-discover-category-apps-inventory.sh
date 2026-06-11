#!/usr/bin/env bash
# Inventaire VM — apps par catégorie sidebar Discover (AppStream → icônes hicolor/breeze).
#
# Usage :
#   KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/vm-kde-neon-discover-category-apps-inventory.sh
#   bash root/tools/lab/vm-kde-neon-discover-category-apps-inventory.sh --json-only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SSH_TARGET="${KDE_NEON_SSH:-goupil@192.168.123.52}"
IDENTITY="${KDE_NEON_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
OUT_JSON="$ROOT/root/docs/inventaires/linux-kde-neon-discover-category-apps.json"
JSON_ONLY=false
MAX_PER_CAT="${DISCOVER_CAT_MAX_APPS:-6}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json-only) JSON_ONLY=true; shift ;;
    --ssh) SSH_TARGET="$2"; shift 2 ;;
    --out) OUT_JSON="$2"; shift 2 ;;
    --max) MAX_PER_CAT="$2"; shift 2 ;;
    *) echo "Option inconnue: $1" >&2; exit 1 ;;
  esac
done

SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")

REMOTE_SCRIPT="$(cat <<'PY'
import json, os, re, hashlib
from collections import defaultdict
from datetime import datetime, timezone

MAX_PER_CAT = int(os.environ.get("DISCOVER_CAT_MAX_APPS", "6"))

FREEDESKTOP_TO_CAPSULE = {
    "Network": "internet",
    "Office": "office",
    "Development": "development",
    "Education": "education",
    "Graphics": "graphics",
    "Game": "games",
    "AudioVideo": "multimedia",
    "Science": "science",
    "Engineering": "science",
    "System": "system",
    "Settings": "system",
    "Utility": "utilities",
    "Accessibility": "accessibility",
}

LABELS = {
    "accessibility": "Accessibilité",
    "office": "Bureautique",
    "development": "Développement",
    "education": "Éducation",
    "graphics": "Graphisme",
    "internet": "Internet",
    "games": "Jeux",
    "multimedia": "Multimédia",
    "science": "Science & Mathématiques",
    "system": "Système",
    "utilities": "Utilitaires",
    "addons": "Modules d'applications",
}

# VM lab — apps sans Categories= ou hors menu (ciblées accessibilité / éducation KDE).
MANUAL_VM_APPS = [
    ("accessibility", "kcm-access", "Accessibilité", "Configurer les fonctionnalités d'accessibilité", "/usr/share/icons/breeze/preferences/22/preferences-desktop-accessibility.svg"),
    ("accessibility", "orca", "Orca", "Lecteur d'écran", "/usr/share/icons/hicolor/48x48/apps/orca.png"),
    ("education", "kmplot", "KmPlot", "Traceur de fonctions mathématiques", "/usr/share/icons/breeze/apps/48/org.kde.kmplot.svg"),
    ("education", "parley", "Parley", "Apprendre des vocabulaires", "/usr/share/icons/breeze/apps/48/parley.svg"),
    ("education", "ktouch", "KTouch", "Apprendre la dactylographie", "/usr/share/icons/breeze/apps/48/org.kde.ktouch.svg"),
    ("education", "kalzium", "Kalzium", "Tableau périodique des éléments", "/usr/share/icons/breeze/apps/48/org.kde.kalzium.svg"),
    ("education", "step", "Step", "Simulateur de physique", "/usr/share/icons/breeze/apps/48/step.svg"),
]


def slug_from_desktop(filename):
    base = filename.replace(".desktop", "")
    parts = base.split(".")
    return parts[-1].lower() if parts else base.lower()


def resolve_icon(icon_name):
    if not icon_name:
        return None
    names = [icon_name]
    if not icon_name.endswith((".png", ".svg")):
        names.extend([icon_name + ".png", icon_name + ".svg"])
    for name in names:
        for root in ("/usr/share/icons/hicolor", "/usr/share/icons/breeze"):
            for size in ("48x48", "scalable", "64x64", "22", "24", "32"):
                for sub in ("apps", "mimetypes", "preferences"):
                    path = f"{root}/{size}/{sub}/{name}"
                    if os.path.isfile(path):
                        return path
    return None


def sha_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def scan_desktop_apps():
    by_cat = defaultdict(list)
    app_dirs = [
        "/usr/share/applications",
        "/var/lib/flatpak/exports/share/applications",
        os.path.expanduser("~/.local/share/applications"),
    ]
    seen = set()
    for app_dir in app_dirs:
        if not os.path.isdir(app_dir):
            continue
        for fname in sorted(os.listdir(app_dir)):
            if not fname.endswith(".desktop"):
                continue
            path = os.path.join(app_dir, fname)
            try:
                text = open(path, encoding="utf-8", errors="replace").read()
            except OSError:
                continue
            if re.search(r"^NoDisplay=true", text, re.M) or re.search(r"^Hidden=true", text, re.M):
                continue
            name_m = re.search(r"^Name=(.+)$", text, re.M)
            comment_m = re.search(r"^Comment=(.+)$", text, re.M)
            icon_m = re.search(r"^Icon=(.+)$", text, re.M)
            cats_m = re.findall(r"^Categories=(.+)$", text, re.M)
            if not name_m or not cats_m:
                continue
            icon_remote = resolve_icon(icon_m.group(1).strip()) if icon_m else None
            if not icon_remote:
                continue
            slug = slug_from_desktop(fname)
            key = (slug, name_m.group(1).strip())
            if key in seen:
                continue
            seen.add(key)
            ext = os.path.splitext(icon_remote)[1] or ".png"
            row = {
                "id": slug,
                "name": name_m.group(1).strip(),
                "desc": comment_m.group(1).strip() if comment_m else "",
                "componentId": fname,
                "iconName": icon_m.group(1).strip() if icon_m else "",
                "iconRemote": icon_remote,
                "iconDest": f"{slug}{ext}",
                "sha256": sha_file(icon_remote),
                "bytes": os.path.getsize(icon_remote),
            }
            for cat_line in cats_m:
                for fc in cat_line.split(";"):
                    fc = fc.strip()
                    cap = FREEDESKTOP_TO_CAPSULE.get(fc)
                    if cap:
                        by_cat[cap].append(row)
    return by_cat


def apply_manual_vm_apps(by_cat):
    for cat_id, app_id, name, desc, icon_remote in MANUAL_VM_APPS:
        if not os.path.isfile(icon_remote):
            continue
        ext = os.path.splitext(icon_remote)[1] or ".png"
        row = {
            "id": app_id,
            "name": name,
            "desc": desc,
            "componentId": f"manual:{app_id}",
            "iconName": os.path.basename(icon_remote),
            "iconRemote": icon_remote,
            "iconDest": f"{app_id}{ext}",
            "sha256": sha_file(icon_remote),
            "bytes": os.path.getsize(icon_remote),
            "source": "manual-vm",
        }
        pool = by_cat.setdefault(cat_id, [])
        pool = [row] + [a for a in pool if a.get("id") != app_id]
        by_cat[cat_id] = pool[:MAX_PER_CAT]


by_cat = scan_desktop_apps()
apply_manual_vm_apps(by_cat)
categories = {}
icon_index = {}

for cat_id, label in LABELS.items():
    if cat_id == "addons":
        continue
    pool = by_cat.get(cat_id, [])
    deduped = []
    seen_ids = set()
    for app in pool:
        if app["id"] in seen_ids:
            continue
        seen_ids.add(app["id"])
        deduped.append(app)
        if len(deduped) >= MAX_PER_CAT:
            break
    categories[cat_id] = {
        "label": label,
        "source": "desktop-files",
        "appIds": [a["id"] for a in deduped],
        "apps": deduped,
    }
    for app in deduped:
        key = app["iconDest"]
        if key not in icon_index:
            icon_index[key] = {
                "dest": key,
                "remotePath": app["iconRemote"],
                "sha256": app["sha256"],
                "bytes": app["bytes"],
            }

def scan_plasma_addons(limit):
    picked = []
    plasma_dir = "/usr/share/plasma/plasmoids"
    if not os.path.isdir(plasma_dir):
        return picked
    for oid in sorted(os.listdir(plasma_dir)):
        meta_path = os.path.join(plasma_dir, oid, "metadata.json")
        if not os.path.isfile(meta_path):
            continue
        try:
            meta = json.load(open(meta_path, encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        kplugin = meta.get("KPlugin") or {}
        name = kplugin.get("Name") or meta.get("Name") or oid
        desc = kplugin.get("Description") or kplugin.get("Description[fr]") or meta.get("Description") or ""
        icon_name = kplugin.get("Icon") or meta.get("Icon") or "preferences-plugin"
        icon_remote = resolve_icon(icon_name)
        if not icon_remote:
            continue
        slug = re.sub(r"[^a-z0-9]+", "-", oid.split(".")[-1].lower()).strip("-") or "plasma-addon"
        ext = os.path.splitext(icon_remote)[1] or ".png"
        picked.append({
            "id": slug,
            "name": name if isinstance(name, str) else str(name),
            "desc": desc if isinstance(desc, str) else str(desc),
            "componentId": oid,
            "iconName": icon_name,
            "iconRemote": icon_remote,
            "iconDest": f"plasma-{slug}{ext}",
            "sha256": sha_file(icon_remote),
            "bytes": os.path.getsize(icon_remote),
        })
        if len(picked) >= limit:
            break
    return picked

addon_apps = scan_plasma_addons(MAX_PER_CAT)
categories["addons"] = {
    "label": LABELS["addons"],
    "source": "plasma-plasmoids",
    "appIds": [a["id"] for a in addon_apps],
    "apps": addon_apps,
}
for app in addon_apps:
    key = app["iconDest"]
    if key not in icon_index:
        icon_index[key] = {
            "dest": key,
            "remotePath": app["iconRemote"],
            "sha256": app["sha256"],
            "bytes": app["bytes"],
        }

browse_apps = []
seen_browse = set()
for cat_id, block in categories.items():
    for app in block["apps"]:
        if app["id"] in seen_browse:
            continue
        seen_browse.add(app["id"])
        browse_apps.append({
            "id": app["id"],
            "name": app["name"],
            "desc": app["desc"],
            "icon": app["iconDest"],
            "categories": [cat_id],
            "componentId": app["componentId"],
        })

doc = {
    "registryId": "linux-kde-neon",
    "surface": "discover-category-apps",
    "vm": os.environ.get("KDE_NEON_SSH", "goupil@192.168.123.52"),
    "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "maxPerCategory": MAX_PER_CAT,
    "method": "desktop-files Categories= → icônes hicolor/breeze",
    "categories": categories,
    "browseApps": browse_apps,
    "icons": list(icon_index.values()),
    "counts": {
        "categories": len(categories),
        "browseApps": len(browse_apps),
        "icons": len(icon_index),
    },
}
print(json.dumps(doc, indent=2, ensure_ascii=False))
PY
)"

echo "=== Inventaire apps catégories Discover — $SSH_TARGET ===" >&2
RAW="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "DISCOVER_CAT_MAX_APPS=$MAX_PER_CAT KDE_NEON_SSH=$SSH_TARGET python3 -" <<< "$REMOTE_SCRIPT")"

if [[ "$JSON_ONLY" == true ]]; then
  echo "$RAW"
  exit 0
fi

mkdir -p "$(dirname "$OUT_JSON")"
printf '%s\n' "$RAW" > "$OUT_JSON"
echo "→ $OUT_JSON" >&2
python3 -c "
import json, sys
d=json.load(open('$OUT_JSON'))
print(f\"  {d['counts']['categories']} catégories · {d['counts']['browseApps']} apps · {d['counts']['icons']} icônes\", file=sys.stderr)
"
