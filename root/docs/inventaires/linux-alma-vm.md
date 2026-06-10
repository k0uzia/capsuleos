# Inventaire VM — AlmaLinux (GNOME)

> Collecte : `2026-06-09T16:56:49Z` · Registre : `linux-alma` · JSON : [`linux-alma-vm.json`](linux-alma-vm.json)

## Distribution

| Champ | Valeur |
|-------|--------|
| Nom | AlmaLinux 10.2 (Lavender Lion) |
| GNOME Shell | GNOME Shell 49.4 |
| Accent | blue (#3584e4) |
| Favoris dash | 7 |

## Applications mappées

- **Calendar** → slot `calendar`
- **Nautilus** → slot `nemo`
- **GNOME Software** → slot `update_manager`
- **Ptyxis** → slot `terminal`
- **GNOME Text Editor** → slot `text_editor`
- **Calculator** → slot `calculator`

## Captures écran VM (apps P0)

| Prérequis | Détail |
|-----------|--------|
| Session | GDM — utilisateur `capsule` connecté au bureau Wayland |
| Backend primaire | `org.gnome.Shell.Screenshot` (D-Bus session) |
| Repli | `gnome-screenshot -w` (absent du CRB el10 par défaut) |
| Repli hôte | `virsh screenshot almalinux10` (domaine non listé sur hôte agent) |
| Paquets VM | `wmctrl`, `gtk-launch` ; optionnel `gnome-screenshot` |
| Variables SSH | `DISPLAY=:0`, `XAUTHORITY=/run/user/UID/.mutter-Xwaylandauth.*`, `DBUS_SESSION_BUS_ADDRESS` |

**Écarts connus (2026-06-10)** : D-Bus `AccessDenied` via SSH ; `virsh list` sur hôte agent ne montre pas `almalinux10` (VM joignable en `192.168.122.199`). Playbook : `root/tools/lab/vm-apps-visual-playbook.sh` · collecteur : `collect-vm-apps-visual-investigation.mjs --id linux-alma --ssh`.

## Suite playbook

```bash
node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id linux-alma
bash root/tools/lab/pull-vm-assets.sh --id linux-alma
```

