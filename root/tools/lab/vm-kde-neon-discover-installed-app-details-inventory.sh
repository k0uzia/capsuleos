#!/usr/bin/env bash
# Inventaire VM — métadonnées fiches Discover (onglet Installé(s), apps locales CapsuleOS).
#
# Usage :
#   KDE_NEON_SSH=<lab-inventory:linux-kde-neon> bash ...
#   bash root/tools/lab/vm-kde-neon-discover-installed-app-details-inventory.sh --json-only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lab-inventory-ssh.sh
source "$(dirname "$0")/lab-inventory-ssh.sh"
SSH_TARGET="${KDE_NEON_SSH:-$(resolve_lab_ssh linux-kde-neon KDE_NEON_SSH)}"
IDENTITY="${KDE_NEON_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
OUT_JSON="$ROOT/root/docs/inventaires/linux-kde-neon-discover-installed-app-details.json"
CATALOG="$ROOT/home/Debian/KDE-Neon/content/discover-catalog.json"
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

if [[ ! -f "$CATALOG" ]]; then
  echo "Catalogue absent: $CATALOG" >&2
  exit 1
fi

INSTALLED_IDS="$(node -e "
const c = require(process.argv[1]);
console.log((c.installed || []).map((a) => a.id).join(' '));
" "$CATALOG")"

REMOTE_SCRIPT="$(cat <<'PY'
import json, os, re, subprocess, xml.etree.ElementTree as ET
from datetime import datetime, timezone

INSTALLED_IDS = os.environ.get("CAPSULE_INSTALLED_IDS", "").split()

COMPONENT_MAP = {
    "ark": "org.kde.ark.desktop",
    "discover": "org.kde.discover.desktop",
    "dolphin": "org.kde.dolphin.desktop",
    "firefox": "org.mozilla.firefox",
    "gwenview": "org.kde.gwenview.desktop",
    "khelpcenter": "org.kde.khelpcenter",
    "kdeconnect": "org.kde.kdeconnect",
    "kate": "org.kde.kate.desktop",
    "konsole": "org.kde.konsole.desktop",
    "okular": "org.kde.okular.desktop",
    "systemsettings": "org.kde.systemsettings",
    "spectacle": "org.kde.spectacle.desktop",
    "systemmonitor": "org.kde.plasma-systemmonitor",
    "vlc": "org.videolan.vlc",
}

SEARCH_MAP = {
    "ark": "Ark",
    "discover": "Discover",
    "dolphin": "Dolphin",
    "firefox": "Firefox",
    "gwenview": "Gwenview",
    "khelpcenter": "Centre",
    "kdeconnect": "KDE Connect",
    "kate": "Kate",
    "konsole": "Konsole",
    "okular": "Okular",
    "systemsettings": "Paramètres",
    "spectacle": "Spectacle",
    "systemmonitor": "Surveillance",
    "vlc": "VLC",
}


def split_xml_docs(text):
    return [chunk.strip() for chunk in re.split(r"(?=<\?xml)", text) if chunk.strip()]


def fmt_kb(kb):
    if kb <= 0:
        return "0 o"
    if kb >= 1024 * 1024:
        v = kb / (1024 * 1024)
        return f"{v:.1f} Go".replace(".", ",")
    if kb >= 1024:
        v = kb / 1024
        if v < 10:
            return f"{v:.1f} Mo".replace(".", ",")
        return f"{round(v)} Mo"
    return f"{kb} Kio"


def text_from_desc(comp):
    desc = comp.find("description")
    if desc is None:
        return ""
    parts = []
    for el in list(desc):
        if el.tag == "p":
            t = "".join(el.itertext()).strip()
            if t:
                parts.append(t)
        elif el.tag == "ul":
            for li in el.findall("li"):
                t = "".join(li.itertext()).strip()
                if t:
                    parts.append("• " + t)
    return "\n\n".join(parts)


def pick_component(docs):
    installed = []
    for xml in docs:
        try:
            comp = ET.fromstring(xml)
        except ET.ParseError:
            continue
        pkg = (comp.findtext("pkgname") or "").strip()
        if not pkg:
            continue
        try:
            subprocess.check_output(["dpkg", "-s", pkg], stderr=subprocess.DEVNULL)
            installed.append(comp)
        except subprocess.CalledProcessError:
            pass
    if installed:
        return installed[0]
    for xml in docs:
        try:
            return ET.fromstring(xml)
        except ET.ParseError:
            continue
    return None


