#!/usr/bin/env python3
"""
Manifeste distribution VM — applications (deb/snap/flatpak/user) + médias réplication.
Exécution VM : REGISTRY_ID=linux-ubuntu python3 vm-distribution-manifest.py
Depuis hôte : collect-vm-distribution-manifest.mjs --id linux-ubuntu --write --ssh
"""
from __future__ import annotations

import base64
import configparser
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


MANIFEST_VERSION = 2


def run(cmd: str, timeout: int = 45) -> str:
    try:
        return subprocess.check_output(
            cmd, shell=True, stderr=subprocess.DEVNULL, text=True, timeout=timeout
        ).strip()
    except Exception:
        return ""


def gget(schema: str, key: str) -> str:
    try:
        return subprocess.check_output(
            ["gsettings", "get", schema, key],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except Exception:
        return ""


def os_release() -> dict[str, str]:
    data: dict[str, str] = {}
    try:
        with open("/etc/os-release", encoding="utf-8") as f:
            for line in f:
                if "=" in line:
                    k, v = line.strip().split("=", 1)
                    data[k] = v.strip().strip('"')
    except OSError:
        pass
    return data


def detect_toolkit() -> dict[str, Any]:
    de = os.environ.get("XDG_CURRENT_DESKTOP", "")
    session = os.environ.get("XDG_SESSION_TYPE", "")
    detected = [x.strip() for x in de.split(":") if x.strip()]
    toolkit = "unknown"
    if any("GNOME" in x.upper() for x in detected):
        toolkit = "gnome"
    elif any("KDE" in x.upper() for x in detected):
        toolkit = "kde"
    elif any("CINNAMON" in x.upper() for x in detected):
        toolkit = "cinnamon"
    elif run("which gnome-shell"):
        toolkit = "gnome"
    elif run("which plasmashell"):
        toolkit = "kde"
    elif run("which cinnamon"):
        toolkit = "cinnamon"
    return {
        "id": toolkit,
        "xdgCurrentDesktop": de,
        "sessionType": session or "unknown",
        "detected": detected,
    }


def desktop_search_dirs() -> list[str]:
    home = Path.home()
    dirs = [
        "/usr/share/applications",
        "/usr/local/share/applications",
        "/var/lib/snapd/desktop/applications",
        "/var/lib/flatpak/exports/share/applications",
        str(home / ".local/share/flatpak/exports/share/applications"),
        str(home / ".local/share/applications"),
        "/usr/share/applications/kde4",
        "/usr/share/applications/kde5",
    ]
    return [d for d in dirs if os.path.isdir(d)]


def parse_desktop_file(path: str) -> dict[str, Any]:
    cp = configparser.ConfigParser(interpolation=None)
    cp.optionxform = str  # preserve case
    try:
        cp.read(path, encoding="utf-8")
    except Exception:
        return {}
    if not cp.has_section("Desktop Entry"):
        return {}
    sec = cp["Desktop Entry"]
    locales = {}
    for key in sec:
        if key.startswith("Name[") or key.startswith("GenericName["):
            locales[key] = sec[key]
    return {
        "type": sec.get("Type", ""),
        "name": sec.get("Name", ""),
        "nameFr": sec.get("Name[fr]", sec.get("Name[fr_FR]", "")),
        "genericName": sec.get("GenericName", ""),
        "icon": sec.get("Icon", ""),
        "exec": sec.get("Exec", ""),
        "categories": sec.get("Categories", ""),
        "onlyShowIn": sec.get("OnlyShowIn", ""),
        "notShowIn": sec.get("NotShowIn", ""),
        "noDisplay": sec.get("NoDisplay", "").lower() == "true",
        "hidden": sec.get("Hidden", "").lower() == "true",
        "startupWMClass": sec.get("StartupWMClass", ""),
        "mimeType": sec.get("MimeType", ""),
        "locales": locales,
    }


def desktop_origin(path: str) -> str:
    if "/snapd/" in path:
        return "snap"
    if "/flatpak/" in path:
        return "flatpak"
    if str(Path.home()) in path:
        return "user"
    return "system"


def normalize_desktop_id(desktop_id: str) -> str:
    aliases = {
        "firefox_firefox": "firefox",
        "snap-store_snap-store": "snap-store",
        "org.mozilla.firefox": "firefox",
    }
    if desktop_id in aliases:
        return aliases[desktop_id]
    m = re.match(r"^(.+)_\1$", desktop_id)
    if m:
        return m.group(1)
    return desktop_id


def toolkit_visibility(parsed: dict[str, Any], toolkit_id: str) -> dict[str, Any]:
    reasons: list[str] = []
    if parsed.get("type") and parsed["type"] != "Application":
        reasons.append("not-application")
    if parsed.get("noDisplay"):
        reasons.append("no-display")
    if parsed.get("hidden"):
        reasons.append("hidden")
    cats = (parsed.get("categories") or "").split(";")
    if "ConsoleOnly" in cats:
        reasons.append("console-only")

    only = (parsed.get("onlyShowIn") or "").split(";")
    only = [x.strip() for x in only if x.strip()]
    notshow = (parsed.get("notShowIn") or "").split(";")
    notshow = [x.strip() for x in notshow if x.strip()]

    de_tokens = {
        "gnome": ("GNOME",),
        "kde": ("KDE",),
        "cinnamon": ("X-Cinnamon", "Cinnamon"),
    }
    tokens = de_tokens.get(toolkit_id, ("GNOME", "KDE", "X-Cinnamon", "Cinnamon"))

    if only:
        if not any(t in only for t in tokens):
            reasons.append("only-show-in-mismatch")
    if notshow:
        if any(t in notshow for t in tokens):
            reasons.append("not-show-in")

    show_in_grid = len(reasons) == 0
    return {"showInGrid": show_in_grid, "hideReasons": reasons}


def deep_merge(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    if not base:
        return dict(patch) if patch else {}
    if not patch:
        return dict(base)
    out = dict(base)
    for key, val in patch.items():
        if key == "extends":
            continue
        if isinstance(val, list) and isinstance(out.get(key), list):
            seen: set[str] = set()
            merged: list[Any] = []
            for item in out[key] + val:
                marker = json.dumps(item, sort_keys=True) if isinstance(item, dict) else str(item)
                if marker in seen:
                    continue
                seen.add(marker)
                merged.append(item)
            out[key] = merged
        elif isinstance(val, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], val)
        else:
            out[key] = val
    return out


def _resolve_catalog_entry(catalog: dict[str, Any], entry: dict[str, Any] | None, stack: set[str]) -> dict[str, Any]:
    if not entry:
        return {}
    ext = entry.get("extends")
    base: dict[str, Any] = {}
    if ext:
        ext_key = str(ext)
        if ext_key not in stack:
            stack.add(ext_key)
            if ext_key.startswith("toolkit:"):
                tid = ext_key.split(":", 1)[1]
                base = _resolve_catalog_entry(catalog, catalog.get("toolkits", {}).get(tid), stack)
            elif ext_key.startswith("vendor:"):
                vid = ext_key.split(":", 1)[1]
                base = _resolve_catalog_entry(catalog, catalog.get("vendors", {}).get(vid), stack)
            stack.discard(ext_key)
    patch = {k: v for k, v in entry.items() if k != "extends"}
    return deep_merge(base, patch)


def _substitute_vendor(spec: dict[str, Any], vendor_id: str) -> dict[str, Any]:
    raw = json.dumps(spec).replace("{vendor}", vendor_id)
    return json.loads(raw)


def load_media_catalog(vendor_id: str, toolkit_id: str = "gnome") -> dict[str, Any]:
    raw_b64 = os.environ.get("CAPSULE_MEDIA_CATALOG_B64", "")
    if raw_b64:
        try:
            payload = json.loads(base64.b64decode(raw_b64).decode("utf-8"))
            if payload.get("resolved"):
                return payload["resolved"]
            catalog = payload
            vid = payload.get("vendorId") or vendor_id
            tid = payload.get("toolkitId") or toolkit_id
            spec: dict[str, Any] = {}
            if catalog.get("vendors", {}).get(vid):
                spec = _resolve_catalog_entry(catalog, catalog["vendors"][vid], set())
            elif catalog.get("toolkits", {}).get(tid):
                spec = _resolve_catalog_entry(catalog, catalog["toolkits"][tid], set())
            else:
                spec = _resolve_catalog_entry(catalog, catalog.get("fallback", {}).get("_gnome", {}), set())
            return _substitute_vendor(spec, vid)
        except (json.JSONDecodeError, ValueError):
            pass
    return {}


def theme_name_variants(icon_theme: str) -> list[str]:
    if not icon_theme:
        return ["hicolor", "Adwaita", "Yaru"]
    names = [icon_theme]
    for suffix in ("-dark", "-light", "-Dark", "-Light"):
        if icon_theme.endswith(suffix):
            names.append(icon_theme[: -len(suffix)])
    names.extend(["hicolor", "Adwaita", "Yaru", "breeze"])
    return list(dict.fromkeys(n for n in names if n))


def resolve_theme_icon_in_context(
    icon_name: str,
    icon_theme: str,
    context: str,
    *,
    prefer_svg: bool = True,
) -> str | None:
    """Résout une icône thème (mimetypes, places, emblems, apps, symbolic/...)."""
    clean = icon_name.replace(".svg", "").replace(".png", "")
    themes = theme_name_variants(icon_theme)
    sizes = ("scalable", "512x512", "256x256", "48x48", "32x32", "24x24", "16x16")
    exts = ("svg", "png") if prefer_svg else ("png", "svg")
    parts = context.split("/")
    if parts[0] == "symbolic" and len(parts) == 2:
        ctx_path = f"symbolic/{parts[1]}"
    else:
        ctx_path = context
    for theme in themes:
        base = f"/usr/share/icons/{theme}"
        if not os.path.isdir(base):
            continue
        for size in sizes:
            for ext in exts:
                p = f"{base}/{size}/{ctx_path}/{clean}.{ext}"
                if os.path.isfile(p):
                    return p
        # Adwaita/Yaru : symbolic souvent sans répertoire de taille
        if ctx_path.startswith("symbolic/"):
            for ext in exts:
                p = f"{base}/{ctx_path}/{clean}.{ext}"
                if os.path.isfile(p):
                    return p
    return None


def resolve_icon_paths(icon_name: str, icon_theme: str) -> list[str]:
    if not icon_name:
        return []
    if os.path.isabs(icon_name) and os.path.isfile(icon_name):
        return [icon_name]
    themes = [icon_theme, "hicolor", "Adwaita", "Yaru", "breeze", "Mint-Y"]
    sizes = ("scalable", "512x512", "256x256", "128x128", "64x64", "48x48", "32x32", "24x24", "16x16")
    contexts = ("apps", "places", "devices", "status", "emblems", "mimetypes", "categories")
    exts = ("svg", "png", "xpm")
    found: list[str] = []
    for theme in themes:
        if not theme:
            continue
        base = f"/usr/share/icons/{theme}"
        if not os.path.isdir(base):
            continue
        for ctx in contexts:
            for size in sizes:
                for ext in exts:
                    p = f"{base}/{size}/{ctx}/{icon_name}.{ext}"
                    if os.path.isfile(p):
                        found.append(p)
        for ext in exts:
            p = f"{base}/{icon_name}.{ext}"
            if os.path.isfile(p):
                found.append(p)
    # Snap absolute fallback
    if icon_name.startswith("/") and os.path.isfile(icon_name):
        found.insert(0, icon_name)
    return list(dict.fromkeys(found))[:8]


def scan_applications(toolkit_id: str) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    seen_paths: set[str] = set()

    for base in desktop_search_dirs():
        for fname in sorted(os.listdir(base)):
            if not fname.endswith(".desktop"):
                continue
            fpath = os.path.join(base, fname)
            if fpath in seen_paths:
                continue
            seen_paths.add(fpath)
            desktop_id = fname[:-8]
            parsed = parse_desktop_file(fpath)
            if not parsed:
                continue
            norm_id = normalize_desktop_id(desktop_id)
            vis = toolkit_visibility(parsed, toolkit_id)
            entries.append({
                "id": desktop_id,
                "normalizedId": norm_id,
                "name": parsed.get("nameFr") or parsed.get("name") or desktop_id,
                "nameEn": parsed.get("name") or desktop_id,
                "icon": parsed.get("icon") or None,
                "categories": parsed.get("categories") or None,
                "desktopPath": fpath,
                "origin": desktop_origin(fpath),
                "exec": parsed.get("exec") or None,
                "showInGrid": vis["showInGrid"],
                "hideReasons": vis["hideReasons"],
            })

    # Flatpak metadata (apps sans .desktop exporté)
    flatpak_raw = run("flatpak list --app --columns=application,ref,name 2>/dev/null")
    flatpak_apps: list[dict[str, str]] = []
    for line in flatpak_raw.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            flatpak_apps.append({
                "application": parts[0].strip(),
                "ref": parts[1].strip() if len(parts) > 1 else "",
                "name": parts[2].strip() if len(parts) > 2 else parts[0].strip(),
            })

    # Dédupliquer par normalizedId — préférer system > flatpak > snap > user
    rank = {"system": 0, "flatpak": 1, "snap": 2, "user": 3}
    by_norm: dict[str, dict[str, Any]] = {}
    for entry in entries:
        key = entry["normalizedId"]
        prev = by_norm.get(key)
        if not prev or rank.get(entry["origin"], 9) < rank.get(prev["origin"], 9):
            by_norm[key] = entry

    grid_visible = [e for e in by_norm.values() if e["showInGrid"]]
    favorites: list[str] = []
    if toolkit_id == "gnome":
        fav_raw = gget("org.gnome.shell", "favorite-apps")
        if fav_raw:
            favorites = [
                x.strip().strip("'") for x in fav_raw.replace("[", "").replace("]", "").split(",") if x.strip()
            ]

    return {
        "searchPaths": desktop_search_dirs(),
        "entryCount": len(entries),
        "uniqueCount": len(by_norm),
        "gridVisibleCount": len(grid_visible),
        "entries": sorted(by_norm.values(), key=lambda e: (e["name"] or "").lower()),
        "gridVisible": sorted(grid_visible, key=lambda e: (e["name"] or "").lower()),
        "flatpak": flatpak_apps,
        "favorites": favorites,
    }


def scan_theme_media(toolkit_id: str) -> dict[str, Any]:
    icon_theme = ""
    gtk_theme = ""
    bg_uri = ""
    if toolkit_id == "gnome":
        icon_theme = gget("org.gnome.desktop.interface", "icon-theme").strip("'")
        gtk_theme = gget("org.gnome.desktop.interface", "gtk-theme").strip("'")
        bg_uri = gget("org.gnome.desktop.background", "picture-uri").strip("'")
    elif toolkit_id == "kde":
        icon_theme = run("kreadconfig6 --file kdeglobals --group Icons --key Theme") or "breeze"
    elif toolkit_id == "cinnamon":
        icon_theme = run("gsettings get org.cinnamon.desktop.interface icon-theme").strip("'") or "Mint-Y"

    wallpapers: list[dict[str, Any]] = []
    if bg_uri.startswith("file://"):
        wp = bg_uri[7:]
        if os.path.isfile(wp):
            wallpapers.append({
                "vmPath": wp,
                "uri": bg_uri,
                "capsuleTarget": "images/vendors/{vendor}/wallpaper/",
                "format": os.path.splitext(wp)[1].lstrip("."),
            })
    # Fonds système courants (Ubuntu / GNOME)
    for candidate in (
        "/usr/share/backgrounds/ubuntu-noble-default.png",
        "/usr/share/backgrounds/ubuntu-noble-default-dark.png",
        "/usr/share/backgrounds/gnome/adwaita-l.jxl",
    ):
        if os.path.isfile(candidate) and not any(w["vmPath"] == candidate for w in wallpapers):
            wallpapers.append({
                "vmPath": candidate,
                "uri": f"file://{candidate}",
                "capsuleTarget": "images/vendors/{vendor}/wallpaper/",
                "format": os.path.splitext(candidate)[1].lstrip("."),
            })

    return {
        "iconTheme": icon_theme,
        "gtkTheme": gtk_theme,
        "backgroundUri": bg_uri or None,
        "wallpapers": wallpapers,
        "cursorTheme": gget("org.gnome.desktop.interface", "cursor-theme").strip("'") if toolkit_id == "gnome" else "",
        "fontName": gget("org.gnome.desktop.interface", "font-name").strip("'") if toolkit_id == "gnome" else "",
        "monospaceFontName": gget("org.gnome.desktop.interface", "monospace-font-name").strip("'") if toolkit_id == "gnome" else "",
        "documentFontName": gget("org.gnome.desktop.interface", "document-font-name").strip("'") if toolkit_id == "gnome" else "",
    }


def scan_fonts(toolkit_id: str, vendor_id: str, catalog: dict[str, Any]) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    seen: set[str] = set()

    def add_font(family: str, style: str, vm_path: str, source: str) -> None:
        if not vm_path or vm_path in seen or not os.path.isfile(vm_path):
            return
        seen.add(vm_path)
        base = os.path.basename(vm_path)
        capsule_dir = catalog.get("fonts", [{}])[0].get("capsuleDir", f"fonts/vendors/{vendor_id}")
        entries.append({
            "family": family,
            "style": style,
            "vmPath": vm_path,
            "capsuleTarget": f"{capsule_dir}/{base}",
            "source": source,
        })

    for group in catalog.get("fonts", []):
        for candidate in group.get("vmCandidates", []):
            if os.path.isfile(candidate):
                add_font("catalog", "catalog", candidate, "media-catalog")

    raw = run("fc-list --format '%{family}\\t%{style}\\t%{file}\\n' 2>/dev/null | sort -u")
    families: dict[str, list[dict[str, str]]] = {}
    for line in raw.splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        fam, style, fpath = parts[0], parts[1], parts[2]
        families.setdefault(fam, []).append({"style": style, "file": fpath})

    ui_prefs = []
    mono_prefs = []
    if toolkit_id == "gnome":
        ui_raw = gget("org.gnome.desktop.interface", "font-name").strip("'")
        mono_raw = gget("org.gnome.desktop.interface", "monospace-font-name").strip("'")
        if ui_raw:
            ui_prefs.append(ui_raw.split()[0])
        if mono_raw:
            mono_prefs.append(mono_raw.split()[0])

    priority_ui = ui_prefs + ["Ubuntu", "Cantarell", "Adwaita Sans", "Noto Sans", "Inter"]
    priority_mono = mono_prefs + ["Ubuntu Mono", "Adwaita Mono", "DejaVu Sans Mono", "Liberation Mono"]

    ui_selected = []
    for fam in priority_ui:
        if fam in families:
            ui_selected.append({"family": fam, "variants": families[fam][:6]})
            for v in families[fam][:2]:
                add_font(fam, v["style"], v["file"], "gsettings-ui" if fam in ui_prefs else "fc-priority")

    mono_selected = []
    for fam in priority_mono:
        if fam in families:
            mono_selected.append({"family": fam, "variants": families[fam][:4]})
            for v in families[fam][:1]:
                add_font(fam, v["style"], v["file"], "gsettings-mono" if fam in mono_prefs else "fc-priority")

    return {
        "ui": ui_selected,
        "monospace": mono_selected,
        "entries": entries,
        "totalFamilies": len(families),
        "entryCount": len(entries),
    }


def scan_theme_icon_set(
    icon_names: list[str],
    icon_theme: str,
    context: str,
    capsule_prefix: str,
) -> list[dict[str, Any]]:
    entries = []
    for name in icon_names:
        clean = name.replace(".svg", "").replace(".png", "")
        vm_path = resolve_theme_icon_in_context(clean, icon_theme, context)
        if not vm_path:
            continue
        ext = os.path.splitext(vm_path)[1]
        entries.append({
            "iconName": clean,
            "context": context,
            "vmPath": vm_path,
            "capsuleTarget": f"{capsule_prefix}/{clean}{ext}",
        })
    return entries


def scan_symbolic_set(
    symbolic_spec: dict[str, list[str]],
    icon_theme: str,
    capsule_prefix: str,
) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for subctx, names in (symbolic_spec or {}).items():
        ctx = f"symbolic/{subctx}"
        items = scan_theme_icon_set(names, icon_theme, ctx, f"{capsule_prefix}/symbolic/{subctx}")
        out[subctx] = items
    out["entryCount"] = sum(len(v) for k, v in out.items() if k != "entryCount" and isinstance(v, list))
    return out


def scan_panel_icons(catalog: dict[str, Any], icon_theme: str) -> list[dict[str, Any]]:
    entries = []
    for spec in catalog.get("panel", []):
        icon = spec.get("icon", "")
        size = spec.get("size", "scalable")
        vm_path = None
        if size == "48x48":
            vm_path = resolve_theme_icon_in_context(icon, icon_theme, "apps", prefer_svg=False)
        if not vm_path:
            vm_path = resolve_theme_icon_in_context(icon, icon_theme, "apps")
        if not vm_path:
            vm_path = resolve_theme_icon_in_context(icon, "hicolor", "apps")
        if not vm_path:
            continue
        entries.append({
            "iconName": icon,
            "vmPath": vm_path,
            "capsuleTarget": spec.get("capsule"),
        })
    return entries


def scan_branding(catalog: dict[str, Any]) -> dict[str, Any] | None:
    branding = catalog.get("branding")
    if not branding:
        return None
    for candidate in branding.get("vmCandidates", []):
        if os.path.isfile(candidate):
            return {
                "vmPath": candidate,
                "capsuleTarget": branding.get("capsule"),
            }
    return None


def discover_wallpapers(extra_candidates: list[str] | None = None) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    seen: set[str] = set()

    def add(wp: str, source: str) -> None:
        if not wp or wp in seen or not os.path.isfile(wp):
            return
        seen.add(wp)
        found.append({
            "vmPath": wp,
            "uri": f"file://{wp}",
            "capsuleTarget": "images/vendors/{vendor}/wallpaper/",
            "format": os.path.splitext(wp)[1].lstrip("."),
            "source": source,
        })

    for c in extra_candidates or []:
        add(c, "catalog")
    scan_out = run(
        "find /usr/share/backgrounds -maxdepth 4 -type f "
        "\\( -name '*.png' -o -name '*.jxl' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \\) "
        "! -path '*/.*' 2>/dev/null | sort -u | head -40"
    )
    for line in scan_out.splitlines():
        add(line.strip(), "find")
    return found


def build_media_bundle(
    vendor_id: str,
    toolkit_id: str,
    icon_theme: str,
    catalog: dict[str, Any],
    applications: dict[str, Any],
) -> dict[str, Any]:
    icon_pack = catalog.get("iconPack", "icons/gnome/adwaita")
    fonts = scan_fonts(toolkit_id, vendor_id, catalog)
    mimetypes = scan_theme_icon_set(
        catalog.get("mimetypes", []), icon_theme, "mimetypes", f"{icon_pack}/mimetypes",
    )
    places = scan_theme_icon_set(
        catalog.get("places", []), icon_theme, "places", f"{icon_pack}/places",
    )
    emblems = scan_theme_icon_set(
        catalog.get("emblems", []), icon_theme, "emblems", f"{icon_pack}/emblems",
    )
    symbolic = scan_symbolic_set(catalog.get("symbolic", {}), icon_theme, icon_pack)
    panel = scan_panel_icons(catalog, icon_theme)
    branding = scan_branding(catalog)
    wallpapers = discover_wallpapers(catalog.get("wallpaperCandidates"))
    app_icons = build_app_icons(applications, icon_theme)

    return {
        "iconPack": icon_pack,
        "fonts": fonts,
        "mimetypes": {"theme": icon_theme, "entries": mimetypes, "entryCount": len(mimetypes)},
        "places": {"theme": icon_theme, "entries": places, "entryCount": len(places)},
        "emblems": {"theme": icon_theme, "entries": emblems, "entryCount": len(emblems)},
        "symbolic": symbolic,
        "panel": {"entries": panel, "entryCount": len(panel)},
        "branding": branding,
        "wallpapers": wallpapers,
        "appIcons": app_icons,
    }


def build_app_icons(applications: dict[str, Any], icon_theme: str) -> list[dict[str, Any]]:
    icons: list[dict[str, Any]] = []
    for app in applications.get("gridVisible", []):
        icon_name = app.get("icon") or ""
        paths = resolve_icon_paths(icon_name, icon_theme)
        icons.append({
            "appId": app["normalizedId"],
            "desktopId": app["id"],
            "iconName": icon_name,
            "vmPaths": paths,
            "capsuleTarget": f"images/toolkits/gnome/apps/{app['normalizedId']}",
        })
    return icons


def _bundle_from_entries(
    bundle_id: str,
    category: str,
    dest_root: str,
    entries: list[dict[str, Any]],
    path_key: str = "vmPath",
) -> dict[str, Any] | None:
    paths = sorted({e[path_key] for e in entries if e.get(path_key) and os.path.isfile(e.get(path_key, ""))})
    if not paths:
        return None
    return {"id": bundle_id, "category": category, "destRoot": dest_root, "vmPaths": paths}


def build_import_plan(vendor: str, media: dict[str, Any]) -> dict[str, Any]:
    bundles: list[dict[str, Any]] = []
    assets = "usr/share/capsuleos/assets"

    app_paths = [i["vmPaths"][0] for i in media.get("appIcons", []) if i.get("vmPaths")]
    b = _bundle_from_entries("app-icons", "applications", f"{assets}/images/toolkits/gnome/apps", [
        {"vmPath": p} for p in app_paths
    ])
    if b:
        bundles.append(b)

    for section, cat, subdir in (
        ("fonts", "fonts", media.get("fonts", {}).get("entries", [])),
        ("mimetypes", "mimetypes", media.get("mimetypes", {}).get("entries", [])),
        ("places", "places", media.get("places", {}).get("entries", [])),
        ("emblems", "emblems", media.get("emblems", {}).get("entries", [])),
        ("panel", "panel", media.get("panel", {}).get("entries", [])),
    ):
        if section == "fonts":
            font_entries = media.get("fonts", {}).get("entries", [])
            if font_entries:
                sample = font_entries[0].get("capsuleTarget", f"fonts/vendors/{vendor}/font.ttf")
                dest = f"{assets}/{os.path.dirname(sample)}"
                fb = _bundle_from_entries("fonts", "fonts", dest, font_entries)
                if fb:
                    bundles.append(fb)
            continue
        pack = media.get("iconPack", "icons/gnome/adwaita")
        dest = f"{assets}/{pack}/{cat}" if cat != "panel" else f"{assets}/images/vendors/{vendor}/panel"
        fb = _bundle_from_entries(f"{cat}-icons", cat, dest, subdir if isinstance(subdir, list) else [])
        if fb:
            bundles.append(fb)

    symbolic = media.get("symbolic", {})
    pack = media.get("iconPack", "icons/gnome/adwaita")
    for subctx in ("actions", "places", "status"):
        items = symbolic.get(subctx, [])
        if not isinstance(items, list):
            continue
        fb = _bundle_from_entries(
            f"symbolic-{subctx}", "symbolic",
            f"{assets}/{pack}/symbolic/{subctx}", items,
        )
        if fb:
            bundles.append(fb)

    branding = media.get("branding") or {}
    if branding.get("vmPath"):
        bundles.append({
            "id": "branding",
            "category": "branding",
            "destRoot": f"{assets}/images/vendors/{vendor}",
            "vmPaths": [branding["vmPath"]],
        })

    wp_paths = sorted({w["vmPath"] for w in media.get("wallpapers", []) if w.get("vmPath")})[:20]
    if wp_paths:
        bundles.append({
            "id": "wallpapers",
            "category": "wallpaper",
            "destRoot": f"{assets}/images/vendors/{vendor}/wallpaper",
            "vmPaths": wp_paths,
        })

    return {
        "status": "pending",
        "method": "rsync",
        "destAssetsRoot": assets,
        "bundleCount": len(bundles),
        "bundles": bundles,
        "notes": "Playbook manifest → staging VM → import-manifest-staging.mjs",
    }


def vendor_from_os(os_data: dict[str, str], registry_id: str) -> str:
    if os_data.get("ID"):
        return os_data["ID"].lower()
    m = re.match(r"linux-(\w+)", registry_id)
    return m.group(1) if m else "unknown"


def scan_packages() -> dict[str, Any]:
    dpkg = run("dpkg-query -W -f='${Package}\\t${Version}\\n' 2>/dev/null | wc -l")
    snaps = run("snap list 2>/dev/null | tail -n +2 | wc -l")
    flatpaks = run("flatpak list --app 2>/dev/null | wc -l")
    return {
        "dpkgCount": int(dpkg) if dpkg.isdigit() else 0,
        "snapCount": int(snaps) if snaps.isdigit() else 0,
        "flatpakCount": int(flatpaks) if flatpaks.isdigit() else 0,
    }


def main() -> None:
    registry_id = os.environ.get("REGISTRY_ID", "linux-unknown")
    vendor_id = os.environ.get("VENDOR_ID") or vendor_from_os(os_release(), registry_id)
    os_data = os_release()
    toolkit = detect_toolkit()
    catalog = load_media_catalog(vendor_id, toolkit["id"])
    applications = scan_applications(toolkit["id"])
    theme_meta = scan_theme_media(toolkit["id"])
    icon_theme = theme_meta.get("iconTheme") or "Yaru"
    media = build_media_bundle(vendor_id, toolkit["id"], icon_theme, catalog, applications)
    media.update({
        k: theme_meta[k] for k in (
            "iconTheme", "gtkTheme", "backgroundUri", "cursorTheme",
            "fontName", "monospaceFontName", "documentFontName",
        ) if k in theme_meta
    })
    # Fusion fonds gsettings + scan
    wp_seen = {w["vmPath"] for w in media.get("wallpapers", [])}
    for wp in theme_meta.get("wallpapers", []):
        if wp.get("vmPath") and wp["vmPath"] not in wp_seen:
            media.setdefault("wallpapers", []).append(wp)
            wp_seen.add(wp["vmPath"])
    vendor = vendor_from_os(os_data, registry_id)
    dist_slug = f"{vendor}-manifest"

    manifest = {
        "manifestVersion": MANIFEST_VERSION,
        "registryId": registry_id,
        "distribution": {
            "id": os_data.get("ID", vendor),
            "version": os_data.get("VERSION_ID", ""),
            "prettyName": os_data.get("PRETTY_NAME", registry_id),
            "codename": os_data.get("VERSION_CODENAME", ""),
            "slug": dist_slug,
        },
        "toolkit": toolkit,
        "mediaCatalogVendor": vendor_id,
        "collectedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "root/tools/lab/vm-distribution-manifest.py",
        "validation": {
            "status": "draft",
            "smokeOk": False,
            "approved": False,
            "approvedAt": None,
            "approvedBy": None,
        },
        "packages": scan_packages(),
        "applications": applications,
        "media": media,
        "import": build_import_plan(vendor, media),
    }

    json.dump(manifest, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
