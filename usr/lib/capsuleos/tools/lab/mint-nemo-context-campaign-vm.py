#!/usr/bin/env python3
"""Campagne menus contextuels Nemo — VM Mint (xdotool + pyatspi)."""
import json
import os
import subprocess
import sys
import time

DISPLAY = os.environ.get("DISPLAY", ":0")
os.environ["DISPLAY"] = DISPLAY


def run(cmd, timeout=20):
    try:
        return subprocess.check_output(
            cmd, shell=True, stderr=subprocess.DEVNULL, text=True, timeout=timeout,
        ).strip()
    except Exception:
        return ""


def xdo(*args):
    subprocess.run(["xdotool", *args], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def find_nemo_wid():
    wids = run("xdotool search --onlyvisible --class Nemo").splitlines()
    best = ""
    best_w = 0
    for wid in wids:
        shell = run(f"xdotool getwindowgeometry --shell {wid}")
        width = 0
        for line in shell.splitlines():
            if line.startswith("WIDTH="):
                width = int(line.split("=", 1)[1])
        if width > best_w:
            best_w = width
            best = wid
    return best


def open_nemo_path(nemo_path):
    subprocess.Popen(
        ["nemo", nemo_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.8)
    return find_nemo_wid()


def dismiss():
    xdo("key", "Escape")
    time.sleep(0.15)


def right_click_window(wid, relx, rely):
    xdo("windowactivate", "--sync", wid)
    time.sleep(0.25)
    xdo("mousemove", "--window", wid, str(relx), str(rely))
    xdo("click", "3")
    time.sleep(0.9)


def right_click_sidebar(wid, place):
    mapping = {
        "Dossier personnel": (80, 120),
        "Documents": (80, 160),
        "Téléchargements": (80, 220),
        "Corbeille": (80, 260),
    }
    x, y = mapping.get(place, (80, 200))
    xdo("windowactivate", "--sync", wid)
    time.sleep(0.2)
    xdo("mousemove", "--window", wid, str(x), str(y))
    xdo("click", "3")
    time.sleep(0.9)


def menu_items(menu):
    items = []
    seps = 0
    submenus = {}
    for child in menu:
        role = child.getRoleName()
        name = (child.name or "").strip()
        if role == "separator":
            seps += 1
        elif role == "menu item" and name and name != "Vide":
            items.append(name)
            if child.childCount > 0:
                for sub in child:
                    if "menu" in (sub.getRoleName() or "").lower():
                        sub_labels = [
                            c.name.strip()
                            for c in sub
                            if c.getRoleName() == "menu item" and c.name and c.name.strip() != "Vide"
                        ]
                        if sub_labels:
                            submenus[name] = sub_labels
        elif role == "menu" and name:
            sub_labels = [
                c.name.strip()
                for c in child
                if c.getRoleName() == "menu item" and c.name and c.name.strip() != "Vide"
            ]
            if sub_labels:
                submenus[name] = sub_labels
    return items, seps, submenus


def capture_popup_menu():
    import pyatspi

    desktop = pyatspi.Registry.getDesktop(0)
    best = None
    best_labels = []

    def walk(node, in_menubar=False):
        nonlocal best, best_labels
        try:
            role = (node.getRoleName() or "").lower()
            if role == "menu bar":
                in_menubar = True
            if role in ("menu", "popup menu") and not in_menubar:
                labels, _, _ = menu_items(node)
                if len(labels) >= 2 and len(labels) > len(best_labels):
                    best = node
                    best_labels = labels
            for i in range(node.childCount):
                walk(node.getChildAtIndex(i), in_menubar)
        except Exception:
            pass

    for i in range(desktop.childCount):
        app = desktop.getChildAtIndex(i)
        aname = (app.name or "").lower()
        if "nemo" in aname and "desktop" not in aname:
            walk(app)

    if best:
        labels, seps, subs = menu_items(best)
        return {"visible": True, "labels": labels, "separators": seps, "submenus": subs}
    return {"visible": False, "labels": [], "separators": 0, "submenus": {}}


def hover_submenu(parent_label):
    import pyatspi

    desktop = pyatspi.Registry.getDesktop(0)
    for i in range(desktop.childCount):
        app = desktop.getChildAtIndex(i)
        if "nemo" not in (app.name or "").lower():
            continue
        for child in app:
            if "menu" not in (child.getRoleName() or "").lower():
                continue
            for item in child:
                if item.getRoleName() == "menu item" and (item.name or "").strip() == parent_label:
                    try:
                        action = item.queryAction()
                        action.doAction(0)
                    except Exception:
                        pass
                    time.sleep(0.5)
                    for sub in item:
                        if "menu" in (sub.getRoleName() or "").lower():
                            labels = [
                                c.name.strip()
                                for c in sub
                                if c.getRoleName() == "menu item" and c.name and c.name.strip() != "Vide"
                            ]
                            return {"visible": True, "labels": labels}
    return {"visible": False, "labels": []}


def run_scenario(sc):
    setup = sc.get("setup") or {}
    trigger = sc.get("trigger") or {}
    path_map = {
        "home": os.path.expanduser("~"),
        "Documents": os.path.expanduser("~/Documents"),
        "Bureau": os.path.expanduser("~/Desktop"),
        "Images": os.path.expanduser("~/Images"),
        "Téléchargements": os.path.expanduser("~/Downloads"),
        "Corbeille": "trash://",
        "Modèles": os.path.expanduser("~/Templates"),
    }
    nav = setup.get("navigate", "home")
    nemo_path = path_map.get(nav, os.path.expanduser("~"))
    wid = open_nemo_path(nemo_path)
    if not wid:
        return {"visible": False, "labels": [], "error": "no-nemo-window"}

    dismiss()

    if trigger.get("type") == "submenu":
        right_click_window(wid, 600, 400)
        parent = (
            "Créer un nouveau document"
            if trigger.get("parentAction") == "new-document"
            else "Ouvrir avec…"
        )
        sub = hover_submenu(parent)
        dismiss()
        return sub

    target = trigger.get("target")
    if target == "sidebar-place":
        right_click_sidebar(wid, trigger.get("place", "Corbeille"))
    elif target == "item":
        right_click_window(wid, 600, 350)
    elif target == "pathbar":
        right_click_window(wid, 400, 40)
    elif target == "toolbar":
        right_click_window(wid, 700, 40)
    else:
        right_click_window(wid, 600, 400)

    cap = capture_popup_menu()
    dismiss()
    return cap


def main():
    data = json.load(sys.stdin)
    scenarios = data.get("scenarios", [])
    results = {}
    for sc in scenarios:
        sid = sc["id"]
        try:
            cap = run_scenario(sc)
            cap["scenarioId"] = sid
            cap["label"] = sc.get("label")
            results[sid] = cap
        except Exception as exc:
            results[sid] = {
                "visible": False,
                "labels": [],
                "error": str(exc),
                "scenarioId": sid,
            }
    print(json.dumps({"results": results}, ensure_ascii=False))


if __name__ == "__main__":
    main()