def detect_origin(pkg, version):
    try:
        pol = subprocess.check_output(["apt-cache", "policy", pkg], text=True, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        pol = ""
    if "archive.neon.kde.org" in pol or "zneon" in (version or ""):
        return "KDE neon"
    if "packages.mozilla.org" in pol:
        return "Mozilla"
    if "flathub" in pol.lower():
        return "Flathub"
    if "archive.ubuntu.com" in pol and "universe" in pol:
        return "ubuntu-noble-universe"
    if "archive.ubuntu.com" in pol:
        return "Ubuntu noble"
    return "Ubuntu noble"


def extract_screenshots(comp):
    shots = []
    for idx, shot in enumerate(comp.findall("screenshots/screenshot")):
        url = None
        for img in shot.findall("image"):
            if img.get("type") == "source":
                url = img.get("url")
                break
        if url:
            shots.append({"id": f"shot-{idx + 1}", "sourceUrl": url})
    return shots


apps = {}
errors = []

for app_id in INSTALLED_IDS:
    if not app_id:
        continue
    comp_id = COMPONENT_MAP.get(app_id)
    if not comp_id:
        errors.append({"id": app_id, "error": "componentId inconnu"})
        continue
    try:
        raw = subprocess.check_output(["appstreamcli", "dump", comp_id], text=True, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError as exc:
        errors.append({"id": app_id, "componentId": comp_id, "error": str(exc)})
        continue
    comp = pick_component(split_xml_docs(raw))
    if comp is None:
        errors.append({"id": app_id, "componentId": comp_id, "error": "composant AppStream introuvable"})
        continue
    pkg = (comp.findtext("pkgname") or app_id).strip()
    version, kb = "", 0
    try:
        dpkg = subprocess.check_output(["dpkg", "-s", pkg], text=True, stderr=subprocess.DEVNULL)
        for line in dpkg.splitlines():
            if line.startswith("Version:"):
                version = line.split(":", 1)[1].strip()
            if line.startswith("Installed-Size:"):
                kb = int(line.split(":", 1)[1].strip())
    except subprocess.CalledProcessError:
        pass
    dev_el = comp.find("developer/name")
    developer = (dev_el.text if dev_el is not None else comp.findtext("project_group") or "").strip()
    apps[app_id] = {
        "componentId": comp_id,
        "pkg": pkg,
        "searchQuery": SEARCH_MAP.get(app_id, comp.findtext("name") or app_id),
        "name": comp.findtext("name") or "",
        "summary": comp.findtext("summary") or "",
        "description": text_from_desc(comp),
        "version": version,
        "sizeKb": kb,
        "size": fmt_kb(kb),
        "license": comp.findtext("project_license") or "",
        "developer": developer,
        "verifiedDeveloper": developer.upper() == "KDE" or developer in ("VideoLAN", "Mozilla"),
        "origin": detect_origin(pkg, version),
        "installed": True,
        "primaryAction": "Lancer",
        "screenshots": extract_screenshots(comp),
    }

print(json.dumps({
    "registryId": "linux-kde-neon",
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "sshTarget": os.environ.get("CAPSULE_SSH_TARGET", ""),
    "installedIds": INSTALLED_IDS,
    "apps": apps,
    "errors": errors,
}, ensure_ascii=False, indent=2))
PY
)"

echo "Inventaire fiches installées → $OUT_JSON ($SSH_TARGET)"
RAW="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
  "CAPSULE_INSTALLED_IDS=$(printf '%q' "$INSTALLED_IDS") CAPSULE_SSH_TARGET=$(printf '%q' "$SSH_TARGET") python3 -c $(printf '%q' "$REMOTE_SCRIPT")")"

mkdir -p "$(dirname "$OUT_JSON")"
printf '%s\n' "$RAW" > "$OUT_JSON"

if $JSON_ONLY; then
  printf '%s\n' "$RAW"
else
  node -e "
const j = require(process.argv[1]);
const n = Object.keys(j.apps || {}).length;
const e = (j.errors || []).length;
console.log('Apps:', n, '· erreurs:', e);
if (e) console.log(JSON.stringify(j.errors, null, 2));
" "$OUT_JSON"
fi
